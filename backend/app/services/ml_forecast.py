"""
Production-grade ML ensemble for AQI time-series forecasting.

Pipeline
--------
1. Aggregate hourly → daily AQI (EPA rules)
2. Train/test split: 80 % train | 20 % test (temporal)
3. Train four models:
     (a) Naive Seasonal  — baseline
     (b) Holt-Winters    — statistical baseline
     (c) Prophet         — handles Diwali / stubble-burning / Indian seasonality
     (d) XGBoost         — lag features + cyclical calendar + Indian season flags
4. Weighted ensemble (weights ∝ 1 / validation MAE)
5. Evaluate all models on held-out test set → comparison table
6. Return 14-day ensemble forecast with 95 % CI
"""

from __future__ import annotations

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from datetime import timedelta, date
from typing import Dict, List, Tuple, Any

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import xgboost as xgb

def _check_prophet() -> bool:
    try:
        import cmdstanpy
        cmdstanpy.cmdstan_path()          # raises if Stan not found
        from prophet import Prophet       # noqa: F401
        Prophet()                         # raises if stan_backend fails
        return True
    except Exception:
        return False

try:
    from prophet import Prophet
    _PROPHET_OK = _check_prophet()
except Exception:
    _PROPHET_OK = False

from app.utils.aqi_calculator import calc_aqi
from app.config.india import get_indian_holidays, is_stubble_burning_season


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Daily aggregation
# ═══════════════════════════════════════════════════════════════════════════════

def compute_daily_aqi(hourly_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate hourly Open-Meteo data to daily and compute EPA sub-AQIs.
    EPA averaging:
      PM2.5, PM10 → 24 h mean
      O3, CO      → max of 8 h rolling mean
      NO2, SO2    → daily max (1 h peak)
    """
    df = hourly_df.copy().sort_values("datetime").reset_index(drop=True)
    df["o3_8h"] = df["o3"].rolling(8, min_periods=4).mean()
    df["co_8h"] = df["co"].rolling(8, min_periods=4).mean()
    df["date"] = df["datetime"].dt.date

    daily = (
        df.groupby("date")
        .agg(pm25=("pm25","mean"), pm10=("pm10","mean"),
             no2=("no2","max"),   o3=("o3_8h","max"),
             so2=("so2","max"),   co=("co_8h","max"))
        .reset_index()
    )
    daily = daily.ffill().bfill()

    aqis, dominants, subs = [], [], []
    for _, row in daily.iterrows():
        r = calc_aqi(pm25=row.pm25, pm10=row.pm10,
                     no2_ugm3=row.no2, o3_ugm3=row.o3,
                     co_ugm3=row.co,  so2_ugm3=row.so2)
        aqis.append(r["aqi"] or 50)
        dominants.append(r["dominant"] or "pm25")
        subs.append(r["sub_aqis"])

    daily["aqi"]      = aqis
    daily["dominant"] = dominants
    for pol in ["pm25","pm10","no2","o3","co","so2"]:
        daily[f"sub_{pol}"] = [s.get(pol, 0) for s in subs]

    return daily


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Evaluation helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _metrics(y_true: np.ndarray, y_pred: np.ndarray, name: str) -> dict:
    y_true = np.array(y_true, dtype=float)
    y_pred = np.clip(np.array(y_pred, dtype=float), 0, 500)
    mae  = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mape = float(np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1))) * 100)
    r2   = float(r2_score(y_true, y_pred))
    return {"model": name,
            "mae":  round(mae,  2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "r2":   round(r2,   4)}


# ═══════════════════════════════════════════════════════════════════════════════
# 3a. Naive Seasonal baseline
# ═══════════════════════════════════════════════════════════════════════════════

def _naive_forecast(train: np.ndarray, steps: int, period: int = 7) -> np.ndarray:
    """Repeat the last full seasonal cycle."""
    tail = train[-period:]
    reps = (steps // period) + 2
    return np.tile(tail, reps)[:steps]


# ═══════════════════════════════════════════════════════════════════════════════
# 3b. Holt-Winters
# ═══════════════════════════════════════════════════════════════════════════════

def _hw_forecast(train: np.ndarray, steps: int) -> np.ndarray:
    try:
        n = len(train)
        sp = 7 if n >= 14 else None
        kw: dict = dict(trend="add", initialization_method="estimated")
        if sp:
            kw.update(seasonal="add", seasonal_periods=sp, damped_trend=True)
        fit = ExponentialSmoothing(train, **kw).fit(optimized=True)
        return np.clip(fit.forecast(steps), 0, 500)
    except Exception:
        coef = np.polyfit(np.arange(len(train)), train, 1)
        return np.clip(np.polyval(coef, np.arange(len(train), len(train) + steps)), 0, 500)


# ═══════════════════════════════════════════════════════════════════════════════
# 3c. Prophet (Indian holidays + stubble-burning regressor)
# ═══════════════════════════════════════════════════════════════════════════════

def _stubble_col(dates: pd.Series) -> pd.Series:
    return dates.apply(is_stubble_burning_season).astype(float)


def _hw_fallback(daily_df: pd.DataFrame, steps: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    fc  = _hw_forecast(daily_df["aqi"].values, steps)
    std = float(np.std(daily_df["aqi"].values)) * 1.96
    return fc, np.clip(fc - std, 0, 500), np.clip(fc + std, 0, 500)


def _prophet_forecast(daily_df: pd.DataFrame, steps: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Returns (forecast, lower_95, upper_95) arrays. Falls back to HW on any error."""
    if not _PROPHET_OK:
        return _hw_fallback(daily_df, steps)

    try:
        df_p = pd.DataFrame({
            "ds": pd.to_datetime(daily_df["date"]),
            "y":  daily_df["aqi"].values.astype(float),
        })
        df_p["stubble"] = _stubble_col(df_p["ds"])

        m = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            holidays=get_indian_holidays(),
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            holidays_prior_scale=15.0,
            interval_width=0.95,
        )
        m.add_regressor("stubble")
        m.fit(df_p)

        future = m.make_future_dataframe(periods=steps)
        future["stubble"] = _stubble_col(future["ds"])
        fc_df = m.predict(future).tail(steps)

        yhat  = np.clip(fc_df["yhat"].values,       0, 500)
        lower = np.clip(fc_df["yhat_lower"].values,  0, 500)
        upper = np.clip(fc_df["yhat_upper"].values,  0, 500)
        return yhat, lower, upper
    except Exception:
        return _hw_fallback(daily_df, steps)


