// // Add this at the very top of the file
// declare namespace JSX {
//   interface IntrinsicElements {
//     'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { url: string };
//   }
// }

// "use client";

// import { useEffect } from "react";

// export default function Hero() {
//   useEffect(() => {
//     const script = document.createElement("script");
//     script.type = "module";
//     script.src = "https://unpkg.com/@splinetool/viewer@1.10.34/build/spline-viewer.js";
//     document.body.appendChild(script);
//   }, []);

//   return (
//     <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-24 gap-10 bg-gradient-to-b from-dooly-blue to-black text-white">
//       {/* Left Text Section */}
//       <div className="text-center md:text-left max-w-2xl">
//         <h1 className="text-4xl md:text-6xl font-bold leading-tight">
//           The best way to{" "}
//           <span className="bg-yellow-400 text-black px-3 py-1 rounded-md inline-block">
//             review
//           </span>{" "}
//           creative assets
//         </h1>

//         <p className="mt-6 text-lg text-gray-300">
//           Explore accurate and real-time air quality metrics with Dooly.
//           <br />
//           Ship high-performing creatives 10x faster.
//         </p>

//         <div className="mt-8 flex justify-center md:justify-start gap-4">
//           <button className="bg-transparent border border-dooly-light text-dooly-light px-6 py-2 rounded-full font-semibold hover:bg-dooly-light hover:text-black transition">
//             Explore
//           </button>
//           <button className="bg-transparent border border-dooly-light text-dooly-light px-6 py-2 rounded-full font-semibold hover:bg-dooly-light hover:text-black transition">
//             Try for Free
//           </button>
//         </div>
//       </div>

//       {/* Right Earth Section (optional, spline) */}
//       {/* 
//       <div className="w-full md:w-1/2 h-[400px] md:h-[500px]">
//         <spline-viewer url="https://my.spline.design/earthdayandnight-iBezf8ktoWsMk51skSOkVqKu/"></spline-viewer>
//       </div> 
//       */}
//     </section>
//   );
// }
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen -mt-[72px] pt-[72px] flex flex-col items-center justify-center text-center px-6 text-white overflow-hidden">

      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/Vidoe2.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Dark Overlay (optional, improves text visibility) */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 px-6 py-24">
        <h1 className="text-4xl md:text-6xl font-sans leading-tight max-w-3xl mx-auto">
          Air quality monitoring at your fingertips with{' '}
          <span className="bg-blue-1900 text-yellow-500 px-3 py-1 rounded-md inline-block">
            Airsona
          </span>
        </h1>

        <p className="mt-6 text-2xl text-gray-300 max-w-xl mx-auto font-sans">
          Get real-time air quality insights, historical trends, <br />
          and AI-powered forecasts all in one sleek dashboard
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/mainApp">
            <button className="bg-rose-400 text-black px-6 py-2 rounded-full font-medium hover:bg-rose-300 transition cursor-pointer">
              Get Started
            </button>
          </Link>

          <Link href="/about">
            <button className="bg-rose-400 text-black px-6 py-2 rounded-full font-medium hover:bg-rose-300 transition cursor-pointer">
              Learn More
            </button>
          </Link>
        </div>
      </div>

    </section>
  );
}
