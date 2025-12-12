import userQueryResolver from './users/userQueryResolver';
import userMutationResolver from './users/userMutationResolver';
import subscriptionQueryResolver from './subscription/subscriptionQueryResolver';
import subscriptionMutationResolver from './subscription/subscriptionMutationResolver';
import projectsQueryResolver from './projects/projectsQueryResolver';
import projectsMutationResolver from './projects/projectsMutationResolver';
import projectHypothesesQueryResolver from './projectHypotheses/projectHypothesesResolver';
import projectHypothesesMutationResolver from './projectHypotheses/projectHypothesesMutationResolver';
import hypothesesCoreQueryResolver from './hypothesesCore/hypothesesCoreQueryResolver';
import hypothesesCoreMutationResolver from './hypothesesCore/hypothesesCoreMutationResolver';
import hypothesesMarketResearchQueryResolver from './hypothesesMarketResearch/hypothesesMarketResearchQueryResolver';
import hypothesesMarketResearchMutationResolver from './hypothesesMarketResearch/hypothesesMarketResearchMutationResolver';
import hypothesesPersonProfileQueryResolver from './hypothesesPersonProfile/hypothesesPersonProfileQueryResolver';
import hypothesesPersonProfileMutationResolver from './hypothesesPersonProfile/hypothesesPersonProfileMutationResolver';
import hypothesesValidationQueryResolver from './hypothesesValidation/hypothesesValidationQueryResolver';
import hypothesesValidationMutationResolver from './hypothesesValidation/hypothesesValidationMutationResolver';
import hypothesesPackingQueryResolver from './hypothesesPacking/hypothesesPackingQueryResolver';
import hypothesesPackingMutationResolver from './hypothesesPacking/hypothesesPackingMutationResolver';
import hypothesesGtmQueryResolver from './hypothesesGtm/hypothesesGtmQueryResolver';
import hypothesesGtmMutationResolver from './hypothesesGtm/hypothesesGtmMutationResolver';
import hypothesesGtmDetailedChannelQueryResolver from './hypothesesGtmDetailedChannel/hypothesesGtmQueryResolver';
import hypothesesGtmDetailedChannelMutationResolver from './hypothesesGtmDetailedChannel/hypothesesGtmDetailedChannelMutationResolver';
import projectAssistantQueryResolver from './projectAssistant/projectAssistantQueryResolver';
import projectAssistantMutationResolver from './projectAssistant/projectAssistantMutationResolver';
import assistantMessagesQueryResolver from './assistantMessages/assistantMessagesQueryResolver';
import requestFeatureMutationResolver from './requestFeature/requestFeatureMutationResolver';
import seoAgentQueryResolver from './seoAgent/seoAgentQueryResolver';
import seoAgentMutationResolver from './seoAgent/seoAgentMutationResolver';
import promoCodeQueryResolver from './promoCode/promoCodeQueryResolver';
import promoCodeMutationResolver from './promoCode/promoCodeMutationResolver';
import embeddedOnboardingMutationResolver from './embeddedOnboarding/embeddedOnboardingMutationResolver';

export const resolversArray = {
    Query: {
        ...userQueryResolver.Query,
        ...subscriptionQueryResolver.Query,
        ...promoCodeQueryResolver.Query,
        ...projectsQueryResolver.Query,
        ...projectHypothesesQueryResolver.Query,
        ...hypothesesCoreQueryResolver.Query,
        ...hypothesesMarketResearchQueryResolver.Query,
        ...hypothesesPersonProfileQueryResolver.Query,
        ...hypothesesValidationQueryResolver.Query,
        ...hypothesesPackingQueryResolver.Query,
        ...hypothesesGtmQueryResolver.Query,
        ...hypothesesGtmDetailedChannelQueryResolver.Query,
        ...projectAssistantQueryResolver.Query,
        ...assistantMessagesQueryResolver.Query,
        ...seoAgentQueryResolver.Query,
    },
    Mutation: {
        ...userMutationResolver.Mutation,
        ...subscriptionMutationResolver.Mutation,
        ...promoCodeMutationResolver.Mutation,
        ...projectsMutationResolver.Mutation,
        ...projectHypothesesMutationResolver.Mutation,
        ...hypothesesCoreMutationResolver.Mutation,
        ...hypothesesMarketResearchMutationResolver.Mutation,
        ...hypothesesPersonProfileMutationResolver.Mutation,
        ...hypothesesValidationMutationResolver.Mutation,
        ...hypothesesPackingMutationResolver.Mutation,
        ...hypothesesGtmMutationResolver.Mutation,
        ...hypothesesGtmDetailedChannelMutationResolver.Mutation,
        ...projectAssistantMutationResolver.Mutation,
        ...requestFeatureMutationResolver.Mutation,
        ...seoAgentMutationResolver.Mutation,
        ...embeddedOnboardingMutationResolver.Mutation,
    },
};
