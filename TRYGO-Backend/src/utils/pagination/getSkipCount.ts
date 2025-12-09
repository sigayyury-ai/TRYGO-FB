export const getSkipCount = (step: number, limit: number): number => {
    return (step - 1) * limit;
};
