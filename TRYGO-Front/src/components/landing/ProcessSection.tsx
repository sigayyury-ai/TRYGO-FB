
import { FC } from 'react';
import { motion } from 'framer-motion';
import TimelineStep from './TimelineStep';

const ProcessSection: FC = () => {
  return (
    <section className="py-24 relative bg-gradient-to-b from-blue-50 to-white" id="process">
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-blue-50"></div>
      <div className="container mx-auto px-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-3">PROCESS</span>
          <h2 className="text-4xl font-bold mb-4 text-gray-800">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Visualize your journey: from idea to launch, all in one flow.
          </p>
        </motion.div>
        
        {/* Visual timeline */}
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-blue-200 -translate-x-1/2 z-0"></div>
          
          <div className="space-y-24 relative z-10">
            <TimelineStep 
              number="01"
              title="Define Your Idea"
              description="Start by defining your product idea, target market, and the problem you're solving."
              isLeft={true}
              image="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80"
            />
            
            <TimelineStep 
              number="02"
              title="Build Lean Canvas"
              description="Structure your business model with our Lean Canvas template and AI guidance."
              isLeft={false}
              image="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80"
            />
            
            <TimelineStep 
              number="03"
              title="Define Your ICP"
              description="Create detailed customer profiles to truly understand who will use your product."
              isLeft={true}
              image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80"
            />
            
            <TimelineStep 
              number="04"
              title="Launch & Iterate"
              description="Package your MVP, create your go-to-market strategy, and start getting customers."
              isLeft={false}
              image="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
