export const parseJsonWithRegexStructure = (text: string) => {
    const regex =
        /"title_for_goal":\s*"([^"]+)",\s*"milestones":\s*\[\s*{ "title": "([^"]+)", "description": "([^"]+)" },\s*{ "title": "([^"]+)", "description": "([^"]+)" },\s*{ "title": "([^"]+)", "description": "([^"]+)" },\s*{ "title": "([^"]+)", "description": "([^"]+)" },\s*{ "title": "([^"]+)", "description": "([^"]+)" }\s*\]/;
    const match = regex.exec(text);
    if (match) {
        return {
            title_for_goal: match[1],
            milestones: [
                { title: match[2], description: match[3] },
                { title: match[4], description: match[5] },
                { title: match[6], description: match[7] },
                { title: match[8], description: match[9] },
                { title: match[10], description: match[11] },
            ],
        };
    } else {
        return { error: 'Failed to parse JSON with regex.' };
    }
};
