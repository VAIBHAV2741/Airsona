import Navbar from "../components/Navbar";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-[Inter]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-6">
            The Vision Behind Airsona
          </h1>
          <p className="text-xl text-emerald-400 font-medium">
            Bridging hyper-local environmental data with actionable, organic mitigation.
          </p>
        </div>

        <section className="space-y-12">
          {/* Abstract Block */}
          <div className="bg-[#131A2A] border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Abstract</h2>
            <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
              <p>
                In the modern era of industrial scale, static environmental reporting is no longer sufficient. 
                Knowing the Air Quality Index (AQI) of a region does nothing to fundamentally solve the concentration of 
                hazardous particulate matter (PM2.5, PM10) and airborne carcinogens (NO2, SO2).
              </p>
              <p>
                <strong>Airsona</strong> was engineered to transcend observation. It is an algorithmic Environmental Intelligence OS 
                that maps real-time geospatial pollution nodes and directly calculates the exact biological resistance required 
                to neutralize them.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1A2235] border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Algorithmic Biomitigation</h3>
              <p className="text-slate-400 leading-relaxed">
                By scraping live sensory APIs, Airsona identifies the exact chemical makeup of a city's smog. 
                Our backend then cross-references native botanical species—calculating their canopy density and chemical 
                absorption rates—to provide a localized "Tree Deployment Formula" guaranteed to act as an organic 
                windbreak and air filter.
              </p>
            </div>

            <div className="bg-[#1A2235] border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Carbon Credit Economics</h3>
              <p className="text-slate-400 leading-relaxed">
                Environmental restoration shouldn't be a financial loss. Airsona takes the simulated carbon capacity of your 
                tree deployment and generates strict analytical PDF reports mapping your expected Annual Carbon Sequestration. 
                These reports can be used to monetize your impact onto verified Green Energy Exchanges.
              </p>
            </div>
          </div>

          <div className="text-center pt-12">
            <Link href="/mainApp">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-900/20">
                Lauch the Airsona UI Engine
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
