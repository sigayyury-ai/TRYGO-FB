import { FC, useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

const LoadingScreen: FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingSteps = [
    "We're scanning your project",
    "We're analyzing collected information",
    "We're building your Lean Canvas",
  ];

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 1;

        // Change step when reaching certain thresholds
        if (newProgress === 33) {
          setCurrentStep(1);
        } else if (newProgress === 66) {
          setCurrentStep(2);
        }

        return newProgress > 100 ? 100 : newProgress;
      });
    }, 900); // 80ms * 100 = ~8 seconds total

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='fixed inset-0 flex flex-col items-center justify-center bg-white'>
      <motion.div
        className='w-full max-w-md text-center px-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className='text-3xl font-bold text-blue-500 mb-8'>TRYGO</h2>

        <div className='mb-8'>
          <Progress
            value={progress}
            className='h-2 bg-blue-100 transition-all duration-700 ease-in-out'
          />
        </div>

        {loadingSteps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity:
                currentStep === index ? 1 : currentStep > index ? 0.5 : 0.2,
              y: currentStep === index ? 0 : 10,
            }}
            transition={{ duration: 0.5 }}
            className={`text-xl mb-4 font-medium ${
              currentStep === index
                ? 'text-blue-500'
                : currentStep > index
                ? 'text-gray-500'
                : 'text-gray-400'
            }`}
          >
            {step}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
