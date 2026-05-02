"use client";

const words = [
  "AIR QUALITY MONITORING SIMPLIFIED WITH AI",
  "AIR QUALITY MONITORING SIMPLIFIED WITH AI",
  "AIR QUALITY MONITORING SIMPLIFIED WITH AI",
];

export default function MarqueeStripe() {
  return (
    <div className="w-full bg-[#15181c] py-3 overflow-hidden">
      <div className="relative flex gap-12 whitespace-nowrap">
        <div className="animate-marquee flex gap-12">
          {words.map((w, i) => (
            <p
              key={i}
              className="text-sm md:text-lg tracking-[0.35em] font-semibold text-white"
            >
             Air Quality{" "}
              <span className="text-lime-400">MONITORING</span> SIMPLIFIED WITH AI
            </p>
          ))}
        </div>

        {/* duplicate block for seamless loop */}
        <div className="animate-marquee flex gap-12" aria-hidden="true">
          {words.map((w, i) => (
            <p
              key={`dup-${i}`}
              className="text-sm md:text-lg tracking-[0.35em] font-semibold text-white"
            >
              FOCUS ON YOUR{" "}
              <span className="text-lime-400">FITNESS</span> NOT YOUR LOSS
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
