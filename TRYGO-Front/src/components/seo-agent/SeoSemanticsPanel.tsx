import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { ClusterIntent, SeoClusterDto, getSeoAgentClustersQuery } from "@/api/getSeoAgentClusters";
import { createSeoAgentClusterMutation } from "@/api/createSeoAgentCluster";
import { updateSeoAgentClusterMutation } from "@/api/updateSeoAgentCluster";
import { deleteSeoAgentClusterMutation } from "@/api/deleteSeoAgentCluster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoaderSpinner from "@/components/LoaderSpinner";

interface SeoSemanticsPanelProps {
  projectId: string;
  hypothesisId?: string;
}

interface EditingCluster {
  id: string | null;
  title: string;
  intent: ClusterIntent;
  keywords: string[];
}

export const SeoSemanticsPanel = ({ projectId, hypothesisId }: SeoSemanticsPanelProps) => {
  const [clusters, setClusters] = useState<SeoClusterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingCluster, setEditingCluster] = useState<EditingCluster | null>(null);

  // Load clusters from API
  const loadClusters = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await getSeoAgentClustersQuery(projectId, hypothesisId);
      setClusters(data?.seoAgentClusters || []);
    } catch (error: unknown) {
      console.error("Error loading clusters:", error);
      let errorMessage = "Failed to load clusters";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadClusters();
    }
  }, [projectId, hypothesisId]);

  const handleCreate = () => {
    setEditingCluster({
      id: null,
      title: "",
      intent: ClusterIntent.INFORMATIONAL,
      keywords: [],
    });
    setIsCreating(true);
  };

  const handleEdit = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      setEditingCluster({
        id: cluster.id,
        title: cluster.title,
        intent: cluster.intent,
        keywords: [...cluster.keywords],
      });
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!editingCluster) return;

    const keywordsArray = editingCluster.keywords
      .join("\n")
      .split("\n")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    setLoading(true);
    try {
      if (editingCluster.id) {
        const { data } = await updateSeoAgentClusterMutation(editingCluster.id, {
          title: editingCluster.title,
          intent: editingCluster.intent,
          keywords: keywordsArray,
        });
        
        // Update local state
        setClusters(prev => prev.map(c => 
          c.id === editingCluster.id ? data.updateSeoAgentCluster : c
        ));
      } else {
        const { data } = await createSeoAgentClusterMutation({
          projectId,
          hypothesisId,
          title: editingCluster.title,
          intent: editingCluster.intent,
          keywords: keywordsArray,
        });
        
        // Add new cluster to local state
        setClusters(prev => [...prev, data.createSeoAgentCluster]);
      }

      setEditingCluster(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving cluster:", error);
      setError(error instanceof Error ? error.message : "Failed to save cluster");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingCluster(null);
    setIsCreating(false);
  };

  const handleDelete = async (clusterId: string) => {
    if (confirm("Are you sure you want to delete this cluster?")) {
      setLoading(true);
      try {
        await deleteSeoAgentClusterMutation(clusterId);
        
        // Remove from local state
        setClusters(prev => prev.filter(c => c.id !== clusterId));
      } catch (error) {
        console.error("Error deleting cluster:", error);
        setError(error instanceof Error ? error.message : "Failed to delete cluster");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Keyword Clusters</h2>
          <p className="text-gray-600">
            Create and manage keyword clusters to organize your SEO strategy
          </p>
        </div>
        <Button onClick={handleCreate} disabled={!!editingCluster}>
          <Plus className="h-4 w-4 mr-2" />
          New Cluster
        </Button>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">{error}</p>
            {error.includes("not available yet") && (
              <p className="text-xs text-yellow-600 mt-2">
                The SEO Agent backend API is being developed. The UI is ready and will work once the API is deployed.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {editingCluster && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>
              {isCreating ? "Create New Cluster" : "Edit Cluster"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={editingCluster.title}
                onChange={(e) =>
                  setEditingCluster({ ...editingCluster, title: e.target.value })
                }
                placeholder="Cluster title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Intent</label>
              <Select
                value={editingCluster.intent}
                onValueChange={(value) =>
                  setEditingCluster({
                    ...editingCluster,
                    intent: value as ClusterIntent,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClusterIntent.INFORMATIONAL}>
                    Informational
                  </SelectItem>
                  <SelectItem value={ClusterIntent.NAVIGATIONAL}>
                    Navigational
                  </SelectItem>
                  <SelectItem value={ClusterIntent.TRANSACTIONAL}>
                    Transactional
                  </SelectItem>
                  <SelectItem value={ClusterIntent.COMMERCIAL}>
                    Commercial
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Keywords (one per line)</label>
              <Textarea
                value={editingCluster.keywords.join("\n")}
                onChange={(e) =>
                  setEditingCluster({
                    ...editingCluster,
                    keywords: e.target.value.split("\n"),
                  })
                }
                placeholder="keyword1&#10;keyword2&#10;keyword3"
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {clusters.length === 0 && !editingCluster ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              No clusters yet. Create your first keyword cluster to get started.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Cluster
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster) => (
            <Card key={cluster.id}>
              <CardHeader>
                <CardTitle className="text-lg">{cluster.title}</CardTitle>
                <CardDescription>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {cluster.intent}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Keywords ({cluster.keywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cluster.keywords.slice(0, 5).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-100 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {cluster.keywords.length > 5 && (
                        <span className="text-xs px-2 py-1 text-gray-500">
                          +{cluster.keywords.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cluster.id)}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cluster.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
