import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LandingChart from "./components/LandingChart";
import Footer from "./components/Footer";
import MarqueeStripe from "./components/Marquee";
import AirsonaFeatures from "./components/AirsonaFeatures";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <AirsonaFeatures />
      <LandingChart/>
      <MarqueeStripe />
      <Footer/>


      </div>
     
  );
};

export default LandingPage;
