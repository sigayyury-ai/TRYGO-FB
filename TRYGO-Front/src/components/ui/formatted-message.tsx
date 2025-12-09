import { FC } from 'react';

interface FormattedMessageProps {
  text?: string | null;
  className?: string;
}

const FormattedMessage: FC<FormattedMessageProps> = ({ text, className = '' }) => {
  // Handle undefined/null/empty text
  if (!text) {
    return <div className={className}></div>;
  }
  
  // Split text by newlines and create paragraph elements
  const paragraphs = text.split('\n').filter(line => line.trim() !== '');
  
  // If there's only one paragraph, render it as a simple div
  if (paragraphs.length <= 1) {
    return <div className={className}>{text}</div>;
  }
  
  // If there are multiple paragraphs, render them with proper spacing
  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <div key={index} className={index > 0 ? 'mt-2' : ''}>
          {paragraph}
        </div>
      ))}
    </div>
  );
};

export default FormattedMessage;
