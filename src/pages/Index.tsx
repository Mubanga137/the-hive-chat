import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HoneycombBackground from "@/components/HoneycombBackground";
import ShoppingGrid from "@/components/ShoppingGrid";
import FeaturedVendors from "@/components/FeaturedVendors";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen relative">
    <HoneycombBackground />
    <Header />
    <HeroSection />
    <ShoppingGrid />
    <FeaturedVendors />
    <FeaturesSection />
    <Footer />
  </div>
);

export default Index;
