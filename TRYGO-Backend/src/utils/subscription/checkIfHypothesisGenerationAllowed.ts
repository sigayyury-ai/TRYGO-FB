import { SubscriptionType } from '../../generated/graphql';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import subscriptionService from '../../services/subscription/SubscriptionService';

export const checkIfHypothesisGenerationAllowed = async (
    projectId: string,
    userId: string
) => {
    try {
        let hypothesesAllowed = false;

        const subscription = await subscriptionService.getSubscription(userId);
        const projectHypotheses =
            await projectHypothesesService.getProjectHypotheses(
                projectId,
                userId
            );
        const numberOfHypotheses = projectHypotheses.length;
        if (subscription?.type === SubscriptionType.Starter) {
            hypothesesAllowed = numberOfHypotheses < 5;
        } else if (subscription?.type === SubscriptionType.Pro) {
            hypothesesAllowed = numberOfHypotheses < 50;
        } else {
            hypothesesAllowed = numberOfHypotheses < 3;
        }

        if (!hypothesesAllowed) {
            throw new Error(
                'You have reached the maximum number of hypotheses allowed for this subscription'
            );
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};
