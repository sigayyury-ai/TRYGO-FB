
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type for a hypothesis
export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

interface HypothesisContextType {
  activeHypothesis: Hypothesis | null;
  hypotheses: Hypothesis[];
  loading: boolean;
}

const HypothesisContext = createContext<HypothesisContextType>({
  activeHypothesis: null,
  hypotheses: [],
  loading: true
});

export const HypothesisProvider = ({ children }: { children: ReactNode }) => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [activeHypothesis, setActiveHypothesis] = useState<Hypothesis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load hypotheses from localStorage
    const loadHypotheses = () => {
      try {
        const savedHypotheses = localStorage.getItem('hypotheses');
        
        if (savedHypotheses) {
          const parsedHypotheses = JSON.parse(savedHypotheses).map((h: any) => ({
            ...h,
            createdAt: new Date(h.createdAt)
          }));
          
          setHypotheses(parsedHypotheses);
          
          // Find the active hypothesis
          const active = parsedHypotheses.find((h: Hypothesis) => h.isActive);
          setActiveHypothesis(active || null);
        } else {
          // Create a default hypothesis if none exists
          const defaultHypothesis: Hypothesis = {
            id: crypto.randomUUID(),
            title: "Initial Product Hypothesis",
            description: "Our product solves the problem of expensive marketing strategies by offering AI-powered recommendations.",
            isActive: true,
            createdAt: new Date()
          };
          
          setHypotheses([defaultHypothesis]);
          setActiveHypothesis(defaultHypothesis);
          localStorage.setItem('hypotheses', JSON.stringify([defaultHypothesis]));
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    loadHypotheses();
  }, []);

  return (
    <HypothesisContext.Provider value={{ 
      activeHypothesis, 
      hypotheses,
      loading
    }}>
      {children}
    </HypothesisContext.Provider>
  );
};

export const useHypothesis = () => useContext(HypothesisContext);
