import { useState, useEffect } from "react";
import Header from "@/components/Header";

// Import component sections
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ProcessSection from "@/components/landing/ProcessSection";
import AudienceSection from "@/components/landing/AudienceSection";
import ResultsSection from "@/components/landing/ResultsSection";
import CTASection from "@/components/landing/CTASection";
import FooterSection from "@/components/landing/FooterSection";
import { useUserStore } from "@/store/useUserStore";
import { Navigate } from "react-router-dom";

const Index = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [showPlatformSelect, setShowPlatformSelect] = useState(false);

  const isLoggedIn = useUserStore((state) => state.isAuthenticated);
  const hasInitializedProject = useUserStore(
    (state) => state.hasInitializedProject
  );

  // Проверяем, нужно ли показать диалог выбора платформы
  useEffect(() => {
    if (localStorage.getItem("platformDialogOpen") === "true") {
      setShowPlatformSelect(true);
    }
  }, []);

  // Handle scroll for section visibility
  const handleScroll = () => {
    const sections = [
      "hero",
      "features",
      "process",
      "audience",
      "results",
      "cta",
    ];
    const current = sections.find((section) => {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        return rect.top <= 200 && rect.bottom >= 200;
      }
      return false;
    });

    if (current) {
      setActiveSection(current);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoggedIn && hasInitializedProject) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-white">
      {/* Navigation */}
    </div>
  );
};

export default Index;
