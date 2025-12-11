import { SubscriptionType } from '../../generated/graphql';
import projectService from '../../services/ProjectService';
import subscriptionService from '../../services/subscription/SubscriptionService';

export const checkIfProjectGenerationAllowed = async (
    userId: string
): Promise<{ allowed: boolean; isError: boolean; errorMessage: string }> => {
    try {
        let projectsAllowed = false;

        const subscription = await subscriptionService.getSubscription(userId);
        const projects = await projectService.getProjects(userId);
        const numberOfProjects = projects.length;
        if (subscription?.type === SubscriptionType.Starter) {
            projectsAllowed = numberOfProjects < 1;
        } else if (subscription?.type === SubscriptionType.Pro) {
            projectsAllowed = numberOfProjects < 50;
        } else {
            projectsAllowed = numberOfProjects < 1;
        }

        if (!projectsAllowed) {
            return {
                allowed: false,
                isError: true,
                errorMessage:
                    'You have reached the maximum number of projects allowed for this subscription',
            };
        }

        return { allowed: projectsAllowed, isError: false, errorMessage: '' };
    } catch (error) {
        console.error(error);
        return {
            allowed: false,
            isError: true,
            errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
