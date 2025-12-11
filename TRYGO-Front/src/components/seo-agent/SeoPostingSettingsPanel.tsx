import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeoAgentPostingSettingsStore } from "@/store/useSeoAgentPostingSettingsStore";
import LoaderSpinner from "@/components/LoaderSpinner";
import { Save, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { testWordPressConnectionMutation } from "@/api/testWordPressConnection";
import { getWordPressCategoriesQuery, type WordPressCategory, type GetWordPressCategoriesInput } from "@/api/getWordPressCategories";
import { getWordPressTagsQuery, type WordPressTag, type GetWordPressTagsInput } from "@/api/getWordPressTags";
import { getWordPressPostTypesQuery, type WordPressPostType } from "@/api/getWordPressPostTypes";

interface SeoPostingSettingsPanelProps {
  projectId: string;
  hypothesisId: string; // Required, not optional
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
    if (projectId && hypothesisId) {
      // Load real data from API
      getSettings(projectId, hypothesisId);
    }
    // getSettings из store стабильна, не нужно включать в зависимости
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, hypothesisId]);

  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [tags, setTags] = useState<WordPressTag[]>([]);
  const [postTypes, setPostTypes] = useState<WordPressPostType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(settings?.wordpressDefaultCategoryId || null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(settings?.wordpressDefaultTagIds || []);
  const [selectedPostType, setSelectedPostType] = useState<string>(settings?.wordpressPostType || "post");
  const [postTypeInitialized, setPostTypeInitialized] = useState(false);

  // Load saved password from localStorage
  const getSavedPassword = (): string | null => {
    if (!settings?.wordpressBaseUrl || !settings?.wordpressUsername) return null;
    const key = `wp_password_${settings.wordpressBaseUrl}_${settings.wordpressUsername}`;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const savedPassword = getSavedPassword();

  // Use selectedPostType from state, not from settings, to reflect current UI selection
  const currentSettings = draftSettings || {
    weeklyPublishCount: settings?.weeklyPublishCount || 2,
    preferredDays: settings?.preferredDays || ["Tuesday", "Thursday"],
    autoPublishEnabled: settings?.autoPublishEnabled || false,
    language: settings?.language || "Russian",
    wordpressBaseUrl: settings?.wordpressBaseUrl || null,
    wordpressUsername: settings?.wordpressUsername || null,
    wordpressAppPassword: savedPassword || null,
    wordpressPostType: selectedPostType, // Use selectedPostType from state, not from settings
  };

  const handleWeeklyCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 1 && count <= 7) {
      setDraftSettings(
        count,
        currentSettings.preferredDays.slice(0, count),
        currentSettings.autoPublishEnabled,
        currentSettings.language,
        currentSettings.wordpressBaseUrl,
        currentSettings.wordpressUsername,
        currentSettings.wordpressAppPassword
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
      currentSettings.language,
      currentSettings.wordpressBaseUrl,
      currentSettings.wordpressUsername,
      currentSettings.wordpressAppPassword
    );
  };

  const handleAutoPublishToggle = (enabled: boolean) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      enabled,
      currentSettings.language,
      currentSettings.wordpressBaseUrl,
      currentSettings.wordpressUsername,
      currentSettings.wordpressAppPassword
    );
  };

  const handleLanguageChange = (language: string) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      currentSettings.autoPublishEnabled,
      language,
      currentSettings.wordpressBaseUrl,
      currentSettings.wordpressUsername,
      currentSettings.wordpressAppPassword
    );
  };

  const handleWordPressBaseUrlChange = (value: string) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      currentSettings.autoPublishEnabled,
      currentSettings.language,
      value || null,
      currentSettings.wordpressUsername,
      currentSettings.wordpressAppPassword
    );
  };

  const handleWordPressUsernameChange = (value: string) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      currentSettings.autoPublishEnabled,
      currentSettings.language,
      currentSettings.wordpressBaseUrl,
      value || null,
      currentSettings.wordpressAppPassword
    );
  };

  const handleWordPressPasswordChange = (value: string) => {
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      currentSettings.autoPublishEnabled,
      currentSettings.language,
      currentSettings.wordpressBaseUrl,
      currentSettings.wordpressUsername,
      value || null
    );
  };

  const handleTestConnection = async () => {
    if (!currentSettings.wordpressBaseUrl || !currentSettings.wordpressUsername || !currentSettings.wordpressAppPassword) {
      toast({
        title: "Error",
        description: "Please fill in all WordPress connection fields",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    let normalizedUrl = currentSettings.wordpressBaseUrl.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      toast({
        title: "Error",
        description: "WordPress URL must start with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    // Remove trailing slash
    normalizedUrl = normalizedUrl.replace(/\/$/, "");

    setTestingConnection(true);
    try {
      console.log("[SeoPostingSettingsPanel] Testing WordPress connection...");
      const { data, errors } = await testWordPressConnectionMutation({
        wordpressBaseUrl: normalizedUrl,
        wordpressUsername: currentSettings.wordpressUsername.trim(),
        wordpressAppPassword: currentSettings.wordpressAppPassword.trim(),
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || "Failed to test connection");
      }

      if (data?.testWordPressConnection?.success) {
        // Save password to localStorage for future use
        const passwordKey = `wp_password_${normalizedUrl}_${currentSettings.wordpressUsername.trim()}`;
        try {
          localStorage.setItem(passwordKey, currentSettings.wordpressAppPassword.trim());
        } catch (e) {
          console.warn("[SeoPostingSettingsPanel] Failed to save password to localStorage:", e);
        }
        
        // Update draft settings with normalized URL
        setDraftSettings(
          currentSettings.weeklyPublishCount,
          currentSettings.preferredDays,
          currentSettings.autoPublishEnabled,
          currentSettings.language,
          normalizedUrl,
          currentSettings.wordpressUsername.trim(),
          currentSettings.wordpressAppPassword.trim(),
          selectedPostType
        );
        
        toast({
          title: "Connection Successful",
          description: "Connection test passed! Click 'Save WordPress Settings' to save your configuration.",
        });
        
        // Load post types, categories and tags after successful test (but don't save yet)
        await loadWordPressData();
      } else {
        const errorMessage = data?.testWordPressConnection?.error || "Connection test failed";
        // Provide more helpful error messages for common issues
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes("401") || errorMessage.includes("not logged in")) {
          userFriendlyMessage = "Authentication failed. Please verify: " +
            "Your username is correct, " +
            "You're using an Application Password (not your regular password), " +
            "Application Passwords are enabled in WordPress (Users → Profile → Application Passwords)";
        } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          userFriendlyMessage = "WordPress REST API not found. Please verify: " +
            "The URL is correct and points to your WordPress site, " +
            "The WordPress REST API is enabled (usually enabled by default)";
        } else if (errorMessage.includes("403") || errorMessage.includes("forbidden")) {
          userFriendlyMessage = "Access forbidden. Please verify: " +
            "Your user account has proper permissions, " +
            "The Application Password has the correct permissions";
        }
        throw new Error(userFriendlyMessage);
      }
    } catch (error: any) {
      console.error("[SeoPostingSettingsPanel] Connection test error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to test connection. Please check your credentials and try again.",
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to allow reading the troubleshooting tips
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("[SeoPostingSettingsPanel] Saving settings with wordpressPostType:", selectedPostType);
      await updateSettings(
        projectId,
        hypothesisId,
        currentSettings.weeklyPublishCount,
        currentSettings.preferredDays,
        currentSettings.autoPublishEnabled,
        currentSettings.language,
        currentSettings.wordpressBaseUrl,
        currentSettings.wordpressUsername,
        currentSettings.wordpressAppPassword,
        selectedCategoryId,
        selectedTagIds,
        selectedPostType // CRITICAL: Use selectedPostType from state, not from currentSettings
      );
      // Mark post type as initialized after save so it won't be overwritten
      setPostTypeInitialized(true);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    clearDraftSettings();
  };

  const loadWordPressData = async () => {
    // Use saved settings if available, otherwise use current form values
    const baseUrl = settings?.wordpressBaseUrl || currentSettings.wordpressBaseUrl;
    const username = settings?.wordpressUsername || currentSettings.wordpressUsername;
    // Try to get password from form, then from localStorage, then from saved password
    const password = currentSettings.wordpressAppPassword || 
                     (baseUrl && username ? getSavedPassword() : null);

    if (!baseUrl || !username || !password) {
      console.warn("[SeoPostingSettingsPanel] Cannot load WordPress data - missing credentials:", {
        hasBaseUrl: !!baseUrl,
        hasUsername: !!username,
        hasPassword: !!password
      });
      return;
    }

    setLoadingCategories(true);
    try {
      console.log("[SeoPostingSettingsPanel] Loading WordPress data...", {
        baseUrl,
        username,
        hasPassword: !!password
      });
      
      // Load post types first
      console.log("[SeoPostingSettingsPanel] Fetching post types...");
      const postTypesResult = await getWordPressPostTypesQuery({
        wordpressBaseUrl: baseUrl,
        wordpressUsername: username,
        wordpressAppPassword: password,
      });
      
      // Determine which post type to use - prioritize saved settings, then state, then default
      let postTypeToUse = settings?.wordpressPostType || selectedPostType || currentSettings.wordpressPostType || "post";
      
      if (postTypesResult.data?.wordpressPostTypes) {
        const allPostTypes = postTypesResult.data.wordpressPostTypes;
        console.log("[SeoPostingSettingsPanel] ✅ Post types loaded:", allPostTypes.length);
        console.log("[SeoPostingSettingsPanel] Available post types:", allPostTypes.map(pt => `${pt.name} (${pt.label}, public: ${pt.public})`));
        setPostTypes(allPostTypes);
        
        // Check if current post type is in the list
        const availablePostTypes = allPostTypes.map(pt => pt.name);
        if (!availablePostTypes.includes(postTypeToUse)) {
          // Only reset if the post type is not available AND it's not explicitly set by user
          const defaultPostType = availablePostTypes.includes("post") ? "post" : availablePostTypes[0];
          console.log(`[SeoPostingSettingsPanel] Post type "${postTypeToUse}" not available, switching to "${defaultPostType}"`);
          setSelectedPostType(defaultPostType);
          postTypeToUse = defaultPostType;
        } else {
          // Ensure selectedPostType matches the saved/available post type
          if (selectedPostType !== postTypeToUse) {
            console.log(`[SeoPostingSettingsPanel] Syncing selectedPostType to "${postTypeToUse}" from settings`);
            setSelectedPostType(postTypeToUse);
          }
        }
      }

      // Load categories for the determined post type
      console.log("[SeoPostingSettingsPanel] Fetching categories for post type:", postTypeToUse);
      const categoriesInput: GetWordPressCategoriesInput = {
        wordpressBaseUrl: baseUrl,
        wordpressUsername: username,
        wordpressAppPassword: password,
        postType: postTypeToUse,
      };
      const categoriesResult = await getWordPressCategoriesQuery(categoriesInput);

      if (categoriesResult.data?.wordpressCategories) {
        console.log("[SeoPostingSettingsPanel] ✅ Categories loaded:", categoriesResult.data.wordpressCategories.length);
        console.log("[SeoPostingSettingsPanel] Categories:", categoriesResult.data.wordpressCategories.map((c: WordPressCategory) => `${c.name} (${c.slug}, id:${c.id})`));
        setCategories(categoriesResult.data.wordpressCategories);
        
        // Restore saved category from settings if available and exists in loaded categories
        const savedCategoryId = settings?.wordpressDefaultCategoryId;
        if (savedCategoryId !== undefined && savedCategoryId !== null) {
          const savedCategoryExists = categoriesResult.data.wordpressCategories.some(
            (cat: WordPressCategory) => cat.id === savedCategoryId
          );
          if (savedCategoryExists) {
            console.log(`[SeoPostingSettingsPanel] Restoring saved category: ${savedCategoryId}`);
            setSelectedCategoryId(savedCategoryId);
          } else {
            console.log(`[SeoPostingSettingsPanel] Saved category ${savedCategoryId} not found in loaded categories`);
            // Only clear if current selection also doesn't exist
            const currentCategoryExists = selectedCategoryId 
              ? categoriesResult.data.wordpressCategories.some((cat: WordPressCategory) => cat.id === selectedCategoryId)
              : false;
            if (!currentCategoryExists) {
              setSelectedCategoryId(null);
            }
          }
        } else {
          // Check if currently selected category exists in the loaded categories
          const currentCategoryExists = selectedCategoryId 
            ? categoriesResult.data.wordpressCategories.some((cat: WordPressCategory) => cat.id === selectedCategoryId)
            : false;
          
          // If selected category doesn't exist in loaded categories, clear selection
          if (selectedCategoryId && !currentCategoryExists) {
            console.log("[SeoPostingSettingsPanel] Selected category not found in loaded categories, clearing selection");
            setSelectedCategoryId(null);
          }
        }
      }

      // Load tags for the selected post type
      console.log("[SeoPostingSettingsPanel] Fetching tags for post type:", postTypeToUse);
      const tagsInput: GetWordPressTagsInput = {
        wordpressBaseUrl: baseUrl,
        wordpressUsername: username,
        wordpressAppPassword: password,
        postType: postTypeToUse,
      };
      const tagsResult = await getWordPressTagsQuery(tagsInput);
      
      if (tagsResult.data?.wordpressTags) {
        console.log("[SeoPostingSettingsPanel] ✅ Tags loaded:", tagsResult.data.wordpressTags.length);
        setTags(tagsResult.data.wordpressTags);
        
        // Restore saved tags from settings if available
        const savedTagIds = settings?.wordpressDefaultTagIds;
        if (savedTagIds && Array.isArray(savedTagIds) && savedTagIds.length > 0) {
          // Filter to only include tags that exist in the loaded tags
          const availableTagIds = tagsResult.data.wordpressTags.map((tag: WordPressTag) => tag.id);
          const validSavedTagIds = savedTagIds.filter((id: number) => availableTagIds.includes(id));
          if (validSavedTagIds.length > 0) {
            console.log(`[SeoPostingSettingsPanel] Restoring saved tags: ${validSavedTagIds.join(', ')}`);
            setSelectedTagIds(validSavedTagIds);
          } else {
            console.log(`[SeoPostingSettingsPanel] Saved tags not found in loaded tags`);
          }
        }
      }
      
      console.log("[SeoPostingSettingsPanel] ✅ WordPress data loaded successfully");
    } catch (error: any) {
      console.error("[SeoPostingSettingsPanel] ❌ Failed to load WordPress data:", error);
      console.error("[SeoPostingSettingsPanel] Error details:", {
        message: error.message,
        name: error.name,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack
      });
      
      // Provide more helpful error message
      let errorMessage = "Connected to WordPress, but failed to load categories and tags";
      if (error.networkError || error.message?.includes("Failed to fetch")) {
        errorMessage = "Network error: Cannot connect to backend server. Please check if the main backend is running on port 5001.";
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Warning",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load WordPress data if connection is already established
  useEffect(() => {
    if (settings?.wordpressConnected && settings.wordpressBaseUrl && settings.wordpressUsername) {
      // If we have saved connection, try to load data
      // Use currentSettings password, saved password from localStorage, or skip if neither available
      const hasPassword = currentSettings.wordpressAppPassword || getSavedPassword();
      if (hasPassword) {
        // Update draft settings with saved password if not already set
        if (!currentSettings.wordpressAppPassword && savedPassword) {
          setDraftSettings(
            currentSettings.weeklyPublishCount,
            currentSettings.preferredDays,
            currentSettings.autoPublishEnabled,
            currentSettings.language,
            currentSettings.wordpressBaseUrl,
            currentSettings.wordpressUsername,
            savedPassword,
            selectedPostType // Use current selectedPostType, not from currentSettings
          );
        }
        loadWordPressData();
      }
    }
    // Remove selectedPostType from dependencies to avoid reloading when user changes it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.wordpressConnected, settings?.wordpressBaseUrl, settings?.wordpressUsername]);

  // Initialize selected category, tags, and post type from settings
  // This effect runs when settings are first loaded or when they change after save
  useEffect(() => {
    // Only update if settings exist and we have WordPress connection
    if (!settings?.wordpressConnected) {
      return;
    }
    
    // Initialize post type - only set if not already initialized or if settings changed after save
    if (settings?.wordpressPostType) {
      if (!postTypeInitialized) {
        console.log(`[SeoPostingSettingsPanel] Initializing post type from settings: ${settings.wordpressPostType}`);
        setSelectedPostType(settings.wordpressPostType);
        setPostTypeInitialized(true);
      } else {
        // Always sync with settings after initialization to ensure consistency
        setSelectedPostType((current) => {
          if (current !== settings.wordpressPostType) {
            console.log(`[SeoPostingSettingsPanel] Post type changed in settings after save: ${settings.wordpressPostType}`);
            return settings.wordpressPostType;
          }
          return current;
        });
      }
    }
    
    // Initialize category from settings
    if (settings?.wordpressDefaultCategoryId !== undefined) {
      setSelectedCategoryId((current) => {
        if (current !== settings.wordpressDefaultCategoryId) {
          console.log(`[SeoPostingSettingsPanel] Initializing category from settings: ${settings.wordpressDefaultCategoryId}`);
          return settings.wordpressDefaultCategoryId;
        }
        return current;
      });
    }
    
    // Initialize tags from settings
    if (settings?.wordpressDefaultTagIds !== undefined) {
      setSelectedTagIds((current) => {
        const savedTags = Array.isArray(settings.wordpressDefaultTagIds) ? settings.wordpressDefaultTagIds : [];
        const currentTagsStr = JSON.stringify([...current].sort());
        const savedTagsStr = JSON.stringify([...savedTags].sort());
        if (currentTagsStr !== savedTagsStr) {
          console.log(`[SeoPostingSettingsPanel] Initializing tags from settings: ${savedTags.join(', ')}`);
          return [...savedTags];
        }
        return current;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.wordpressDefaultCategoryId, settings?.wordpressDefaultTagIds, settings?.wordpressPostType, settings?.wordpressConnected, postTypeInitialized]);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleTagToggle = (tagId: number) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(newTagIds);
  };

  const handlePostTypeChange = async (postType: string) => {
    console.log("[SeoPostingSettingsPanel] Post type changed to:", postType);
    setSelectedPostType(postType);
    // Update draft settings with new post type
    setDraftSettings(
      currentSettings.weeklyPublishCount,
      currentSettings.preferredDays,
      currentSettings.autoPublishEnabled,
      currentSettings.language,
      currentSettings.wordpressBaseUrl,
      currentSettings.wordpressUsername,
      currentSettings.wordpressAppPassword,
      postType // CRITICAL: Pass the new post type to update draft settings
    );
    
    // Reload categories and tags for the new post type
    if (currentSettings.wordpressBaseUrl && currentSettings.wordpressUsername && currentSettings.wordpressAppPassword) {
      await loadWordPressData();
    }
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
    (settings.language || "Russian") !== (currentSettings.language || "Russian") ||
    (settings.wordpressBaseUrl || null) !== (currentSettings.wordpressBaseUrl || null) ||
    (settings.wordpressUsername || null) !== (currentSettings.wordpressUsername || null) ||
    currentSettings.wordpressAppPassword !== null || // Password change always counts as change
    (settings.wordpressPostType || "post") !== selectedPostType ||
    (settings.wordpressDefaultCategoryId || null) !== selectedCategoryId ||
    JSON.stringify(settings.wordpressDefaultTagIds || []) !== JSON.stringify(selectedTagIds);

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

      {/* WordPress Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress Connection</CardTitle>
          <CardDescription>
            Configure WordPress site connection for automatic publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          {settings?.wordpressConnected && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                WordPress connected
              </span>
              {settings.wordpressBaseUrl && (
                <span className="text-xs text-green-600 ml-auto">
                  {settings.wordpressBaseUrl}
                </span>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wp-base-url">WordPress Site URL</Label>
              <Input
                id="wp-base-url"
                type="url"
                placeholder="https://yoursite.com"
                value={currentSettings.wordpressBaseUrl || ""}
                onChange={(e) => handleWordPressBaseUrlChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter your WordPress site URL (e.g., https://yoursite.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wp-username">WordPress Username</Label>
              <Input
                id="wp-username"
                type="text"
                placeholder="admin"
                value={currentSettings.wordpressUsername || ""}
                onChange={(e) => handleWordPressUsernameChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                WordPress username for API authentication
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wp-password">Application Password</Label>
              <div className="relative">
                <Input
                  id="wp-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter application password"
                  value={currentSettings.wordpressAppPassword || ""}
                  onChange={(e) => handleWordPressPasswordChange(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Create an Application Password in WordPress: Users → Profile → Application Passwords
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection || !currentSettings.wordpressBaseUrl || !currentSettings.wordpressUsername || !currentSettings.wordpressAppPassword}
              >
                {testingConnection ? (
                  <>
                    <div className="h-4 w-4 mr-2">
                      <LoaderSpinner />
                    </div>
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || testingConnection}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save WordPress Settings"}
              </Button>
            </div>
          </div>

          {/* WordPress Categories and Tags Selection */}
          {settings?.wordpressConnected && (
            <div className="space-y-6 pt-6 border-t">
              {/* Show message if password is needed to load data */}
              {!currentSettings.wordpressAppPassword && !savedPassword && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-800">
                    Enter your Application Password above to load categories and tags
                  </span>
                </div>
              )}
              
              {/* Post Type Selection */}
              {postTypes.length > 0 && (
                <div className="space-y-2">
                  <Label>Post Type</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Select the WordPress post type for published content (including ACF custom post types)
                  </p>
                  <Select
                    value={selectedPostType}
                    onValueChange={handlePostTypeChange}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      {postTypes.map((postType) => (
                        <SelectItem key={postType.name} value={postType.name}>
                          {postType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">
                    All available post types are shown. Categories and tags will be loaded for the selected post type.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Default Tags</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Select default tags to apply to all published posts
                </p>
                {loadingCategories ? (
                  <div className="flex items-center gap-2">
                    <LoaderSpinner />
                    <span className="text-sm text-gray-500">Loading tags...</span>
                  </div>
                ) : tags.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                          />
                          <Label
                            htmlFor={`tag-${tag.id}`}
                            className="cursor-pointer flex-1"
                          >
                            {tag.name} ({tag.count} posts)
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No tags available. Test connection first.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
