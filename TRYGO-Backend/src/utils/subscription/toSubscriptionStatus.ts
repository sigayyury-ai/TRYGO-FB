export enum StripeStatus {
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    UNPAID = 'unpaid',
    CANCELED = 'canceled',
    INCOMPLETE = 'incomplete',
    INCOMPLETE_EXPIRED = 'incomplete_expired',
    TRIALING = 'trialing',
    OPEN = 'open',
    INACTIVE = 'inactive',
}

export const toSubscriptionStatus = (stripeStatus: StripeStatus) => {
    const statusMap = {
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        unpaid: 'UNPAID',
        canceled: 'CANCELED',
        incomplete: 'INCOMPLETE',
        incomplete_expired: 'INCOMPLETE_EXPIRED',
        trialing: 'TRIALING',
        open: 'OPEN',
        inactive: 'INACTIVE',
    };

    return statusMap[stripeStatus] || 'UNKNOWN_STATUS';
};