# ═══════════════════════════════════════════════════════════════════════════════
# 3d. XGBoost with feature engineering
# ═══════════════════════════════════════════════════════════════════════════════

_LAGS = [1, 2, 3, 7, 14, 21, 30]
_ROLLS = [7, 14, 30]

_FEATURE_COLS = (
    ["month_sin","month_cos","dow_sin","dow_cos","doy_sin","doy_cos",
     "is_winter_smog","is_monsoon","is_stubble","is_summer","quarter"]
    + [f"lag_{l}" for l in _LAGS]
    + [f"roll{r}_mean" for r in _ROLLS]
    + ["roll7_std"]
    + ["pm25_l1","pm10_l1","no2_l1","o3_l1"]
)


def _build_features(daily_df: pd.DataFrame) -> pd.DataFrame:
    df = daily_df.copy()
    df["date"] = pd.to_datetime(df["date"])

    df["month"]     = df["date"].dt.month
    df["dow"]       = df["date"].dt.dayofweek
    df["doy"]       = df["date"].dt.dayofyear
    df["quarter"]   = df["date"].dt.quarter

    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    df["dow_sin"]   = np.sin(2 * np.pi * df["dow"]   / 7)
    df["dow_cos"]   = np.cos(2 * np.pi * df["dow"]   / 7)
    df["doy_sin"]   = np.sin(2 * np.pi * df["doy"]   / 365)
    df["doy_cos"]   = np.cos(2 * np.pi * df["doy"]   / 365)

    df["is_winter_smog"] = df["month"].isin([10,11,12,1,2]).astype(int)
    df["is_monsoon"]     = df["month"].isin([6,7,8,9]).astype(int)
    df["is_stubble"]     = df["date"].apply(is_stubble_burning_season)
    df["is_summer"]      = df["month"].isin([3,4,5]).astype(int)

    for l in _LAGS:
        df[f"lag_{l}"] = df["aqi"].shift(l)
    for r in _ROLLS:
        df[f"roll{r}_mean"] = df["aqi"].rolling(r, min_periods=1).mean().shift(1)
    df["roll7_std"] = df["aqi"].rolling(7, min_periods=1).std().shift(1).fillna(0)

    for pol in ["pm25","pm10","no2","o3"]:
        if pol in df.columns:
            df[f"{pol}_l1"] = df[pol].shift(1)

    return df


