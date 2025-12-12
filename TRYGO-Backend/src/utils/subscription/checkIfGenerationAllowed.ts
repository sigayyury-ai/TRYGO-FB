import { SubscriptionType, UserRole } from '../../generated/graphql';
import subscriptionService from '../../services/subscription/SubscriptionService';
import userService from '../../services/UserService';

export enum GenerationType {
    MARKET_RESEARCH = 'MARKET_RESEARCH',
    VALIDATION = 'VALIDATION',
    PACKING = 'PACKING',
}

export const checkIfGenerationAllowed = async (
    userId: string,
    generationType: GenerationType
) => {
    try {
        // Check if user is admin - admins have access to all generation types
        try {
            const user = await userService.getUserById(userId);
            if (user && user.role === UserRole.Admin) {
                console.log(`[checkIfGenerationAllowed] Admin user detected (${userId}) - allowing generation`);
                return true;
            }
        } catch (userError) {
            // If user not found, continue with subscription check
            console.warn(`[checkIfGenerationAllowed] Could not fetch user for admin check:`, userError);
        }

        let generationAllowed = false;
        const subscription = await subscriptionService.getSubscription(userId);

        switch (generationType) {
            case GenerationType.MARKET_RESEARCH:
            case GenerationType.VALIDATION:
                if (subscription?.type === SubscriptionType.Pro) {
                    generationAllowed = true;
                } else {
                    generationAllowed = false;
                }
                break;
            case GenerationType.PACKING:
                if (
                    subscription?.type === SubscriptionType.Starter ||
                    subscription?.type === SubscriptionType.Pro
                ) {
                    generationAllowed = true;
                } else {
                    generationAllowed = false;
                }
                break;
        }
        if (!generationAllowed) {
            throw new Error('Generation not allowed for this subscription');
        }

        return generationAllowed;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
