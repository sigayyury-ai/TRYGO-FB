
import { FC } from 'react';

interface FooterSectionProps {
  onScrollToSection: (section: string) => void;
}

const FooterSection: FC<FooterSectionProps> = ({ onScrollToSection }) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-bold text-gray-800 mb-2">MVPLaunch</h3>
            <p className="text-gray-500">Launch your MVP 5x faster</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); onScrollToSection('features'); }}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a 
              href="#process" 
              onClick={(e) => { e.preventDefault(); onScrollToSection('process'); }}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Process
            </a>
            <a 
              href="#audience" 
              onClick={(e) => { e.preventDefault(); onScrollToSection('audience'); }}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Audience
            </a>
            <a 
              href="#results" 
              onClick={(e) => { e.preventDefault(); onScrollToSection('results'); }}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Results
            </a>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">&copy; 2025 MVPLaunch. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
