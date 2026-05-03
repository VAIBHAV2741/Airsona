"use client";

import { motion } from "framer-motion";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function AirsonaFooter() {
  const footerSections = [
    { title: "Company", links: ["About Us", "Careers", "Press", "Blog"] },
    { title: "Pages", links: ["Login", "Register", "Add List", "Contact"] },
    { title: "Legal", links: ["Terms", "About Us", "Team", "Privacy"] },
    { title: "Resources", links: ["Blog", "Service", "Product", "Pricing"] },
  ];

  return (
    <motion.footer
      className="w-full bg-black text-gray-300 py-12 px-6"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8">
        {/* Logo + description + social */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-white">Airsona</h2>
          <p className="text-gray-400 text-sm">
            Empowering cleaner air for healthier communities with real-time monitoring and insights.
          </p>
          <div className="flex gap-3 mt-2">
            <a href="#"><Twitter className="w-5 h-5 hover:text-white transition" /></a>
            <a href="#"><Instagram className="w-5 h-5 hover:text-white transition" /></a>
            <a href="#"><Linkedin className="w-5 h-5 hover:text-white transition" /></a>
            <a href="#"><Github className="w-5 h-5 hover:text-white transition" /></a>
          </div>
        </div>

        {/* Footer link sections */}
        {footerSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm hover:text-white transition">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Meet the Developers */}
      <motion.div
        className="mt-10 border-t border-gray-700 pt-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h3 className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Meet the Developers
        </h3>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { name: "Tarun Bhatia",   photo: "" },
            { name: "Vaibhav Sharma", photo: "" },
            { name: "Vamsh Suneja",   photo: "" },
            { name: "Tanmay Pant",    photo: "" },
            { name: "Uday Vimal",     photo: "" },
          ].map(({ name, photo }) => (
            <div key={name} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border border-gray-700 group-hover:border-emerald-500 transition-colors overflow-hidden bg-gray-800 flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-400 group-hover:text-emerald-400 transition-colors">
                    {name[0]}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors text-center leading-tight">
                {name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom copyright */}
      <motion.div
        className="mt-6 text-center text-xs text-gray-500"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        © {new Date().getFullYear()} Airsona Inc. All rights reserved.
      </motion.div>
    </motion.footer>
  );
}
