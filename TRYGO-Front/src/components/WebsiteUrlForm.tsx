
import { FC, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ChatInterface from './ChatInterface';

const WebsiteUrlForm: FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    
    // Simulate API call to scan website
    setTimeout(() => {
      setIsLoading(false);
      setShowChat(true);
    }, 1500);
  };

  if (showChat) {
    return <ChatInterface initialMessage={`We've analyzed ${url}. Let's gather some more information about your product.`} />;
  }

  return (
    <motion.div 
      className="max-w-lg mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="website-url" className="text-sm font-medium">
            Enter your website URL
          </label>
          <Input
            id="website-url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border-orange-300 focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isLoading || !url}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">○</span>
              Analyzing website...
            </>
          ) : (
            'Get website info'
          )}
        </Button>
      </form>
    </motion.div>
  );
};

export default WebsiteUrlForm;
