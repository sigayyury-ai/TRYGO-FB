import { FC, useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader } from 'lucide-react';
import FormattedMessage from '@/components/ui/formatted-message';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatInterfaceProps {
  initialMessage?: string;
  onComplete?: () => void;
  onboardingOption?: 'link' | 'manual';
}

const questionsForUrl = [
  'What main problem does your product solve for your audience?',
  'How does your product solve this problem?',
];

const questionsForManual = [
  'What main problem does your product solve for your audience?',
  'How does your product solve this problem?',
];

const ChatInterface: FC<ChatInterfaceProps> = ({
  initialMessage,
  onComplete,
  onboardingOption,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedQuestions =
    onboardingOption === 'link' ? questionsForUrl : questionsForManual;

  useEffect(() => {
    // Add initial AI message if provided
    if (initialMessage) {
      setMessages([
        {
          id: Date.now(),
          text: initialMessage,
          sender: 'ai',
        },
      ]);
    } else {
      // If no initial message, start with the first question
      setMessages([
        {
          id: Date.now(),
          text: selectedQuestions[0],
          sender: 'ai',
        },
      ]);
      setCurrentQuestionIndex(1); // Next question will be index 1
    }
  }, [initialMessage, selectedQuestions]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const lastMessage = messages[messages.length - 1];
  const isFinalAIResponse = lastMessage?.sender === 'ai' &&
  lastMessage.text === "Thank you for sharing all this information! I've saved your responses and prepared your dashboard.";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      text: input,
      sender: 'user' as const,
    };

    // setMessages((prev) => {
    //   return [...prev, newUserMessage];
    // });
    setMessages([...messages, newUserMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      if (currentQuestionIndex < selectedQuestions.length) {
        const aiResponse = {
          id: Date.now(),
          text: selectedQuestions[currentQuestionIndex],
          sender: 'ai' as const,
        };
        setMessages((prev) => [...prev, aiResponse]);
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        // setMessages((prev) => {
        //   const updated = [...prev, aiResponse];
        //   setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        //   setIsLoading(false);
        //   return updated;
        // });
      } else {
        const aiResponse = {
          id: Date.now(),
          text: "Thank you for sharing all this information! I've saved your responses and prepared your dashboard.",
          sender: 'ai' as const,
        };

        // setMessages((prev) => {
        //   const updated = [...prev, aiResponse];
  
        //   const conversationHistory = updated.map((msg) => ({
        //     sender: msg.sender,
        //     text: msg.text,
        //   }));
        //   localStorage.setItem('userResponses', JSON.stringify(conversationHistory));
  
        //   setTimeout(() => {
        //     if (onComplete) {
        //       onComplete();
        //     }
        //   }, 3000);
  
        //   setIsLoading(false);
        //   return updated;
        // });
        setMessages((prev) => [...prev, aiResponse]);

        const conversationHistory = [...messages, newUserMessage].map(
          (msg) => ({
            sender: msg.sender,
            text: msg.text,
          })
        );
        localStorage.setItem(
          'userResponses',
          JSON.stringify(conversationHistory)
        );

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 3000);
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className='bg-white rounded-lg shadow-md w-full max-w-3xl mx-auto flex flex-col animate-fade-in'>
      <div className='p-4 bg-blue-100 rounded-t-lg border-b border-blue-200'>
        <h3 className='font-semibold text-blue-900'>MVPLaunch Assistant</h3>
      </div>

      <div className='p-4 h-[400px] overflow-y-auto flex-grow'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 p-3 rounded-lg ${
              message.sender === 'user'
                ? 'bg-blue-100 text-blue-900 ml-auto max-w-[80%]'
                : 'bg-blue-600 text-white max-w-[80%]'
            }`}
          >
            <FormattedMessage text={message.text} />
          </div>
        ))}
        {isLoading && (
          <div className='bg-blue-600 text-white p-3 rounded-lg max-w-[80%] mb-4'>
            <div className='flex space-x-2 items-center'>
              <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
              <div className='w-2 h-2 bg-white rounded-full animate-pulse delay-150'></div>
              <div className='w-2 h-2 bg-white rounded-full animate-pulse delay-300'></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className='p-4 border-t border-blue-200 flex items-center'
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type your message here...'
          className='flex-grow mr-2 border-blue-300 focus:border-blue-500'
          disabled={isLoading || isFinalAIResponse}
          ref={inputRef}
        />
        <Button
          type='submit'
          size='icon'
          className='bg-blue-600 hover:bg-blue-700'
          disabled={isLoading || !input.trim()}
        >
          <Send className='h-4 w-4' />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
