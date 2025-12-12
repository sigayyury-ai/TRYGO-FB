import { useState, useRef as ReactUseRef } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2, RefreshCw, Eye, EyeOff, Send, MessageSquare, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateImageForContentMutation } from "@/api/generateImageForContent";
import { approveContentItemMutation } from "@/api/approveContentItem";
import { upsertContentItemMutation } from "@/api/upsertContentItem";
import { regenerateContentMutation } from "@/api/regenerateContent";
import { rewriteTextSelectionMutation } from "@/api/rewriteTextSelection";
import { generateContentForBacklogIdeaMutation } from "@/api/generateContentForBacklogIdea";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/useUserStore";
import Cookies from "js-cookie";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface ContentItem {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  outline?: string;
  status: string;
  backlogIdeaId?: string;
}

interface ContentEditorProps {
  contentItem: ContentItem;
  projectId: string;
  hypothesisId?: string;
  onClose: () => void;
  onApprove: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const ContentEditor = ({
  contentItem,
  projectId,
  hypothesisId,
  onClose,
  onApprove,
}: ContentEditorProps) => {
  const { userData } = useUserStore();
  const { toast } = useToast();
  const [content, setContent] = useState(contentItem.content || "");
  const [imageUrl, setImageUrl] = useState(contentItem.imageUrl);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionInfo, setSelectionInfo] = useState<{
    index: number;
    length: number;
    text: string;
    contextBefore: string;
    contextAfter: string;
  } | null>(null);
  const quillRef = ReactUseRef<ReactQuill>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [activeSelectionInChat, setActiveSelectionInChat] = useState<string | null>(null);
  const chatEndRef = ReactUseRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const { data, errors } = await generateImageForContentMutation({
        contentItemId: contentItem.id,
        title: contentItem.title,
        description: contentItem.outline,
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || "Failed to generate image");
      }

