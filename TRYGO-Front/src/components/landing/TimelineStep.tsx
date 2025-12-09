
import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TimelineStepProps {
  number: string;
  title: string;
  description: string;
  isLeft: boolean;
  image: string;
}

const TimelineStep: FC<TimelineStepProps> = ({ number, title, description, isLeft, image }) => (
  <motion.div 
    className="relative z-10"
    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className={`flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}>
      <div className="md:w-5/12">
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${isLeft ? 'md:mr-8' : 'md:ml-8'}`}>
          <div className="h-48 overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>
      <div className="md:w-2/12 py-4 flex justify-center">
        <div className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center text-lg font-bold shadow-md">
          {number}
        </div>
      </div>
      <div className="md:w-5/12"></div>
    </div>
  </motion.div>
);

export default TimelineStep;
