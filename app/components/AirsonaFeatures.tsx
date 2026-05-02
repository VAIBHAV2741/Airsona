"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cloud,
  AlertTriangle,
  MapPin,
  Flower,
  Heart,
  Home,
  Leaf,
  Zap,
  PlayCircle,
} from "lucide-react";

/**
 * Airsona Features Page
 * - Converted from gym-amenities layout to Airsona feature-focused page
 * - Light green + white theme, accessible contrast, subtle animations
 */

const features = [
  {
    title: "Real-time AQI Monitoring",
    desc:
      "Live air quality readings (PM2.5, PM10, O₃, NO₂, CO) from nearby stations and sensors — updated every minute.",
    icon: Cloud,
  },
  {
    title: "Pollution Hotspot Alerts",
    desc:
      "Automated alerts for local pollution spikes and hotspot notifications so communities can act fast.",
    icon: AlertTriangle,
  },
  {
    title: "City-wise AQI Comparison",
    desc:
      "Compare air quality across cities or neighborhoods to identify trends and prioritize action.",
    icon: MapPin,
  },
  {
    title: "Pollen & Dust Tracking",
    desc:
      "Track pollen levels and dust forecasts to help sensitive users plan outdoor activities safely.",
    icon: Flower,
  },
  {
    title: "Health Impact Suggestions",
    desc:
      "Personalized guidance (mask suggestions, outdoor activity advice) tailored to AQI and user sensitivity.",
    icon: Heart,
  },
  {
    title: "Indoor Sensor Support",
    desc:
      "Seamless integration with indoor sensors to monitor and optimize home/office air quality.",
    icon: Home,
  },
  {
    title: "Carbon Footprint Calculator",
    desc:
      "Estimate emissions reduced through planting, reduced travel, and air-cleaning initiatives.",
    icon: Leaf,
  },
  {
    title: "Purifier Efficiency Tracking",
    desc:
      "Track purifier performance over time and get recommendations for filter replacement and placement.",
    icon: Zap,
  },
];

export default function AirsonaFeatures() {
  return (
    <section className="w-full bg-gradient-to-b from-white to-emerald-50 py-20" id="features">
      <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* LEFT: Hero + promo video thumbnail */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
            What Airsona Does
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl font-medium text-emerald-900 leading-tight">
            Cleaner Air. Greener Communities.
          </h2>

          <p className="mt-6 text-lg text-emerald-700 max-w-xl">
            Airsona brings real-time air quality monitoring, AI forecasts, hotspot alerts, and
            actionable health guidance — all in one easy-to-use platform for citizens and planners.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link href="/mainApp">
              <button
                className="w-full sm:w-auto px-8 py-4 text-emerald-900 bg-emerald-400 rounded-xl font-bold hover:bg-emerald-300 transition-colors duration-300 shadow-lg shadow-emerald-900/20"
                aria-label="Get started with Airsona"
              >
                Get Started
              </button>
            </Link>

            <button
              className="inline-flex items-center gap-2 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg hover:bg-emerald-100 transition"
              aria-label="Watch demo"
            >
              <PlayCircle className="w-5 h-5 text-emerald-700" />
              Watch Demo
            </button>
          </div>

          {/* Promo image / video thumbnail */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="mt-10 relative max-w-md rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src="https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Airsona demo"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent"></div>
            <button
              aria-label="Play Airsona demo"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-lg hover:scale-105 transition"
            >
              <PlayCircle className="w-8 h-8" />
            </button>
          </motion.div>
        </motion.div>

        {/* RIGHT: Feature list (cards) */}
        <div className="flex flex-col gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                viewport={{ once: true }}
                className="group bg-white border border-emerald-100 rounded-xl p-5 shadow-sm hover:shadow-lg transition flex gap-4 items-start"
              >
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-emerald-700 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Decorative divider */}
      <div className="mt-16 max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
      </div>
    </section>
  );
}
