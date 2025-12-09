
import { FC } from 'react';
import { motion } from 'framer-motion';
import PersonaCard from './PersonaCard';

const AudienceSection: FC = () => {
  return (
    <section className="py-24 bg-white" id="audience">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-3">AUDIENCE</span>
          <h2 className="text-4xl font-bold mb-4 text-gray-800">Who It's For</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The platform for everyone launching digital products — whether you're solo or leading a team.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <PersonaCard
            emoji="🚀"
            title="Digital Entrepreneurs"
            description="Have an idea? Get structure & packaging to launch in days, not months."
          />
          
          <PersonaCard
            emoji="💡"
            title="Idea-Stage Founders"
            description="Preparing for investors or accelerators? Get everything from Lean Canvas to pitch deck."
            featured={true}
          />
          
          <PersonaCard
            emoji="🔧"
            title="No-coders & Solo-founders"
            description="The complete stack, from validation to landing page, with no extra coding."
          />
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
