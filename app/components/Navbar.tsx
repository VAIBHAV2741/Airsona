"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/time-series", label: "Time Series" },
  { href: "/mainApp", label: "Check AQI" },
  { href: "/reduceaqi", label: "Reduce AQI" },
  { href: "/engine", label: "Environment Engine" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full"
    >
      {/* Glass bar */}
      <div className="mx-auto max-w-[1400px] px-4 pt-3">
        <nav className="relative flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/60 backdrop-blur-xl px-5 py-2.5 shadow-[0_2px_24px_rgba(0,0,0,0.45)]">

          {/* ── Logo ────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              <span className="text-[11px] font-black text-black tracking-tighter leading-none">AS</span>
              <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
              <span className="text-amber-400">AIR</span>
              <span className="text-white/90">SONA</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1 mx-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg text-[15px] font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.06]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Desktop CTA ──────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
            <Link
              href="/about"
              className="text-sm font-medium text-white/50 hover:text-white/80 px-3 py-2 transition-colors whitespace-nowrap"
            >
              Learn More
            </Link>
            <Link href="/about">
              <button className="relative text-sm font-semibold text-black bg-white rounded-lg px-5 py-2 overflow-hidden group transition-all hover:shadow-lg hover:shadow-white/10 whitespace-nowrap">
                <span className="relative z-10">About Us</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </Link>
          </div>

          {/* ── Mobile Hamburger ──────────────────────────── */}
          <button
            className="lg:hidden relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-[5px] w-[18px]">
              <motion.span
                animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                className="block h-[1.5px] w-full bg-white/80 rounded-full origin-center"
                transition={{ duration: 0.25 }}
              />
              <motion.span
                animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                className="block h-[1.5px] w-full bg-white/80 rounded-full"
                transition={{ duration: 0.15 }}
              />
              <motion.span
                animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                className="block h-[1.5px] w-full bg-white/80 rounded-full origin-center"
                transition={{ duration: 0.25 }}
              />
            </div>
          </button>
        </nav>
      </div>

      {/* ── Mobile Dropdown ────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden absolute left-0 right-0 top-full px-4 pt-2"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-black/80 backdrop-blur-2xl p-4 shadow-2xl">
              <div className="space-y-1">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                          isActive
                            ? "bg-white/[0.08] text-white"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        {link.label}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                <Link
                  href="/about"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-[13px] font-medium text-white/60 hover:text-white border border-white/[0.08] rounded-xl py-2.5 transition-colors"
                >
                  Learn More
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-[13px] font-semibold text-black bg-white rounded-xl py-2.5 hover:bg-white/90 transition-colors"
                >
                  About Us
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