      if (data?.generateImageForContent?.imageUrl) {
        const imageUrl = data.generateImageForContent.imageUrl;
        // Check if it's a placeholder
        if (imageUrl.includes('data:image/svg+xml') || imageUrl.includes('placeholder')) {
          toast({
            title: "Warning",
            description: "Image generation returned placeholder. Check GEMINI_API_KEY in backend.",
            variant: "destructive",
          });
        } else {
          setImageUrl(imageUrl);
          toast({
            title: "Success",
            description: "Image generated successfully",
          });
        }
      } else {
        throw new Error("No image URL returned from server");
      }
    } catch (error: any) {
      console.error("[ContentEditor] Image generation error:", error);
      console.error("[ContentEditor] Error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      
      let errorMessage = error.message || "Failed to generate image";
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = `Network error: ${error.networkError.message || "Failed to connect to server"}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRegenerate = async () => {
    const backlogIdeaId = (contentItem as any).backlogIdeaId;
    if (!backlogIdeaId) {
      console.error("[ContentEditor] No backlogIdeaId found in contentItem");
      toast({
        title: "Error",
        description: "Cannot regenerate: backlog idea ID not found. Please close and regenerate from backlog.",
        variant: "destructive",
      });
      return;
    }

    // Confirm regeneration if content exists
    if (content && content.trim().length > 0) {
      const confirmed = window.confirm(
        "This will completely replace the current content. Are you sure you want to regenerate?"
      );
      if (!confirmed) {
        return;
      }
    }

    setRegenerating(true);
    try {
      const { data, errors } = await generateContentForBacklogIdeaMutation({
        backlogIdeaId,
        projectId,
        hypothesisId,
      });

      if (errors && errors.length > 0) {
        console.error("[ContentEditor] GraphQL errors:", errors);
        throw new Error(errors[0].message || "Failed to regenerate content");
      }

      if (data?.generateContentForBacklogIdea) {
        const generated = data.generateContentForBacklogIdea;
        
        // Update content
        if (generated.content) {
          // Update state first
          setContent(generated.content);
          
          // Update Quill editor if it exists
          const quill = quillRef.current?.getEditor();
          if (quill) {
            // Use setTimeout to ensure state update is processed
            setTimeout(() => {
              try {
                quill.clipboard.dangerouslyPasteHTML(generated.content || "");
                // Clear selection after update
                quill.setSelection(null);
              } catch (quillError) {
                console.error("[ContentEditor] Error updating Quill:", quillError);
              }
            }, 0);
          }
        }
        
        // Update image if generated
        if (generated.imageUrl) {
          setImageUrl(generated.imageUrl);
        }
        
        // Update outline if available
        if (generated.outline) {
          // Update contentItem outline if needed
          (contentItem as any).outline = generated.outline;
        }

        toast({
          title: "Success",
          description: generated.imageUrl 
            ? "Content and image regenerated successfully" 
            : "Content regenerated. Image is being generated in the background...",
        });
      } else {
        console.error("[ContentEditor] No data in response:", data);
        throw new Error("No data returned from regeneration");
      }
    } catch (error: any) {
      console.error("[ContentEditor] Regenerate error:", error);
      console.error("[ContentEditor] Regenerate error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack
      });
      
      let errorMessage = error.message || "Failed to regenerate content";
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = `Network error: ${error.networkError.message || "Failed to connect to server"}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get latest content from Quill editor to ensure we save the most recent version
      const quill = quillRef.current?.getEditor();
      const latestContent = quill ? quill.root.innerHTML : content;

      const { data, errors } = await upsertContentItemMutation({
        id: contentItem.id,
        projectId,
        hypothesisId: hypothesisId || "",
        title: contentItem.title,
        category: "INFORMATIONAL",
        format: "BLOG",
        outline: contentItem.outline,
        content: latestContent,
        imageUrl,
        status: "DRAFT",
        userId: localStorage.getItem("userId") || "system",
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || "Failed to save content");
      }

      if (data?.upsertContentItem) {
        toast({
          title: "Success",
          description: "Content saved successfully",
        });
      } else {
        throw new Error("No data returned from save operation");
      }
    } catch (error: any) {
      console.error("[ContentEditor] Save error:", error);
      console.error("[ContentEditor] Save error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      
      let errorMessage = error.message || "Failed to save content";
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = `Network error: ${error.networkError.message || "Failed to connect to server"}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTextSelection = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const selection = quill.getSelection(true);
    if (!selection || selection.length === 0) {
      setSelectedText("");
      setSelectionInfo(null);
      return;
    }

    const selectedText_ = quill.getText(selection.index, selection.length);
    if (!selectedText_.trim()) {
      setSelectedText("");
      setSelectionInfo(null);
      return;
    }

    setSelectedText(selectedText_);
    const selectionData = {
      index: selection.index,
      length: selection.length,
      text: selectedText_,
      contextBefore: quill.getText(0, selection.index).substring(Math.max(0, quill.getText(0, selection.index).length - 500)),
      contextAfter: quill.getText(selection.index + selection.length, quill.getLength() - selection.index - selection.length).substring(0, 500)
    };
    setSelectionInfo(selectionData);
    // Store in ref for quick access
    (quillRef.current as any).__selection = selectionData;
  };

  const handleAddSelectionToChat = () => {
    if (!selectedText || !selectionInfo) return;

    // Add selection to chat as context
    const contextMessage: ChatMessage = {
      id: `selection-${Date.now()}`,
      role: "assistant",
      content: `📝 Selected text for editing:\n\n"${selectedText}"\n\nHow would you like me to edit this?`,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, contextMessage]);
    setActiveSelectionInChat(selectedText);
    setChatInput(""); // Clear input to let user type instruction
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearSelection = () => {
    setSelectedText("");
    setSelectionInfo(null);
    setActiveSelectionInChat(null);
    (quillRef.current as any).__selection = null;
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.setSelection(null);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isProcessingChat) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const instruction = chatInput.trim();
    setChatInput("");
    setIsProcessingChat(true);

    try {
      let result: string;
      
      // Check for current selection in editor (not just activeSelectionInChat)
      const quill = quillRef.current?.getEditor();
      let currentSelection = null;
      if (quill) {
        const selection = quill.getSelection(true);
        if (selection && selection.length > 0) {
          const selectedText_ = quill.getText(selection.index, selection.length);
          if (selectedText_.trim()) {
            currentSelection = {
              index: selection.index,
              length: selection.length,
              text: selectedText_,
              contextBefore: quill.getText(0, selection.index).substring(Math.max(0, quill.getText(0, selection.index).length - 500)),
              contextAfter: quill.getText(selection.index + selection.length, quill.getLength() - selection.index - selection.length).substring(0, 500)
            };
          }
        }
      }
      
      // Use activeSelectionInChat if available, otherwise use current selection
      const hasSelection = (activeSelectionInChat && selectionInfo) || currentSelection;
      const selectionToUse = (activeSelectionInChat && selectionInfo) ? selectionInfo : currentSelection;
      
      if (hasSelection && selectionToUse) {
        // Rewrite only the selected portion
        const { data, errors } = await rewriteTextSelectionMutation({
          contentItemId: contentItem.id,
          selectedText: selectionToUse.text,
          contextBefore: selectionToUse.contextBefore,
          contextAfter: selectionToUse.contextAfter,
          instruction: instruction
        });

        if (errors && errors.length > 0) {
          throw new Error(errors[0].message || "Failed to rewrite text");
        }

        if (data?.rewriteTextSelection?.success && data.rewriteTextSelection.rewrittenText) {
          if (quill && selectionToUse) {
            // Replace ONLY the selected portion
            // Set selection and delete
            quill.setSelection(selectionToUse.index, selectionToUse.length);
            quill.deleteText(selectionToUse.index, selectionToUse.length);
            
            // Insert rewritten text with HTML formatting preserved
            // Use clipboard to convert HTML to Delta format
            const delta = quill.clipboard.convert(data.rewriteTextSelection.rewrittenText);
            
            // Create insert delta at correct position
            const Delta = (quill as any).constructor.import("delta");
            if (Delta) {
              const insertDelta = new Delta()
                .retain(selectionToUse.index)
                .concat(delta);
              quill.updateContents(insertDelta, "api");
            } else {
              // Fallback: insert as plain text if Delta import fails
              quill.insertText(selectionToUse.index, data.rewriteTextSelection.rewrittenText.replace(/<[^>]*>/g, ""), "api");
            }
            
            // Update content state
            setContent(quill.root.innerHTML);
            
            // Extract plain text for preview in chat
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = data.rewriteTextSelection.rewrittenText;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            
            result = `✅ Selected text rewritten:\n\n"${plainText.substring(0, 200)}${plainText.length > 200 ? '...' : ''}"`;
            
            // Clear selection after successful rewrite
            handleClearSelection();
          } else {
            result = "✅ Text rewritten, but couldn't update editor. Please refresh.";
          }
        } else {
          throw new Error(data?.rewriteTextSelection?.error || "Failed to rewrite text");
        }
      } else {
        // No selection - apply instruction to entire content
        const { data, errors } = await regenerateContentMutation(
          contentItem.id,
          instruction
        );

        if (errors && errors.length > 0) {
          throw new Error(errors[0].message || "Failed to regenerate content");
        }

        if (data?.regenerateContent?.content) {
          setContent(data.regenerateContent.content);
          result = `✅ Content updated based on your instruction: "${instruction.substring(0, 100)}${instruction.length > 100 ? '...' : ''}"`;
        } else {
          throw new Error("No content returned from server");
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("[ContentEditor] Chat error:", error);
      console.error("[ContentEditor] Chat error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack
      });
      
      let errorText = error.message || "Failed to process your request";
      
      // Check for network errors
      if (error.networkError) {
        errorText = `Network error: ${error.networkError.message || "Failed to connect to server"}`;
      }
      
      // Check for GraphQL errors
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorText = `GraphQL error: ${error.graphQLErrors[0].message}`;
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${errorText}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: errorText,
        variant: "destructive",
      });
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      await upsertContentItemMutation({
        id: contentItem.id,
        projectId,
        hypothesisId: hypothesisId || "",
        backlogIdeaId: (contentItem as any).backlogIdeaId,
        title: contentItem.title,
        category: (contentItem as any).category || "INFORMATIONAL",
        format: (contentItem as any).format || "BLOG",
        outline: contentItem.outline || "",
        content: content,
        imageUrl: imageUrl,
        status: "READY",
            userId: userId,
      });

      await approveContentItemMutation({
        contentItemId: contentItem.id,
        projectId,
        hypothesisId,
      });

      toast({
        title: "Success",
        description: "Content approved and added to queue",
      });

      onApprove();
    } catch (error: any) {
      console.error("[ContentEditor] Error in handleApprove:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve content",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Edit Content: {contentItem.title}</DialogTitle>
          <DialogDescription>
            Canvas-style editor: Edit content on the left, chat with AI on the right
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* LEFT PANEL - Canvas Editor */}
          <div className="flex-1 flex flex-col border-r overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={contentItem.status === "READY" ? "default" : "secondary"}>
                  {contentItem.status}
                </Badge>
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Article Content</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={regenerating || saving || approving}
                      title="Regenerate entire article content"
                    >
                      {regenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {showPreview ? (
                  <div 
                    className="border rounded-lg p-6 bg-white min-h-[400px] content-preview overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: content || "<p class='text-gray-500 italic'>*No content to preview*</p>" }}
                  />
                ) : (
                  <div className="border rounded-lg relative">
                    <style>{`
                      .ql-toolbar {
                        position: sticky;
                        top: 0;
                        z-index: 10;
                        background: white;
                        border-bottom: 1px solid #e5e7eb;
                      }
                      .ql-container {
                        position: relative;
                      }
                    `}</style>
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={content}
                      onChange={(value) => {
                        // ReactQuill onChange passes HTML string
                        setContent(value);
                      }}
                      onSelectionChange={handleTextSelection}
                      placeholder="Full article content will appear here..."
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'script': 'sub'}, { 'script': 'super' }],
                          [{ 'indent': '-1'}, { 'indent': '+1' }],
                          [{ 'direction': 'rtl' }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          ['link', 'image', 'video'],
                          ['clean']
                        ],
                      }}
                      formats={[
                        'header',
                        'bold', 'italic', 'underline', 'strike',
                        'list', 'bullet',
                        'script',
                        'indent',
                        'direction',
                        'color', 'background',
                        'align',
                        'link', 'image', 'video'
                      ]}
                      style={{ minHeight: '500px' }}
                    />
                  </div>
                )}
                {selectedText && selectionInfo && (
                  <div className="border-2 border-purple-300 rounded-lg p-3 bg-purple-50 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-800 font-medium text-sm">
                            Selected text ({selectedText.length} chars)
                          </span>
                        </div>
                        <div className="bg-white border border-purple-200 rounded p-2 text-sm text-gray-700 max-h-32 overflow-y-auto">
                          "{selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}"
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddSelectionToChat}
                          className="bg-purple-100 hover:bg-purple-200 border-purple-300"
                          title="Add to chat for editing"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSelection}
                          className="text-gray-500 hover:text-gray-700"
                          title="Clear selection"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {content.replace(/<[^>]*>/g, '').length} characters
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Chat for Editing */}
          <div className="w-96 flex flex-col border-l bg-gray-50 min-h-0">
            {/* Image Section - Moved to right sidebar above chat */}
            <div className="p-4 border-b bg-white space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Article Image</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
              {imageUrl ? (
                <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={imageUrl}
                    alt={contentItem.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-gray-400 text-xs" style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No image yet
                </div>
              )}
            </div>

            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">AI Editor</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select text and ask me to rewrite, improve, or edit it
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 text-sm space-y-2 pt-8">
                  <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                  <p>You can edit content in two ways:</p>
                  <ul className="text-left space-y-1 mt-4">
                    <li>• <strong>Select text</strong> in the editor and type an instruction to rewrite only that portion</li>
                    <li>• <strong>Type any instruction</strong> without selection to apply it to the entire content</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-3">Examples: "Make it more engaging", "Add examples", "Simplify the language"</p>
                </div>
              )}
              
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessingChat && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t p-4 bg-white">
              {activeSelectionInChat && (
                <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-purple-800 font-medium">Editing:</span>
                      <p className="text-gray-700 mt-1 text-xs">
                        "{activeSelectionInChat.substring(0, 100)}{activeSelectionInChat.length > 100 ? '...' : ''}"
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveSelectionInChat(null);
                        handleClearSelection();
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <form onSubmit={handleChatSubmit} className="space-y-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    activeSelectionInChat 
                      ? "How should I edit this text? (e.g., 'make it more engaging', 'simplify', 'add examples')" 
                      : "Type your instruction here. Select text first to edit only that portion, or type without selection to edit entire content"
                  }
                  className="min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleChatSubmit(e);
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {activeSelectionInChat 
                      ? "I'll rewrite only the selected portion" 
                      : selectedText 
                        ? "Click + to edit selection, or type to edit entire content" 
                        : "Type to edit entire content, or select text to edit only that portion"}
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!chatInput.trim() || isProcessingChat}
                  >
                    {isProcessingChat ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  Press Cmd/Ctrl + Enter to send
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Actions - Moved outside panels to be always visible */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving || approving}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving || approving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={saving || approving || !content.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve & Add to Queue
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
