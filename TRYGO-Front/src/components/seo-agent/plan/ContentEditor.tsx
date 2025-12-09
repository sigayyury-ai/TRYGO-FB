import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Check, Loader2, RefreshCw, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateImageForContentMutation } from "@/api/generateImageForContent";
import { approveContentItemMutation } from "@/api/approveContentItem";
import { upsertContentItemMutation } from "@/api/upsertContentItem";
import { regenerateContentMutation } from "@/api/regenerateContent";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";

interface ContentItem {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  outline?: string;
  status: string;
}

interface ContentEditorProps {
  contentItem: ContentItem;
  projectId: string;
  hypothesisId?: string;
  onClose: () => void;
  onApprove: () => void;
}

export const ContentEditor = ({
  contentItem,
  projectId,
  hypothesisId,
  onClose,
  onApprove,
}: ContentEditorProps) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [content, setContent] = useState(contentItem.content || "");
  const [imageUrl, setImageUrl] = useState(contentItem.imageUrl);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const { data } = await generateImageForContentMutation({
        contentItemId: contentItem.id,
        title: contentItem.title,
        description: contentItem.outline,
      });

      if (data?.generateImageForContent?.imageUrl) {
        setImageUrl(data.generateImageForContent.imageUrl);
        toast({
          title: "Success",
          description: "Image generated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertContentItemMutation({
        id: contentItem.id,
        projectId,
        hypothesisId: hypothesisId || "",
        title: contentItem.title,
        category: "INFO", // TODO: Get from backlog item
        format: "BLOG", // TODO: Get from backlog item
        outline: contentItem.outline,
        content,
        imageUrl,
        status: "DRAFT",
        userId: localStorage.getItem("userId") || "system", // Get from localStorage or use system
      });

      toast({
        title: "Success",
        description: "Content saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { data } = await regenerateContentMutation(
        contentItem.id,
        regeneratePrompt.trim() || undefined
      );

      if (data?.regenerateContent?.content) {
        setContent(data.regenerateContent.content);
        toast({
          title: "Success",
          description: "Content regenerated successfully",
        });
        setRegeneratePrompt("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate content",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      // Save first with ready status
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      await upsertContentItemMutation({
        id: contentItem.id,
        projectId,
        hypothesisId: hypothesisId || "",
        backlogIdeaId: (contentItem as any).backlogIdeaId,
        title: contentItem.title,
        category: (contentItem as any).category || "info",
        format: (contentItem as any).format || "blog",
        outline: editedOutline,
        content: editedContent,
        imageUrl: currentImageUrl,
        status: "ready",
        userId: user.id,
      });

      // Then approve
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Content: {contentItem.title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Edit and review the generated content. You can regenerate, generate an image, and approve when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={contentItem.status === "READY" ? "default" : "secondary"}>
              {contentItem.status}
            </Badge>
          </div>

          {/* Image Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Article Image</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={generatingImage}
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
            {imageUrl ? (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={contentItem.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                No image generated yet. Click "Generate Image" to create one.
              </div>
            )}
          </div>

          {/* Content Editor with Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Article Content</Label>
              <div className="flex gap-2">
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
              <div className="border rounded-lg p-4 bg-white min-h-[400px] prose prose-sm max-w-none whitespace-pre-wrap">
                {content || "*No content to preview*"}
              </div>
            ) : (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full article content will appear here..."
                rows={20}
                className="font-mono text-sm"
              />
            )}
            <p className="text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          {/* Regenerate Section */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <Label className="text-blue-800 font-medium">Regenerate Content</Label>
            </div>
            <div className="space-y-2">
              <Input
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                placeholder="Optional: Enter specific instructions for regeneration..."
                className="bg-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="w-full bg-blue-100 hover:bg-blue-200 border-blue-300"
              >
                {regenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Content
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