def _xgb_forecast(daily_df: pd.DataFrame, steps: int, n_test_override: int = 0) -> Tuple[np.ndarray, np.ndarray, dict, np.ndarray]:
    """Returns (forecast, val_preds, feature_importance, y_test)."""
    df = _build_features(daily_df).dropna()
    feats = [c for c in _FEATURE_COLS if c in df.columns]

    X, y = df[feats].values, df["aqi"].values
    n_test = n_test_override if n_test_override > 0 else max(int(len(df) * 0.2), 14)
    n_test = min(n_test, len(df) - 30)   # ensure enough training data
    X_tr, X_te = X[:-n_test], X[-n_test:]
    y_tr, y_te = y[:-n_test], y[-n_test:]

    model = xgb.XGBRegressor(
        n_estimators=400, learning_rate=0.04, max_depth=5,
        subsample=0.8, colsample_bytree=0.8,
        reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, n_jobs=-1, verbosity=0,
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)],
              verbose=False)

    val_preds = model.predict(X_te)

    # Recursive multi-step forecast
    hist_aqi    = list(daily_df["aqi"].values)
    hist_pm25   = list(daily_df["pm25"].values)
    hist_pm10   = list(daily_df["pm10"].values)
    hist_no2    = list(daily_df["no2"].values)
    hist_o3     = list(daily_df["o3"].values)
    last_date   = pd.to_datetime(daily_df["date"].iloc[-1])

    fc = []
    for i in range(steps):
        nd = last_date + timedelta(days=i + 1)
        row: dict = {
            "month": nd.month, "dow": nd.dayofweek,
            "doy": nd.timetuple().tm_yday, "quarter": (nd.month - 1) // 3 + 1,
        }
        row["month_sin"] = np.sin(2*np.pi*row["month"]/12)
        row["month_cos"] = np.cos(2*np.pi*row["month"]/12)
        row["dow_sin"]   = np.sin(2*np.pi*row["dow"]/7)
        row["dow_cos"]   = np.cos(2*np.pi*row["dow"]/7)
        row["doy_sin"]   = np.sin(2*np.pi*row["doy"]/365)
        row["doy_cos"]   = np.cos(2*np.pi*row["doy"]/365)
        row["is_winter_smog"] = int(nd.month in [10,11,12,1,2])
        row["is_monsoon"]     = int(nd.month in [6,7,8,9])
        row["is_stubble"]     = is_stubble_burning_season(nd)
        row["is_summer"]      = int(nd.month in [3,4,5])

        for l in _LAGS:
            row[f"lag_{l}"] = hist_aqi[-l] if l <= len(hist_aqi) else hist_aqi[0]
        for r in _ROLLS:
            row[f"roll{r}_mean"] = float(np.mean(hist_aqi[-r:]))
        row["roll7_std"] = float(np.std(hist_aqi[-7:])) if len(hist_aqi) >= 7 else 0

        row["pm25_l1"] = hist_pm25[-1]
        row["pm10_l1"] = hist_pm10[-1]
        row["no2_l1"]  = hist_no2[-1]
        row["o3_l1"]   = hist_o3[-1]

        x_row = np.array([[row.get(f, 0) for f in feats]])
        pred  = float(np.clip(model.predict(x_row)[0], 0, 500))
        fc.append(pred)
        hist_aqi.append(pred)

    # Feature importance for research paper
    importance = {feats[i]: float(v)
                  for i, v in enumerate(model.feature_importances_)}

    return np.array(fc), val_preds, importance, y_te


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Ensemble + full evaluation
# ═══════════════════════════════════════════════════════════════════════════════

