
import { FC } from 'react';
import { motion } from 'framer-motion';

interface PersonaCardProps {
  emoji: string;
  title: string;
  description: string;
  featured?: boolean;
}

const PersonaCard: FC<PersonaCardProps> = ({ emoji, title, description, featured = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`${featured ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100' : 'bg-white'} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
  >
    <div className={`w-16 h-16 flex items-center justify-center ${featured ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-500'} rounded-2xl mb-6 text-3xl`}>
      {emoji}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

export default PersonaCard;
