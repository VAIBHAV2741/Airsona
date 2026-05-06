"use client";

import { motion, type Variants } from "framer-motion";

const team = [
  { id: "2201641540111", name: "Tanmay Pant",    initials: "TP", color: "#22c55e" },
  { id: "2201641540113", name: "Tarun Bhatia",   initials: "TB", color: "#3b82f6" },
  { id: "2201641540116", name: "Uday Vimal",     initials: "UV", color: "#f59e0b" },
  { id: "2201641540119", name: "Vaibhav Sharma", initials: "VS", color: "#8b5cf6" },
  { id: "2201641540121", name: "Vansh Suneja",   initials: "VN", color: "#ef4444" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AirsonaFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="w-full bg-black border-t border-white/[0.06] pt-14 pb-8 px-6"
    >
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">Group Project</p>
          <h2 className="text-2xl font-light text-white">
            Built by{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Team Airsona
            </span>
          </h2>
          <p className="text-white/40 text-sm mt-2">
            ML-powered air quality intelligence for a cleaner environment
          </p>
        </div>

        {/* Team cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {team.map(({ id, name, initials, color }) => (
            <motion.div
              key={id}
              variants={cardVariants}
              whileHover={{ scale: 1.04, y: -3 }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm cursor-default select-none"
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-black flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
              >
                {initials}
              </div>

              {/* Info */}
              <div>
                <p className="text-sm font-normal text-white/80 leading-tight tracking-wide">{name}</p>
                <p className="text-[11px] text-white/25 font-light font-mono mt-0.5 tracking-widest">{id}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider + copyright */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/25">
          <span>
            © {new Date().getFullYear()}{" "}
            <span className="text-amber-400/60 font-normal">Airsona</span>. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Powered by Open-Meteo · WAQI · Holt-Winters ML
          </span>
        </div>

      </div>
    </motion.footer>
  );
}
