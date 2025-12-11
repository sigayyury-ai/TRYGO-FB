import { FC, useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';

interface EditableListProps {
  initialItems: string[];
  onItemsChange: (items: string[]) => void;
}

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
};


const EditableList: FC<EditableListProps> = ({
  initialItems,
  onItemsChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialItems.join('\n'));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    setText(initialItems.join('\n'));
  }, [initialItems]);

  const displayText = text
    .split('\n')
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n');

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();

      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';

      if (isInitialRender.current) {
        const textLength = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(textLength, textLength);
        isInitialRender.current = false;
      }
    } else {
      isInitialRender.current = true;
    }
  }, [isEditing, text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cleanedText = e.target.value
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, ''))
      .join('\n');

    setText(cleanedText);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const cursorPosition = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = text.substring(0, cursorPosition);
      const textAfterCursor = text.substring(cursorPosition);

      setText(`${textBeforeCursor}\n${textAfterCursor}`);
    }
  };

  const normalize = (str: string) =>
    str
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .join('\n');

  const handleBlur = () => {
    setIsEditing(false);
    const newNormalized = normalize(text);
    const initialNormalized = normalize(initialItems.join('\n'));

    if (newNormalized !== initialNormalized) {
      const newItems = newNormalized.split('\n');
      onItemsChange(newItems);
    }
    // onItemsChange(text.split('\n').filter((item) => item.trim() !== ''));
  };

  return (
    <div className='space-y-2'>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className='w-full min-h-[100px] p-3 border border-blue-200 rounded-md text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm'
          style={{
            resize: 'none',
            overflow: 'hidden',
          }}
        />
      ) : (
        <div>
          <pre
            onClick={() => setIsEditing(true)}
            className='whitespace-pre-wrap text-left text-gray-800 cursor-pointer font-sans'
          >
            {displayText}
          </pre>
          <button
            onClick={() => setIsEditing(true)}
            className='mt-2 text-blue-500 hover:text-blue-700 flex items-center text-sm'
          >
            <Pencil className='h-3.5 w-3.5 mr-1' /> Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableList;
