import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeoAgentPostingSettingsStore } from "@/store/useSeoAgentPostingSettingsStore";
import LoaderSpinner from "@/components/LoaderSpinner";
import { Save } from "lucide-react";

interface SeoPostingSettingsPanelProps {
  projectId: string;
  hypothesisId?: string;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const LANGUAGES = [
  { value: "Russian", label: "Русский" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Español" },
  { value: "Portuguese", label: "Português" },
  { value: "Polish", label: "Polski" },
] as const;

export const SeoPostingSettingsPanel = ({
  projectId,
  hypothesisId,
}: SeoPostingSettingsPanelProps) => {
  const {
    settings,
    loading,
    error,
    draftSettings,
    getSettings,
    updateSettings,
    setDraftSettings,
    clearDraftSettings,
  } = useSeoAgentPostingSettingsStore();
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      // Load real data from API
      getSettings(projectId);
    }
  }, [projectId, getSettings]);

  const currentSettings = draftSettings || {
    weeklyPublishCount: settings?.weeklyPublishCount || 2,
    preferredDays: settings?.preferredDays || ["Tuesday", "Thursday"],
    autoPublishEnabled: settings?.autoPublishEnabled || false,
    language: settings?.language || "Russian",
  };

  const handleWeeklyCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 1 && count <= 7) {
      setDraftSettings(
        count,
        currentSettings.preferredDays.slice(0, count),
        currentSettings.autoPublishEnabled,
        currentSettings.language
      );
    }
  };

  const handleDayToggle = (day: string) => {
    const currentDays = currentSettings.preferredDays;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].slice(0, currentSettings.weeklyPublishCount);
    
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      newDays,
      currentSettings.autoPublishEnabled,
      currentSettings.language
    );
  };

  const handleAutoPublishToggle = (enabled: boolean) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      enabled,
      currentSettings.language
    );
  };

  const handleLanguageChange = (language: string) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      currentSettings.autoPublishEnabled,
      language
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(
        projectId,
        hypothesisId,
        currentSettings.weeklyPublishCount,
        currentSettings.preferredDays,
        currentSettings.autoPublishEnabled,
        currentSettings.language
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    clearDraftSettings();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderSpinner />
      </div>
    );
  }

  const hasChanges =
    !settings ||
    settings.weeklyPublishCount !== currentSettings.weeklyPublishCount ||
    JSON.stringify(settings.preferredDays) !==
      JSON.stringify(currentSettings.preferredDays) ||
    settings.autoPublishEnabled !== currentSettings.autoPublishEnabled ||
    (settings.language || "Russian") !== (currentSettings.language || "Russian");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Publication Settings</h2>
        <p className="text-gray-600">
          Configure your content publication cadence and automation preferences
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weekly Publication Cadence</CardTitle>
          <CardDescription>
            Set how many content pieces you want to publish per week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="weekly-count">
              Publications per week (1-7)
            </Label>
            <Input
              id="weekly-count"
              type="number"
              min="1"
              max="7"
              value={currentSettings.weeklyPublishCount}
              onChange={(e) => handleWeeklyCountChange(e.target.value)}
              className="w-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Publication Days</Label>
            <p className="text-sm text-gray-500 mb-3">
              Select up to {currentSettings.weeklyPublishCount} preferred days
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = currentSettings.preferredDays.includes(day);
                const isDisabled =
                  !isSelected &&
                  currentSettings.preferredDays.length >=
                    currentSettings.weeklyPublishCount;

                return (
                  <div
                    key={day}
                    className="flex items-center space-x-2 p-2 border rounded-lg"
                  >
                    <Checkbox
                      id={`day-${day}`}
                      checked={isSelected}
                      onCheckedChange={() => handleDayToggle(day)}
                      disabled={isDisabled}
                    />
                    <Label
                      htmlFor={`day-${day}`}
                      className={
                        isDisabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    >
                      {day}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Content Language</Label>
            <p className="text-sm text-gray-500 mb-2">
              Select the language for content generation
            </p>
            <Select
              value={currentSettings.language || "Russian"}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" className="w-full max-w-xs">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              This language will be used for generating content ideas and articles
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-publish"
                checked={currentSettings.autoPublishEnabled}
                onCheckedChange={handleAutoPublishToggle}
              />
              <Label htmlFor="auto-publish" className="cursor-pointer">
                Enable auto-publish
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Automatically publish content according to the schedule (stubbed in Phase 1)
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
