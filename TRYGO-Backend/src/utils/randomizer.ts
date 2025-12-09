export const arrayRandomizer = (array: any[]) => {
    return array
        .map((item) => ({ item, sortKey: Math.random() }))
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ item }) => item);
};
