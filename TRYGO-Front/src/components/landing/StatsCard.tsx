
import { FC } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const StatsCard: FC<StatsCardProps> = ({ icon, value, label, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`${color} rounded-2xl p-6 text-center shadow-lg`}
  >
    <div className="text-4xl mb-3">{icon}</div>
    <div className="text-4xl font-bold text-blue-600 mb-2">{value}</div>
    <p className="text-gray-700">{label}</p>
  </motion.div>
);

export default StatsCard;
