import { FC } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface HeroSectionProps {
  onScrollToSection: (section: string) => void;
}

const HeroSection: FC<HeroSectionProps> = ({
  onScrollToSection,
}) => {
  const navigate = useNavigate();

  const handleTryFreeClick = () => {
    navigate("/auth");
  };

  return (
    <section
      className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-white to-blue-50"
      id="hero"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="inline-block mb-6 px-4 py-1 bg-blue-100 rounded-full">
              <span className="text-blue-600 font-medium text-sm">
                Launch your startup faster
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              From Hypothesis to First
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
                {" "}
                Clients
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              A tool that helps you formulate your idea, package it, build a
              go-to-market strategy, and generate ready-made materials for
              promotion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleTryFreeClick}
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20"
              >
                Try For Free <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button
                onClick={() => onScrollToSection("features")}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 h-auto rounded-xl border-2"
              >
                See Features
              </Button>
            </div>
            <div className="mt-8 flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-b from-blue-${
                      200 + i * 100
                    } to-blue-${300 + i * 100}`}
                  ></div>
                ))}
              </div>
              <p className="ml-4 text-sm text-gray-500">
                Trusted by <span className="font-semibold">1000+</span>{" "}
                entrepreneurs
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10">
              <AspectRatio ratio={16 / 12}>
                <img
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80"
                  alt="Product dashboard"
                  className="object-cover w-full h-full"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-transparent"></div>
              </AspectRatio>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center">
                  <h3 className="font-bold text-xl mb-2">
                    All-in-one MVP Platform
                  </h3>
                  <p className="text-gray-700">
                    Define, test, package and launch your product in days, not
                    weeks
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 p-4 bg-white rounded-lg shadow-lg flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium">Idea validated!</span>
            </div>
            <div className="absolute -top-5 -right-5 p-4 bg-white rounded-lg shadow-lg">
              <span className="font-medium text-blue-500">
                Launch in 5 days!
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Simplified decorative elements */}
      <div className="absolute top-40 left-10 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-5"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-5"></div>
    </section>
  );
};

export default HeroSection;
