export const getBiggestDate = (
    lastLessonDate?: Date,
    offset: number = 1
): Date => {
    const dateFromLesson = lastLessonDate || new Date();

    dateFromLesson.setDate(dateFromLesson.getDate() + offset);

    const currentDate =
        dateFromLesson && dateFromLesson > new Date()
            ? dateFromLesson
            : new Date();

    return currentDate;
};
