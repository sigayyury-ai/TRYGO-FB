export const toSocketKey = (
    ownerUserId: string,
    friendUserId: string
): string => {
    return `${ownerUserId}_${friendUserId}`;
};
