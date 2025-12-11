import { FC, useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface EditableTextProps {
  initialText: string;
  onTextChange: (text: string) => void;
}

const EditableText: FC<EditableTextProps> = ({ initialText, onTextChange }) => {
  const [text, setText] = useState<string>(initialText);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(text);
  };

  const handleEditComplete = () => {
    if (editValue.trim()) {
      setText(editValue);
      onTextChange(editValue);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Separate effect for auto-resizing textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editValue, isEditing]);

  useEffect(() => {
    // Only update if not currently editing to prevent cursor jumping
    if (!isEditing) {
      setText(initialText);
      setEditValue(initialText);
    }
  }, [initialText, isEditing]);

  return (
    <div>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
          }}
          onBlur={handleEditComplete}
          className="w-full min-h-[100px] p-3 border border-blue-200 rounded-md 
                     text-gray-800 focus:outline-none focus:border-blue-400 
                     focus:ring-1 focus:ring-blue-400 text-left resize-none"
          dir="ltr"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleEditComplete();
            }
          }}
        />
      ) : (
        <div>
          <div
            className="text-gray-800 cursor-pointer whitespace-pre-wrap text-left"
            onClick={handleEditStart}
          >
            {!text || text === "null" ? (
              <span className="text-gray-400 italic">Click to edit...</span>
            ) : (
              text
            )}
          </div>
          <button
            onClick={handleEditStart}
            className="mt-2 text-blue-500 hover:text-blue-700 flex items-center text-sm"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableText;
