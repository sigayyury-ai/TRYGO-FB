
import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  imageUrl: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, description, color, imageUrl }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -5 }}
    className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white h-full"
  >
    <div className="h-48 overflow-hidden relative">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80`}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
          {icon}
        </div>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </motion.div>
);

export default FeatureCard;
