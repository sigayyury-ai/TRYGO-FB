import { FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Magnet,
  MessageSquare,
  Tag,
  Star,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Lightbulb,
  Shield,
  Info,
  Pencil,
  Lock,
} from "lucide-react";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompetitorDetails from "@/components/market-research/CompetitorDetails";
import AIAssistantChat from "@/components/AIAssistantChat";
import { Textarea } from "@/components/ui/textarea";
import EditableText from "@/components/EditableText";
import { useHypothesesMarketResearchStore } from "@/store/useHypothesesMarketResearchStore";
import LoaderSpinner from "@/components/LoaderSpinner";
import {
  ChangeHypothesesMarketResearchInput,
  CompetitorDto,
  CompetitorSocialMediaDto,
} from "@/api/hypothesesMarketResearch";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";

const Research: FC = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  const { activeProject } = useProjects();
  const { activeHypothesis, loading: hypothesesLoading } = useHypotheses({ projectId: activeProject?.id });

  const {
    researchData,
    loading: researchLoading,
    error: researchError,
    getResearchData,
    changeResearchData,
  } = useHypothesesMarketResearchStore();

  // useEffect(() => {
  //   if (activeHypothesis?.id) {
  //     getResearchData(activeHypothesis.id);
  //   }
  // }, [activeHypothesis?.id, getResearchData]);

  const [leadMagnets, setLeadMagnets] = useState<
    { competitor: string; magnet: string }[]
  >([]);
  const [competitorsCTA, setCompetitorsCTA] = useState<
    { competitor: string; cta: string }[]
  >([]);
  const [competitorsOffers, setCompetitorsOffers] = useState<
    { competitor: string; offer: string }[]
  >([]);
  const [positiveReviews, setPositiveReviews] = useState<
    { competitor: string; review: string }[]
  >([]);
  const [negativeReviews, setNegativeReviews] = useState<
    { competitor: string; review: string }[]
  >([]);
  const [reviewSummary, setReviewSummary] = useState<string>("");

  // useEffect(() => {
  //   if (researchData) {
  //     setLeadMagnets(
  //       researchData?.leadMagnets?.map((lm) => ({
  //         competitor: lm.byCompetitor,
  //         magnet: lm.name,
  //       })) ?? []
  //     );

  //     setCompetitorsCTA(
  //       researchData.ctas.map((cta) => ({
  //         competitor: cta.byCompetitor,
  //         cta: cta.name,
  //       }))
  //     );

  //     setCompetitorsOffers(
  //       researchData.offers.map((offer) => ({
  //         competitor: offer.byCompetitor,
  //         offer: offer.name,
  //       }))
  //     );

  //     setPositiveReviews(
  //       researchData.positiveReviews.map((pr) => ({
  //         competitor: pr.byCompetitor,
  //         review: pr.name,
  //       }))
  //     );

  //     setNegativeReviews(
  //       researchData.negativeReviews.map((nr) => ({
  //         competitor: nr.byCompetitor,
  //         review: nr.name,
  //       }))
  //     );

  //     setReviewSummary(researchData.reviewsSummary || "");
  //   }
  // }, [researchData]);

  if (researchLoading || hypothesesLoading) {
    return (
      <div className="min-h-screen bg-research-gradient bg-grid-pattern">
        <div className="flex justify-center items-center h-screen">
          <LoaderSpinner />
        </div>
      </div>
    );
  }

  // if (researchError) {
  //   return (
  //     <div className="min-h-screen bg-research-gradient bg-grid-pattern">
  //       <Header />
  //       <div className="text-center py-20">
  //         <h2 className="text-2xl font-bold text-red-600 mb-4">
  //           Ошибка загрузки данных
  //         </h2>
  //         <p className="text-gray-700">{researchError}</p>
  //         <Button
  //           className="mt-4"
  //           onClick={() =>
  //             activeHypothesis?.id && getResearchData(activeHypothesis.id)
  //           }
  //         >
  //           Попробовать снова
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  const transformCompetitorData = (competitor: CompetitorDto) => {
    return {
      id: competitor.name,
      name: competitor.name,
      url: competitor.url,
      channels: competitor.distributionChannels,
      socialLinks: competitor.socialMedias.map(
        (sm: CompetitorSocialMediaDto) => ({
          platform: sm.name,
          url: sm.url,
        })
      ),
      description: competitor.description,
      pricing: competitor.pricing,
      slogans: competitor.advertisingSlogans,
      leadMagnets: competitor.leadMagnets,
      reviews: {
        positive: competitor.positiveReviews,
        negative: competitor.negativeReviews,
      },
    };
  };

  const competitorsData =
    researchData?.competitors?.map(transformCompetitorData) || [];

  const swotData = researchData?.swotAnalyse || {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  const handleSave = async () => {
    if (!researchData?.id) {
      return;
    }

    const input: ChangeHypothesesMarketResearchInput = {
      id: researchData.id,
      leadMagnets: leadMagnets.map((lm) => ({
        byCompetitor: lm.competitor,
        name: lm.magnet,
      })),
      ctas: competitorsCTA.map((cta) => ({
        byCompetitor: cta.competitor,
        name: cta.cta,
      })),
      offers: competitorsOffers.map((offer) => ({
        byCompetitor: offer.competitor,
        name: offer.offer,
      })),
      positiveReviews: positiveReviews.map((pr) => ({
        byCompetitor: pr.competitor,
        name: pr.review,
      })),
      negativeReviews: negativeReviews.map((nr) => ({
        byCompetitor: nr.competitor,
        name: nr.review,
      })),
      reviewsSummary: reviewSummary,
      competitors: researchData?.competitors ?? [],
      swotAnalyse: researchData?.swotAnalyse || {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },
    };

    try {
      await changeResearchData(input);
    } catch (error) {
      // Silent error handling
    }
  };

  return (
    <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>

          <p className="text-blue-700 text-lg max-w-xl mx-auto">
            We are planning to add a Research page in Q3 2025
          </p>

          <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
            Our AI analyzes your competitors, collects review insights, and
            uncovers your unique advantages - so you know exactly where to
            focus.
          </p>
        </div>
      </div>

      {/* {selectedCompetitor ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CompetitorDetails
            competitor={
              competitorsData.find((c) => c.id === selectedCompetitor)!
            }
            onBack={() => setSelectedCompetitor(null)}
          />
        </motion.div>
      ) : ( */}
      {/* <main className="px-4 py-8 pt-24 w-full">
          <div className="max-w-[2000px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <motion.h1
                className="text-4xl font-bold text-blue-900"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Market Research
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
            )} */}

      {/* <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            > */}
      {/* Competitors Section */}
      {/* <motion.div variants={cardVariants}>
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        Competitors
                      </div>
                    </CardTitle>
                    <Badge className="bg-blue-600">
                      {competitorsData.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="mt-4">
                    <ul className="space-y-2">
                      {competitorsData.map((competitor) => (
                        <motion.li
                          key={competitor.id}
                          className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 cursor-pointer border border-blue-100"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-blue-900">
                              {competitor.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() =>
                                setSelectedCompetitor(competitor.id)
                              }
                            >
                              View
                            </Button>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div> */}

      {/* Lead Magnets Section */}
      {/* <motion.div variants={cardVariants}>
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      <div className="flex items-center">
                        <Magnet className="h-5 w-5 mr-2 text-blue-600" />
                        Lead Magnets
                      </div>
                    </CardTitle>
                    <Badge className="bg-blue-600">{leadMagnets.length}</Badge>
                  </CardHeader>
                  <CardContent className="mt-4">
                    <ul className="space-y-2">
                      {leadMagnets.map((item, idx) => (
                        <motion.li
                          key={idx}
                          className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 border border-blue-100"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="font-medium text-blue-900">
                            <EditableText
                              initialText={item.magnet}
                              onTextChange={(newText) => {
                                const updatedMagnets = [...leadMagnets];
                                updatedMagnets[idx].magnet = newText;
                                setLeadMagnets(updatedMagnets);
                                handleSave();
                              }}
                            />
                          </div>
                          <div className="text-sm text-blue-600">
                            by {item.competitor}
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div> */}

      {/* CTAs Section */}
      {/* <motion.div variants={cardVariants}>
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                        CTAs
                      </div>
                    </CardTitle>
                    <Badge className="bg-blue-600">
                      {competitorsCTA.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="mt-4">
                    <ul className="space-y-2">
                      {competitorsCTA.map((item, idx) => (
                        <motion.li
                          key={idx}
                          className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 border border-blue-100"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="text-sm text-blue-600">
                            by {item.competitor}
                          </div>
                          <div className="font-medium italic text-blue-900">
                            <EditableText
                              initialText={item.cta}
                              onTextChange={(newText) => {
                                const updatedCTAs = [...competitorsCTA];
                                updatedCTAs[idx].cta = newText;
                                setCompetitorsCTA(updatedCTAs);
                                handleSave();
                              }}
                            />
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div> */}

      {/* Offers Section */}
      {/* <motion.div variants={cardVariants}>
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-blue-600" />
                        Offers
                      </div>
                    </CardTitle>
                    <Badge className="bg-blue-600">
                      {competitorsOffers.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="mt-4">
                    <ul className="space-y-2">
                      {competitorsOffers.map((item, idx) => (
                        <motion.li
                          key={idx}
                          className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 border border-blue-100"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="text-sm text-blue-600">
                            by {item.competitor}
                          </div>
                          <div className="font-medium text-blue-900">
                            <EditableText
                              initialText={item.offer}
                              onTextChange={(newText) => {
                                const updatedOffers = [...competitorsOffers];
                                updatedOffers[idx].offer = newText;
                                setCompetitorsOffers(updatedOffers);
                                handleSave();
                              }}
                            />
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div> */}

      {/* Reviews Section */}
      {/* <motion.div variants={cardVariants}>
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 mr-2 text-blue-600" />
                        Reviews
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-4">
                    <Tabs defaultValue="positive">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger
                          value="positive"
                          className="flex items-center"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Positive
                        </TabsTrigger>
                        <TabsTrigger
                          value="negative"
                          className="flex items-center"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Negative
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="positive">
                        <ul className="space-y-2">
                          {positiveReviews.map((item, idx) => (
                            <motion.li
                              key={idx}
                              className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 border border-blue-100"
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <div className="text-sm text-blue-600">
                                by {item.competitor} customer
                              </div>
                              <div className="font-medium text-blue-900">
                                <EditableText
                                  initialText={item.review}
                                  onTextChange={(newText) => {
                                    const updatedReviews = [...positiveReviews];
                                    updatedReviews[idx].review = newText;
                                    setPositiveReviews(updatedReviews);
                                    handleSave();
                                  }}
                                />
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="negative">
                        <ul className="space-y-2">
                          {negativeReviews.map((item, idx) => (
                            <motion.li
                              key={idx}
                              className="p-3 bg-white rounded-md shadow-sm hover:bg-blue-50 border border-blue-100"
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <div className="text-sm text-blue-600">
                                by {item.competitor} customer
                              </div>
                              <div className="font-medium text-blue-900">
                                <EditableText
                                  initialText={item.review}
                                  onTextChange={(newText) => {
                                    const updatedReviews = [...negativeReviews];
                                    updatedReviews[idx].review = newText;
                                    setNegativeReviews(updatedReviews);
                                    handleSave();
                                  }}
                                />
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div> */}

      {/* Review Summary */}
      {/* <motion.div variants={cardVariants}>
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      <div className="flex items-center">
                        <Info className="h-5 w-5 mr-2 text-blue-600" />
                        Reviews Summary
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-4">
                    <div className="p-4 bg-white rounded-lg border border-blue-100">
                      <div className="text-blue-900"> */}
      {/* <EditableText
                          initialText={reviewSummary}
                          onTextChange={(newText) => {
                            setReviewSummary(newText);
                            handleSave();
                          }}
                        /> */}

      {/* <EditableText
                          initialText={
                            reviewSummary || researchData?.reviewsSummary || ""
                          }
                          onTextChange={(newText) => {
                            setReviewSummary(newText);
                            handleSave();
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div> */}

      {/* SWOT Section */}
      {/* <motion.div
                className="md:col-span-2 lg:col-span-3"
                variants={cardVariants}
              >
                <Card className="shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300">
                  <CardHeader className="pb-2 bg-blue-50 rounded-t-lg border-b border-blue-100">
                    <CardTitle className="text-xl font-bold text-blue-900">
                      SWOT Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
      {/* Strengths */}
      {/* <Card className="shadow-sm">
                        <CardHeader className="bg-green-50 py-2 rounded-t-lg">
                          <CardTitle className="text-md font-medium flex items-center">
                            <Star className="h-4 w-4 mr-2 text-green-600" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 pt-2">
                            {swotData.strengths?.map((item, idx) => (
                              <motion.li
                                key={idx}
                                className="text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                              >
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card> */}

      {/* Weaknesses */}
      {/* <Card className="shadow-sm">
                        <CardHeader className="bg-red-50 py-2 rounded-t-lg">
                          <CardTitle className="text-md font-medium flex items-center">
                            <X className="h-4 w-4 mr-2 text-red-600" />
                            Weaknesses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 pt-2">
                            {swotData.weaknesses?.map((item, idx) => (
                              <motion.li
                                key={idx}
                                className="text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                              >
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card> */}

      {/* Opportunities */}
      {/* <Card className="shadow-sm">
                        <CardHeader className="bg-blue-50 py-2 rounded-t-lg">
                          <CardTitle className="text-md font-medium flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
                            Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 pt-2">
                            {swotData.opportunities?.map((item, idx) => (
                              <motion.li
                                key={idx}
                                className="text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                              >
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card> */}

      {/* Threats */}
      {/* <Card className="shadow-sm">
                        <CardHeader className="bg-orange-50 py-2 rounded-t-lg">
                          <CardTitle className="text-md font-medium flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-orange-600" />
                            Threats
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 pt-2">
                            {swotData.threats?.map((item, idx) => (
                              <motion.li
                                key={idx}
                                className="text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                              >
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card> */}
      {/* </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </main>
      )} */}

      {/* AI Assistant Chat */}
      {/* <AIAssistantChat /> */}
    </div>
  );
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default Research;
