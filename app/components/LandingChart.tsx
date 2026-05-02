"use client";

const classes = [
  {
    title: "Real-Time AQI Monitoring",
    desc: "Track live metrics like PM2.5, PM10, O₃, NO₂, and CO with a seamless real-time dashboard.",
    image:
      "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "AI-Powered Forecasting",
    desc: "Predict air quality for the next 24–72 hours using machine-learning models optimized for accuracy.",
    image:
      "https://images.pexels.com/photos/615373/pexels-photo-615373.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "Health & Safety Insights",
    desc: "Understand health impacts with personalized alerts, recommendations, and safe exposure guidelines.",
    image:
      "https://images.pexels.com/photos/4100420/pexels-photo-4100420.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function UpcomingClasses() {
  return (
    <section className="relative w-full min-h-screen py-24 overflow-hidden">

      {/* Background Video */}
      <video
        src="/AirsonaHero.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      ></video>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90"></div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-medium text-white drop-shadow-2xl leading-tight">
            Explore Key Features
          </h2>
          <p className="mt-4 text-4xl text-green-300 font-medium opacity-90 max-w-2xl mx-auto">
            Airsona brings smart monitoring, accurate forecasting, and deep
            health insights all powered by AI.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {classes.map((c) => (
            <article
              key={c.title}
              className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Image */}
              <div className="h-60 w-full overflow-hidden">
                <img
                  src={c.image}
                  alt={c.title}
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition duration-500"
                />
              </div>

              {/* Text */}
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white drop-shadow">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm text-gray-200 leading-relaxed">
                  {c.desc}
                </p>
                <button className="mt-5 text-sm font-semibold text-green-300 hover:text-green-400 transition">
                  Learn More →
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile Button */}
        <div className="mt-10 text-center md:hidden">
          <button className="border border-white text-white px-6 py-2 rounded-lg hover:bg-white hover:text-black transition">
            Explore More
          </button>
        </div>

      </div>
    </section>
  );
}
