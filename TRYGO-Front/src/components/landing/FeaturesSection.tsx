import { FC } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Book,
  User,
  Search,
  Package,
  BarChart3,
  Presentation,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FeatureCard from "./FeatureCard";

const FeaturesSection: FC = () => {
  return (
    <section className="py-24 bg-white" id="features">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-3">
            FEATURES
          </span>
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            What's Inside
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A clear structure. No fluff. Everything you need to validate, build
            and launch.
          </p>
        </motion.div>

        {/* Feature showcase with image */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-blue-500 font-semibold mb-2 block">
              AI-POWERED
            </span>
            <h3 className="text-3xl font-bold mb-4">
              Your Personal AI Launch Assistant
            </h3>
            <p className="text-gray-600 mb-6">
              An AI copilot guides you every step of the way, acting like an
              expert product manager or marketer — from shaping hypotheses to
              generating texts, crafting customer profiles, and SWOT analysis.
            </p>
            <ul className="space-y-3">
              {[
                "Smart suggestions",
                "Real-time assistance",
                "Template generation",
                "Data analysis",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="text-blue-500 mr-2 mt-1">✓</div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8 bg-blue-50 text-blue-600 hover:bg-blue-100">
              Learn more <ArrowRight size={16} className="ml-2" />
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80"
              alt="AI Assistant"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg max-w-xs">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <div className="w-5 h-5 text-blue-600">🚀</div>
                </div>
                <p className="font-medium text-sm">
                  AI assistance at every step
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Grid - Clean Modern Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Book className="h-6 w-6 text-white" />}
            title="Lean Canvas"
            description="Launch fast — structure your business hypothesis in 15 minutes with smart templates and real examples."
            color="from-blue-400 to-blue-500"
            imageUrl="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80"
          />

          <FeatureCard
            icon={<User className="h-6 w-6 text-white" />}
            title="ICP Builder"
            description="Truly know your customer: segment, identify pains, define your ideal profile with our advanced ICP tools."
            color="from-indigo-500 to-indigo-600"
            imageUrl="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80"
          />

          <FeatureCard
            icon={<Search className="h-6 w-6 text-white" />}
            title="Research & SWOT"
            description="Analyze competitors, collect review insights, and find your edge with our comprehensive tools."
            color="from-blue-500 to-blue-600"
            imageUrl="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Package className="h-6 w-6 text-white" />}
            title="Packaging"
            description="Build a landing page that converts. No copywriter needed. Get ready-to-use sections and copy."
            color="from-blue-600 to-blue-700"
            imageUrl="https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&q=80"
          />

          <FeatureCard
            icon={<BarChart3 className="h-6 w-6 text-white" />}
            title="Validation"
            description="Test your idea before spending big. Create custom interviews and analyze real user feedback."
            color="from-indigo-600 to-indigo-700"
            imageUrl="https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80"
          />

          <FeatureCard
            icon={<Presentation className="h-6 w-6 text-white" />}
            title="Pitch Materials"
            description="Raise funds confidently. Get an automatic pitch deck builder with YC/500 slide structure."
            color="from-blue-500 to-indigo-500"
            imageUrl="https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?auto=format&fit=crop&q=80"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Rocket className="h-6 w-6 text-white" />}
            title="GTM"
            description="Receive a personalized go-to-market strategy. Our AI analyzes your project and delivers actionable steps based on the best business practices."
            color="from-blue-500 to-indigo-500"
            imageUrl="https://images.unsplash.com/photo-1497493292307-31c376b6e479?auto=format&fit=crop&q=80"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
