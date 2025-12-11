import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentCategory, ContentIdeaType } from "@/api/getSeoAgentContentIdeas";
import { useToast } from "@/hooks/use-toast";

interface CustomIdeaFormProps {
  projectId: string;
  hypothesisId?: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: ContentCategory;
    contentType: ContentIdeaType;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CustomIdeaForm = ({
  projectId,
  hypothesisId,
  onSubmit,
  onCancel,
  loading = false,
}: CustomIdeaFormProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ContentCategory>(ContentCategory.INFORMATIONAL);
  const [contentType, setContentType] = useState<ContentIdeaType>(ContentIdeaType.ARTICLE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        contentType,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory(ContentCategory.INFORMATIONAL);
      setContentType(ContentIdeaType.ARTICLE);
    } catch (error) {
      // Error handling is done in parent
    }
  };

  const [owner, setOwner] = useState("");

  const handleClear = () => {
    setTitle("");
    setDescription("");
    setCategory(ContentCategory.INFORMATIONAL);
    setContentType(ContentIdeaType.ARTICLE);
    setOwner("");
    onCancel();
  };

  return (
    <div className="content-create rounded-xl p-4 border-2 border-dashed border-gray-300 bg-blue-50/30 flex flex-col gap-4">
      <h4 className="text-base font-semibold text-gray-900">Create new piece</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="content-create-fields grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title" className="text-xs uppercase tracking-wide text-gray-600 mb-2 block">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Remote IT onboarding checklist"
              className="rounded-xl border-gray-300"
              required
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-xs uppercase tracking-wide text-gray-600 mb-2 block">
              Category
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ContentCategory)}>
              <SelectTrigger className="rounded-xl border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ContentCategory.PAINS}>Article by pains</SelectItem>
                <SelectItem value={ContentCategory.GOALS}>Article by goals</SelectItem>
                <SelectItem value={ContentCategory.TRIGGERS}>Article by triggers</SelectItem>
                <SelectItem value={ContentCategory.PRODUCT_FEATURES}>Commercial page – feature</SelectItem>
                <SelectItem value={ContentCategory.BENEFITS}>Commercial page – benefit</SelectItem>
                <SelectItem value={ContentCategory.FAQS}>FAQ article</SelectItem>
                <SelectItem value={ContentCategory.INFORMATIONAL}>Informational article</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="owner" className="text-xs uppercase tracking-wide text-gray-600 mb-2 block">
              Owner
            </Label>
            <Input
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Assign teammate"
              className="rounded-xl border-gray-300"
            />
          </div>
        </div>

        <div className="content-outline">
          <Label htmlFor="outline" className="text-xs uppercase tracking-wide text-gray-600 mb-2 block">
            Outline
          </Label>
          <Textarea
            id="outline"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key sections, CTAs, assets needed..."
            rows={4}
            className="rounded-xl border-gray-300 min-h-[120px]"
          />
        </div>

        <div className="content-create-actions flex gap-3">
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2"
          >
            Add to production queue
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={loading}
            className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-5 py-2"
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
};

