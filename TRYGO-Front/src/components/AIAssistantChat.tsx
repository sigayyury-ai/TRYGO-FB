import { FC, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  useSocketStore,
  CreateMessageInput,
  AnswerCreatedEvent,
} from "@/store/useSocketStore";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { useProjectStore } from "@/store/useProjectStore";
import { MessageType } from "@/types/MessageType";
import Cookies from "js-cookie";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";
import FormattedMessage from "@/components/ui/formatted-message";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "./UpgradeModal";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

interface AIAssistantChatProps {
  defaultOpen?: boolean;
}

const AIAssistantChat: FC<AIAssistantChatProps> = ({ defaultOpen = false }) => {
  // Check if user has previously closed the AI assistant
  const getInitialOpenState = (): boolean => {
    if (!defaultOpen) return false;
    
    try {
      const aiClosed = Cookies.get("aiAssistantClosed");
      return aiClosed !== "true";
    } catch (error) {
      return defaultOpen;
    }
  };

  const [isOpen, setIsOpen] = useState(getInitialOpenState());

  // Save AI assistant closed state to cookies
  const handleClose = () => {
    setIsOpen(false);
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1); // Expire in 1 year
      Cookies.set("aiAssistantClosed", "true", { expires });
    } catch (error) {
      // Silent error handling
    }
  };

  // Handle opening (remove closed state from cookies)
  const handleOpen = () => {
    setIsOpen(true);
    try {
      Cookies.remove("aiAssistantClosed");
    } catch (error) {
      // Silent error handling
    }
  };
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  // const [isLoading, setIsLoading] = useState(false);
  const [animatedText, setAnimatedText] = useState("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [wantToChangeInfo, setWantToChangeInfo] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { canSendMessage, assistantMessages, currentPlan } = useSubscription();

  const {
    socket,
    sendChatMessage,
    isConnected,
    chatError,
    chatLoading,
  } = useSocketStore();
  const { activeProject } = useProjectStore();
  const { activeHypothesis } = useHypothesisStore();
  const selectedCustomerSegmentId = useHypothesesPersonProfileStore(
    (state) => state.selectedCustomerSegmentId
  );

  const getMessageType = (): MessageType => {
    const path = location.pathname;
    if (path.includes("dashboard")) return MessageType.ABOUT_LEAN_CANVAS;
    if (path.includes("research")) return MessageType.ABOUT_MARKET_RESEARCH;
    if (path.includes("person")) return MessageType.ABOUT_PERSON_PROFILE;
    if (path.includes("validation")) return MessageType.ABOUT_VALIDATION;
    if (path.includes("packing")) return MessageType.ABOUT_PACKING;
    if (path.includes("gtm")) {
      // Check if it's GTMDetails page (has channel ID in URL)
      if (path.match(/\/gtm\/\d+/)) {
        return MessageType.ABOUT_GTM_DETAILED_CHANNEL;
      } else {
        return MessageType.ABOUT_GTM;
      }
    }
    return MessageType.ABOUT_LEAN_CANVAS;
  };

  const getContextualPrompt = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) {
      return "Ask about Lean Canvas";
    } else if (path.includes("research")) {
      return "Ask about Research";
    } else if (path.includes("person")) {
      return "Ask about Personas";
    } else if (path.includes("validation")) {
      return "Ask about Validation";
    } else if (path.includes("packing")) {
      return "Ask about Packaging";
    } else if (path.includes("gtm")) {
      return "Ask about Go-To-Market";
    } else {
      return "Ask me anything...";
    }
  };

  const getPromptArray = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) {
      return [
        "Ask about Lean Canvas",
        "Need help with your canvas?",
        "Stuck on your value proposition?",
        "Explore canvas examples",
      ];
    } else if (path.includes("research")) {
      return [
        "Ask about Research",
        "Need market insights?",
        "Analyze competitors",
        "Research methods",
      ];
    } else if (path.includes("person")) {
      return [
        "Ask about Personas",
        "Create effective personas",
        "User journey questions?",
        "Persona best practices",
      ];
    } else if (path.includes("validation")) {
      return [
        "Ask about Validation",
        "How to validate my idea?",
        "Designing experiments",
        "Collecting user feedback",
      ];
    } else if (path.includes("packing")) {
      return [
        "Ask about Packaging",
        "Tips for product packaging",
        "How to design user-friendly packaging?",
        "Eco-friendly packaging options",
      ];
    } else if (path.includes("gtm")) {
      return [
        "Ask about Go-To-Market",
        "Need GTM strategy help?",
        "How to find first customers?",
        "Go-To-Market best practices",
      ];
    } else {
      return [
        "Ask me anything...",
        "Need business advice?",
        "Get startup tips",
        "Explore strategies",
      ];
    }
  };

  const getContextualSuggestions = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) {
      return [
        "How to define my problem?",
        "Tips for unique value proposition",
        "Best revenue models for my business",
      ];
    } else if (path.includes("research")) {
      return [
        "How to analyze competitors?",
        "Market size estimation tips",
        "Customer research methods",
      ];
    } else if (path.includes("person")) {
      return [
        "Creating effective personas",
        "Understanding user pain points",
        "Mapping user journeys",
      ];
    } else if (path.includes("validation")) {
      return [
        "How to run validation experiments?",
        "Best practices for user testing",
        "Metrics to measure validation",
      ];
    } else if (path.includes("packing")) {
      return [
        "How to make packaging more appealing?",
        "Best practices for sustainable packaging",
        "Balancing cost and design in packaging",
      ];
    } else if (path.includes("gtm")) {
      // Check if it's GTMDetails page (has channel ID in URL)
      if (path.match(/\/gtm\/\d+/)) {
        return [
          "Add insights from campaign",
          "Improve campaign",
          "Optimize channel performance",
          "Generate content variations",
        ];
      } else {
        // Regular GTM page
        return [
          "Best go-to-market strategies",
          "How to find first 100 customers?",
          "Launching my MVP to the market",
        ];
      }
    } else {
      return [
        "Getting started with the platform",
        "Building my business model",
        "How to validate my idea",
      ];
    }
  };

  // Socket is initialized in App.tsx after authentication
  // This component only sets up event listeners
  useEffect(() => {
    if (!socket) {
      // Socket not initialized yet, wait for it
      return;
    }

    // Set up event listeners for this component
    const handleAnswerCreated = () => {
      // Event handling is done in useSocketStore
    };

    socket.on("answerCreated", handleAnswerCreated);

    return () => {
      if (socket) {
        socket.off("answerCreated", handleAnswerCreated);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // Re-setup listeners if socket changes

  useEffect(() => {
    const prompts = getPromptArray();
    const currentPrompt = prompts[currentPromptIndex];
    let charIndex = 0;
    let typingInterval: ReturnType<typeof setTimeout>;

    const typeText = () => {
      if (charIndex <= currentPrompt.length) {
        setAnimatedText(currentPrompt.substring(0, charIndex));
        charIndex++;
        typingInterval = setTimeout(typeText, 70);
      } else {
        setTimeout(() => {
          eraseText();
        }, 2000);
      }
    };

    const eraseText = () => {
      if (charIndex > 0) {
        setAnimatedText(currentPrompt.substring(0, charIndex - 1));
        charIndex--;
        typingInterval = setTimeout(eraseText, 30);
      } else {
        setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % prompts.length);
      }
    };

    typeText();

    return () => {
      clearTimeout(typingInterval);
    };
  }, [currentPromptIndex, location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleAnswerCreated = (data: AnswerCreatedEvent) => {
      const aiResponse = {
        id: Date.now(),
        text: data.message,
        sender: "ai" as const,
      };
      setMessages((prev) => [...prev, aiResponse]);
    };

    socket.on("answerCreated", handleAnswerCreated);

    return () => {
      socket.off("answerCreated", handleAnswerCreated);
    };
  }, [socket]);

  useEffect(() => {
    if (chatError) {
      toast({
        title: "Chat error",
        description: chatError,
        variant: "destructive",
      });
    }
  }, [chatError, toast]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    // Check message limits
    if (!canSendMessage()) {
      setShowUpgradeModal(true);
      return;
    }

    if (!activeProject || !activeProject.id) {
      toast({
        title: "Error",
        description: "Active project not loaded. Cannot send message.",
        variant: "destructive",
      });
      return;
    }

    if (!activeHypothesis || !activeHypothesis.id) {
      toast({
        title: "Error",
        description: "Active hypothesis not loaded. Cannot send message.",
        variant: "destructive",
      });
      return;
    }

    const messageType = getMessageType();

    // Extract channel ID from URL for GTM Details page
    const channelId = location.pathname.match(/\/gtm\/(\d+)/)?.[1];

    const aiMessage: CreateMessageInput = {
      message: input,
      projectId: activeProject.id,
      projectHypothesisId: activeHypothesis.id,
      messageType,
      id: `${Date.now()}`,
      wantToChangeInfo,
      ...(messageType === MessageType.ABOUT_PERSON_PROFILE &&
      selectedCustomerSegmentId
        ? { customerSegmentId: selectedCustomerSegmentId }
        : {}),
      ...(messageType === MessageType.ABOUT_GTM_DETAILED_CHANNEL && channelId
        ? { 
            hypothesesGtmChannelId: channelId,
            customerSegmentId: selectedCustomerSegmentId 
          }
        : {}),
    };


    const newUserMessage = {
      id: Date.now(),
      text: input,
      sender: "user" as const,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    sendChatMessage(aiMessage);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
      duration: 2000,
    });
  };

  const suggestions = getContextualSuggestions();

  if (location.pathname.includes("hypotheses")) {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {/* Chat Toggle Button */}
      <Button
        className={cn(
          "min-h-14 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg",
          "text-white font-medium transition-all duration-300 hover:shadow-blue-200/50 hover:shadow-xl",
          "border border-blue-400 flex items-center gap-2"
        )}
        onClick={() => isOpen ? handleClose() : handleOpen()}
      >
        <span className="min-w-[180px] text-left overflow-hidden">
          {animatedText}
          <span className="animate-pulse">|</span>
        </span>
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[450px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-blue-200 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between ">
            <h3 className="text-white font-bold flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              AI Assistant
            </h3>
            <X
              className="cursor-pointer h-5 w-5 mr-2 text-white"
              onClick={handleClose}
            />
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-grow p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-lg font-medium">{getContextualPrompt()}</p>
                <p className="text-sm mt-2 mb-6">
                  I can help with strategy, marketing, and business model
                  questions.
                </p>

                <div className="flex flex-col gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(suggestion);
                        handleSend(
                          new Event("click") as unknown as React.FormEvent
                        );
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-800 text-sm py-2 px-3 rounded-lg text-left transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message mb-4 ${
                    message.sender === "user" ? "user-message" : "ai-message"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl inline-block max-w-[85%] ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white ml-auto"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <FormattedMessage text={message.text} />
                  </div>

                  {message.sender === "ai" && (
                    <div className="flex items-center mt-1 space-x-1 text-gray-400">
                      <button
                        className="p-1 hover:text-gray-700 rounded"
                        onClick={() => handleCopyMessage(message.text)}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button className="p-1 hover:text-green-600 rounded">
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button className="p-1 hover:text-red-600 rounded">
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {chatLoading && (
              <div className="chat-message mb-4 ai-message">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-xl inline-block">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            className="border-t border-gray-200 p-4 space-y-2"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                id="changeInfoCheckbox"
                checked={wantToChangeInfo}
                onChange={(e) => setWantToChangeInfo(e.target.checked)}
                className="mr-2"
                disabled={chatLoading}
              />
              <label
                htmlFor="changeInfoCheckbox"
                className="text-sm text-gray-700"
              >
                Add changes to page based on message
              </label>
            </div>
            <div className="flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getContextualPrompt()}
                className="flex-grow mr-2 border-blue-200 focus:border-blue-500 focus-visible:ring-blue-500"
                disabled={chatLoading || !activeProject || !activeHypothesis}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  chatLoading ||
                  !input.trim() ||
                  !activeProject ||
                  !activeHypothesis
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="AI assistant"
        reason={`You have reached the message limit for the ${currentPlan} plan. Upgrade your plan to continue using the AI assistant.`}
      />
    </div>
  );
};

export default AIAssistantChat;
