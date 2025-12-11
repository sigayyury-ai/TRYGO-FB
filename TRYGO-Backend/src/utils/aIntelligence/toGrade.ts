export const toGrade = (grade?: number): string | number => {
    if (!grade) {
        return 0;
    }
    return grade < 12 ? grade : 'university';
};
