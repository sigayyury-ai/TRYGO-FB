export const toAvailableToAdd = (total: number, used: number) => {
    const availableToAdd = total - used;
    return availableToAdd > 0 ? availableToAdd : 0;
};
