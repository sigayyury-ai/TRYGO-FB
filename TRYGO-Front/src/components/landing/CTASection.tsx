
import { FC } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onRegisterOpen?: () => void;
}

const CTASection: FC<CTASectionProps> = ({ onRegisterOpen }) => {
  return (
    <section className="py-24 bg-white" id="cta">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-12 md:p-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to start your journey?</h2>
              <p className="text-blue-100 mb-8 text-lg">
                Get your Lean Canvas and ICP in just 15 minutes. Launch your next product, faster.
              </p>
              <Button 
                onClick={onRegisterOpen}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 transition-all text-lg px-8 py-3 h-auto rounded-xl shadow-lg"
                disabled={!onRegisterOpen}
              >
                Start Free <ArrowUpRight className="ml-2" size={18} />
              </Button>
              <p className="mt-4 text-blue-100 text-sm">
                No credit card required
              </p>
            </div>
            <div className="hidden md:block relative h-full">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80" 
                alt="Launch your startup"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
