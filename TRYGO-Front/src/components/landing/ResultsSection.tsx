
import { FC } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import StatsCard from './StatsCard';

const ResultsSection: FC = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-50 to-indigo-50" id="results">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <span className="inline-block px-4 py-1 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-3">RESULTS</span>
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Results & Benefits</h2>
          <p className="text-xl text-gray-600">
            Our users see real outcomes when launching their products
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatsCard 
            icon="🎯"
            value="3×"
            label="Launch MVPs faster"
            color="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          
          <StatsCard 
            icon="💰"
            value="80%"
            label="More accurate ICP targeting"
            color="bg-gradient-to-br from-indigo-50 to-indigo-100"
          />
          
          <StatsCard 
            icon="📊"
            value="100%"
            label="Auto-generated reports"
            color="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          
          <StatsCard 
            icon="⚙️"
            value="1"
            label="Platform for everything"
            color="bg-gradient-to-br from-indigo-50 to-indigo-100"
          />
        </div>
        
        {/* Testimonial */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 relative"
        >
          <div className="absolute -top-5 -left-5 text-5xl">
            "
          </div>
          <div className="ml-8">
            <p className="text-xl text-gray-700 italic mb-6">
              This platform helped me take my idea from concept to paying customers in just 3 weeks. The AI assistant was like having a co-founder who knew exactly what to do next.
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold">Alex Thompson</h4>
                <p className="text-gray-500">Founder, InnoTech Solutions</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsSection;
