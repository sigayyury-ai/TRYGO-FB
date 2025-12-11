import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User,
  Info,
  Briefcase,
  Calendar,
  School,
  Tag,
  Check,
  X,
  Plus,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditableText from "@/components/EditableText";
import Header from "@/components/Header";
import AIAssistantChat from "@/components/AIAssistantChat";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";
import { ChangeHypothesesPersonProfileInput } from "@/api/hypothesesPersonProfile";
import LoaderSpinner from "@/components/LoaderSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useToast } from "@/hooks/use-toast";
import CjmTable from "@/components/CjmTable";
import JtbdBlock from "@/components/JtbdBlock";
import { itemVariants } from "@/utils/itemVariants";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";
import { useActiveCustomerSegmentId } from "@/hooks/useActiveIds";
import useSubscription from "@/hooks/use-subscription";
import FeatureUpgradeBlock from "@/components/FeatureUpgradeBlock";

const Person = () => {
  const { hasFeatureAccess } = useSubscription();
  const hasIcpAccess = hasFeatureAccess("icp");

  const { activeProject } = useProjects();
  const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });

  const coreData = useHypothesesCoreStore((state) => state.coreData);
  const coreLoading = useHypothesesCoreStore((state) => state.loading);
  const getHypothesesCore = useHypothesesCoreStore((state) => state.getHypothesesCore);
  
  const allProfiles = useHypothesesPersonProfileStore(
    (state) => state.allProfiles
  );
  const profile = useHypothesesPersonProfileStore((state) => state.profile);
  const wasAutoRefreshed = useHypothesesPersonProfileStore(
    (state) => state.wasAutoRefreshed
  );

  const {
    loading: profileLoading,
    error: profileError,
    fetchProfile,
    updateProfile,
  } = useHypothesesPersonProfileStore();

  const segments = coreData?.customerSegments || [];

  const { toast } = useToast();

  const setSelectedCustomerSegmentId = useHypothesesPersonProfileStore(
    (state) => state.setSelectedCustomerSegmentId
  );
  
  // Используем хук для реактивного чтения selectedSegmentId из куки
  const selectedSegmentId = useActiveCustomerSegmentId();

  const availableSegments = (() => {
    if (!allProfiles || allProfiles.length === 0 || !segments || segments.length === 0) return [];
    return segments.filter((segment) =>
      allProfiles.some((profile) => profile.customerSegmentId === segment.id)
    );
  })();

  // Завантажуємо coreData кожного разу
  useEffect(() => {
    if (activeHypothesis?.id) {
      getHypothesesCore(activeHypothesis.id);
    }
  }, [activeHypothesis?.id, getHypothesesCore]);

  // Завантажуємо профілі при изменении гипотезы
  useEffect(() => {
    if (activeHypothesis?.id) {
      // fetchProfile сам сбросит selectedSegmentId и загрузит данные для новой гипотезы
      fetchProfile(activeHypothesis.id);
    } else {
      // Сбрасываем всё при отсутствии гипотезы
      setSelectedCustomerSegmentId(null);
      useHypothesesPersonProfileStore.setState({ 
        profile: null,
        allProfiles: null,
      });
    }
  }, [activeHypothesis?.id, fetchProfile, setSelectedCustomerSegmentId]);

  useEffect(() => {
    // Синхронизируем profile с selectedSegmentId из куки
    if (selectedSegmentId && allProfiles && allProfiles.length > 0) {
      const matchedProfile = allProfiles.find(
        (profile) => profile.customerSegmentId === selectedSegmentId
      );
      if (matchedProfile && (!profile || profile.id !== matchedProfile.id)) {
        // Обновляем profile только если он изменился
        useHypothesesPersonProfileStore.setState({
          profile: matchedProfile,
        });
      } else if (!matchedProfile) {
        // Если профиль для выбранного сегмента не найден, сбрасываем выбор и выбираем первый
        if (allProfiles[0]?.customerSegmentId) {
          setSelectedCustomerSegmentId(allProfiles[0].customerSegmentId);
        }
        useHypothesesPersonProfileStore.setState({
          profile: allProfiles[0] || null,
        });
      }
    } else if (!selectedSegmentId && allProfiles && allProfiles.length > 0 && !profile) {
      // Если нет выбранного сегмента, но есть профили, выбираем первый
      if (allProfiles[0]?.customerSegmentId) {
        setSelectedCustomerSegmentId(allProfiles[0].customerSegmentId);
      }
      useHypothesesPersonProfileStore.setState({
        profile: allProfiles[0],
      });
    }
  }, [selectedSegmentId, allProfiles, profile, setSelectedCustomerSegmentId]);

  useEffect(() => {
    if (wasAutoRefreshed) {
      toast({
        title: "Changes saved",
        description: "Your ICP has been updated successfully",
      });
      useHypothesesPersonProfileStore.setState({ wasAutoRefreshed: false });
    }
  }, [wasAutoRefreshed]);

  const handleSelectedSegmentIdChoose = (segmentId: string) => {
    const matchedProfile = allProfiles?.find(
      (profile) => profile.customerSegmentId === segmentId
    );

    if (!matchedProfile) {
      toast({
        title: "Error",
        description: "ICP profile not found",
        variant: "destructive",
      });
      return;
    }

    // Сохраняем в куки и обновляем состояние
    setSelectedCustomerSegmentId(segmentId);
    useHypothesesPersonProfileStore.setState({
      profile: matchedProfile,
    });
  };

  useEffect(() => {
    if (profileError) {
      toast({
        title: "Error loading ICP data",
        description: profileError || "Something went wrong while loading ICP profile data",
        variant: "destructive",
      });
    }
  }, [profileError, toast]);

  const handleTextUpdate =
    (field: keyof ChangeHypothesesPersonProfileInput) => (value: string) => {
      if (!profile) return;

      updateProfile({
        id: profile.id,
        [field]: value,
      });
    };

  const handleArrayUpdate =
    (field: keyof ChangeHypothesesPersonProfileInput) => async (items: string[]) => {
      if (!profile) return;

      try {
        await updateProfile({
          id: profile.id,
          [field]: items,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to update profile on server";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

  const deleteItem = (
    items: string[],
    setItems: (items: string[]) => void,
    index: number
  ) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  interface StickerRowProps {
    title: string;
    icon: React.ReactNode;
    items: string[];
    color: string;
    onItemsChange: (items: string[]) => void;
  }

  const StickerRow = ({
    title,
    icon,
    items,
    color,
    onItemsChange,
  }: StickerRowProps) => {
    return (
      // <motion.div
      //   className="mb-8"
      //   variants={containerVariants}
      //   initial="hidden"
      //   whileInView="visible"
      //   viewport={{ once: true, margin: "-100px" }}
      //   animate="visible"
      // >
      <div className="mb-8">
        <motion.div
          className="flex items-center gap-2 mb-4"
          variants={itemVariants}
        >
          {icon}
          <h2 className="text-2xl font-bold text-blue-900">{title}</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, index) => {
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className={`${color} hover:shadow-lg hover:shadow-blue-100/50 transition-all relative group`}
                >
                  <CardContent className="p-4">
                    <EditableText
                      initialText={item}
                      onTextChange={(text) => {
                        const newItems = [...items];
                        newItems[index] = text;
                        onItemsChange(newItems);
                      }}
                    />
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newItems = [...items];
                        newItems.splice(index, 1);
                        onItemsChange(newItems);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          <motion.div variants={itemVariants}>
            <Card
              className="border-dashed border-2 hover:border-blue-400 transition-all flex items-center justify-center cursor-pointer h-[100px]"
              onClick={() => onItemsChange([...items, "New Item"])}
            >
              <CardContent className="p-4 flex items-center justify-center">
                <Plus className="h-6 w-6 text-blue-400" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  };

  // Показуємо лоадер поки завантажуються дані
  if (profileLoading || coreLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
        <LoaderSpinner />
        <AIAssistantChat />
      </div>
    );
  }

  // Если нет активной гипотезы, показываем сообщение
  if (!activeHypothesis) {
    return (
      <div className="min-h-screen bg-person-gradient bg-grid-pattern">
        <div className="px-4 py-8 pt-24 w-full">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h1 className="text-2xl font-bold text-blue-900 mb-2">
                No Active Hypothesis
              </h1>
              <p className="text-blue-700">
                Please select a hypothesis from the header to view ICP data.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если нет данных Core (сегментов), показываем сообщение
  if (!coreLoading && (!coreData || !segments || segments.length === 0)) {
    return (
      <div className="min-h-screen bg-person-gradient bg-grid-pattern">
        <div className="px-4 py-8 pt-24 w-full">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h1 className="text-2xl font-bold text-blue-900 mb-2">
                Customer Segments Not Found
              </h1>
              <p className="text-blue-700 mb-4">
                Please check the Core page and ensure customer segments are generated for this hypothesis.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если нет ICP профилей, показываем сообщение
  if (!profileLoading && (!allProfiles || allProfiles.length === 0)) {
    return (
      <div className="min-h-screen bg-person-gradient bg-grid-pattern">
        <div className="px-4 py-8 pt-24 w-full">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h1 className="text-2xl font-bold text-blue-900 mb-2">
                ICP Data Not Found
              </h1>
              <p className="text-blue-700 mb-4">
                ICP (Ideal Customer Profile) data hasn't been generated yet for this hypothesis.
              </p>
              <p className="text-blue-600 text-sm">
                ICP data is typically generated when you create a project. If you see this message, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-person-gradient bg-grid-pattern">
      <div className="px-4 py-8 pt-24 w-full">
        <div className="max-w-[2000px] mx-auto">
          {/* First row: Personal Information */}
          {!selectedSegmentId || !profile ? (
            <div className="w-full max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-2 text-blue-500" />
                  <h1 className="text-2xl font-bold text-blue-900">
                    Choose Customer Segment
                  </h1>
                </div>
              </div>
              {availableSegments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-blue-700 mb-2">
                    No customer segments available.
                  </p>
                  <p className="text-blue-600 text-sm">
                    Please ensure that ICP profiles are linked to customer segments on the Core page.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {availableSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="border border-gray-200 rounded-lg p-4 relative bg-white hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectedSegmentIdChoose(segment.id)}
                    >
                      <h4 className="font-medium text-lg text-blue-600 mb-2 cursor-pointer p-1 rounded">
                        {segment.name}
                      </h4>
                      <p className="text-gray-700 cursor-pointer p-1 rounded">
                        {segment.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <motion.h1
                  className="text-4xl font-bold text-blue-900"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  ICP Profile
                </motion.h1>
              </div>
              {activeHypothesis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-8"
                >
                  <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <Info className="h-4 w-4 mr-2 text-blue-600" />
                        <h3 className="font-medium text-blue-800">
                          Active Hypothesis: {activeHypothesis.title}
                        </h3>
                      </div>
                      <p className="text-blue-700">
                        {activeHypothesis.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="mb-8 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-blue-900">
                          Personal Information
                        </CardTitle>
                        <CardDescription>
                          General details about this persona
                        </CardDescription>
                      </div>

                      <Select
                        value={selectedSegmentId}
                        onValueChange={(value) => setSelectedSegmentId(value)}
                      >
                        <SelectTrigger className="w-[200px] ml-4">
                          <SelectValue placeholder="Choose segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSegments.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Image, Name and Description */}
                      <div className="flex flex-col items-center gap-4 justify-between h-full">
                        <div className="flex-1 flex items-center justify-center text-center">
                          <h2 className="text-2xl font-bold text-blue-900">
                            <EditableText
                              initialText={profile.name}
                              onTextChange={handleTextUpdate("name")}
                            />
                          </h2>
                        </div>
                        <div className="text-center w-full bg-blue-50 p-4 rounded-lg">
                          <div className="mb-2 text-sm text-blue-600 font-medium">
                            Description
                          </div>
                          <EditableText
                            initialText={profile.description || ""}
                            onTextChange={handleTextUpdate("description")}
                          />
                        </div>
                      </div>

                      {/* Right Column: Other Personal Info */}
                      <div className="space-y-4 bg-white p-5 rounded-lg shadow-inner">
                        <div className="flex items-start gap-2">
                          <Briefcase className="h-5 w-5 mt-1 flex-shrink-0 text-blue-500" />
                          <div>
                            <p className="text-sm text-blue-600 mb-1 font-medium">
                              Platforms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {profile.platforms.map((platform, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700"
                                >
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 mt-1 flex-shrink-0 text-blue-500" />
                          <div>
                            <p className="text-sm text-blue-600 mb-1 font-medium">
                              Age
                            </p>
                            <EditableText
                              initialText={profile.age?.toString() || ""}
                              onTextChange={(value) => {
                                const age = parseInt(value, 10);
                                if (!isNaN(age)) {
                                  updateProfile({
                                    id: profile.id,
                                    age,
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <User className="h-5 w-5 mt-1 flex-shrink-0 text-blue-500" />
                          <div>
                            <p className="text-sm text-blue-600 mb-1 font-medium">
                              Location
                            </p>
                            <EditableText
                              initialText={profile.location || ""}
                              onTextChange={handleTextUpdate("location")}
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <School className="h-5 w-5 mt-1 flex-shrink-0 text-blue-500" />
                          <div>
                            <p className="text-sm text-blue-600 mb-1 font-medium">
                              Education
                            </p>
                            <EditableText
                              initialText={profile.education || ""}
                              onTextChange={handleTextUpdate("education")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Advanced ICP Features - Restricted for Free Trial */}
              {hasIcpAccess ? (
                <>
                  {/* Sticker rows */}
                  <StickerRow
                    title="User Goals"
                    icon={<Briefcase className="h-6 w-6 text-blue-500" />}
                    items={profile.userGoals}
                    color="bg-blue-50 border-blue-200"
                    onItemsChange={(items) =>
                      handleArrayUpdate("userGoals")(items)
                    }
                  />
                  <StickerRow
                    title="User Pains"
                    icon={<X className="h-6 w-6 text-red-500" />}
                    items={profile.userPains}
                    color="bg-red-50 border-red-200"
                    onItemsChange={(items) =>
                      handleArrayUpdate("userPains")(items)
                    }
                  />
                  <StickerRow
                    title="User Benefits"
                    icon={<Star className="h-6 w-6 text-blue-500" />}
                    items={profile.userGains}
                    color="bg-blue-50 border-blue-200"
                    onItemsChange={(items) =>
                      handleArrayUpdate("userGains")(items)
                    }
                  />
                  <StickerRow
                    title="User Triggers"
                    icon={<Check className="h-6 w-6 text-blue-500" />}
                    items={profile.userTriggers}
                    color="bg-blue-50 border-blue-200"
                    onItemsChange={(items) =>
                      handleArrayUpdate("userTriggers")(items)
                    }
                  />
                  <JtbdBlock profile={profile} />
                  <CjmTable profile={profile} />
                </>
              ) : (
                <FeatureUpgradeBlock
                  title="Advanced ICP Analysis"
                  description="Unlock detailed customer analysis including user goals, pains, benefits, triggers, JTBD framework, and customer journey mapping."
                  feature="advanced ICP features"
                  className="mt-6"
                >
                  {/* Preview content that will be blurred */}
                  <div className="space-y-6">
                    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">
                        User Goals & Pains Analysis
                      </span>
                    </div>
                    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">
                        Jobs-to-be-Done Framework
                      </span>
                    </div>
                    <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">
                        Customer Journey Mapping
                      </span>
                    </div>
                  </div>
                </FeatureUpgradeBlock>
              )}
            </>
          )}
        </div>
      </div>

      {/* AI Assistant Chat */}

      {selectedSegmentId && <AIAssistantChat />}
    </div>
  );
};

export default Person;
