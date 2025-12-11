import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SeoAnalyticsPanelProps {
  projectId: string;
  hypothesisId?: string;
}

export const SeoAnalyticsPanel = ({ projectId, hypothesisId }: SeoAnalyticsPanelProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics</h2>
        <p className="text-gray-600">SEO performance metrics and insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Analytics features will be available soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Analytics dashboard is in development. 
            This will show traffic, conversions, rankings, and other SEO metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