def run_full_pipeline(
    daily_df: pd.DataFrame,
    forecast_days: int = 14,
) -> dict:
    """
    Master function: trains all models, evaluates on 20 % test set,
    builds weighted ensemble, returns everything needed for the paper.
    """
    series = daily_df["aqi"].values.astype(float)
    n      = len(series)
    n_test = max(int(n * 0.2), 14)
    train_s, test_s = series[:-n_test], series[-n_test:]
    train_df = daily_df.iloc[:-n_test].copy()

    # ── (a) Naive ──────────────────────────────────────────────────────────
    naive_val  = _naive_forecast(train_s, n_test)
    naive_fc   = _naive_forecast(series,  forecast_days)
    naive_eval = _metrics(test_s, naive_val, "Naive Seasonal")

    # ── (b) Holt-Winters ───────────────────────────────────────────────────
    hw_val     = _hw_forecast(train_s, n_test)
    hw_fc      = _hw_forecast(series,  forecast_days)
    hw_eval    = _metrics(test_s, hw_val, "Holt-Winters")

    # ── (c) Prophet ────────────────────────────────────────────────────────
    _prophet_label = "Prophet" if _PROPHET_OK else "Prophet (HW fallback)"
    prophet_fc, prophet_lo, prophet_hi = _prophet_forecast(daily_df, forecast_days)
    prophet_val_fc, _, _               = _prophet_forecast(train_df, n_test)
    prophet_eval = _metrics(test_s, prophet_val_fc, _prophet_label)

    # ── (d) XGBoost ────────────────────────────────────────────────────────
    xgb_fc, xgb_val, feat_imp, _ = _xgb_forecast(daily_df, forecast_days, n_test_override=n_test)
    xgb_eval = _metrics(test_s, xgb_val, "XGBoost")

    # ── (e) Weighted ensemble ──────────────────────────────────────────────
    maes = {
        "prophet": max(prophet_eval["mae"], 1e-6),
        "xgb":     max(xgb_eval["mae"],     1e-6),
        "hw":      max(hw_eval["mae"],       1e-6),
    }
    w_total = sum(1 / v for v in maes.values())
    w = {k: (1 / v) / w_total for k, v in maes.items()}

    ens_fc = (w["prophet"] * prophet_fc
              + w["xgb"]     * xgb_fc
              + w["hw"]      * hw_fc)
    ens_fc = np.clip(ens_fc, 0, 500)

    # Ensemble validation preds (same weighting)
    hw_val_arr     = hw_val
    naive_val_arr  = naive_val   # noqa: F841
    ens_val = np.clip(
        w["prophet"] * prophet_val_fc + w["xgb"] * xgb_val + w["hw"] * hw_val_arr,
        0, 500
    )
    ens_eval = _metrics(test_s, ens_val, "Ensemble (Prophet+XGB+HW)")

    # CI: use Prophet's interval scaled by ensemble residual std
    ens_res_std = float(np.std(test_s - ens_val))
    margin_95   = 1.96 * ens_res_std
    lo = np.clip(ens_fc - margin_95, 0, 500)
    hi = np.clip(ens_fc + margin_95, 0, 500)

    # ── Build forecast list ────────────────────────────────────────────────
    last_date = pd.to_datetime(daily_df["date"].iloc[-1])
    forecast_list = [
        {
            "date":      str((last_date + timedelta(days=i+1)).date()),
            "aqi":       int(round(float(ens_fc[i]))),
            "aqi_lower": max(0,   int(round(float(lo[i])))),
            "aqi_upper": min(500, int(round(float(hi[i])))),
            "prophet":   int(round(float(prophet_fc[i]))),
            "xgb":       int(round(float(xgb_fc[i]))),
            "hw":        int(round(float(hw_fc[i]))),
        }
        for i in range(forecast_days)
    ]

    # ── Top feature importance ─────────────────────────────────────────────
    top_feats = sorted(feat_imp.items(), key=lambda x: -x[1])[:12]

    return {
        "forecast":         forecast_list,
        "model_comparison": [naive_eval, hw_eval, prophet_eval, xgb_eval, ens_eval],
        "ensemble_weights": {k: round(v, 3) for k, v in w.items()},
        "feature_importance": [{"feature": k, "importance": round(v*100, 2)}
                                for k, v in top_feats],
        "meta": {
            "training_days": int(n - n_test),
            "test_days":     int(n_test),
            "total_days":    int(n),
            "prophet_available": _PROPHET_OK,
            "ci_margin_95":  round(margin_95, 1),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Diurnal pattern (unchanged from v1)
# ═══════════════════════════════════════════════════════════════════════════════

def compute_diurnal(hourly_df: pd.DataFrame) -> List[dict]:
    df = hourly_df.copy()
    df["hour"] = df["datetime"].dt.hour
    grp = df.groupby("hour")[["pm25","pm10","no2","o3","so2","co"]].mean()
    from app.utils.aqi_calculator import calc_aqi as _calc
    result = []
    for hour, row in grp.iterrows():
        r = _calc(pm25=row.pm25, pm10=row.pm10,
                  no2_ugm3=row.no2, o3_ugm3=row.o3,
                  co_ugm3=row.co,   so2_ugm3=row.so2)
        result.append({
            "hour": int(hour),
            "pm25": round(float(row.pm25),2),
            "pm10": round(float(row.pm10),2),
            "no2":  round(float(row.no2), 2),
            "o3":   round(float(row.o3),  2),
            "so2":  round(float(row.so2), 2),
            "co":   round(float(row.co),  2),
            "aqi":  r["aqi"] or 0,
        })
    return result


# Fix missing type hint import
from typing import List  # noqa: E402
