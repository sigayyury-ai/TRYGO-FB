import { parseJsonWithRegexStructure } from '..';

export const hardParseJsonFromResponse = (content: string) => {
    console.log('parseJsonFromResponse -> content', content);
    const cleanContent = content.replace('```json\n', '```').replace('\n```', '');

    try {
        const jsonData = JSON.parse(cleanContent);
        return jsonData;
    } catch (err) {
        console.error(
            'Standard JSON parsing failed, attempting regex parsing.',
            err
        );
        return parseJsonWithRegexStructure(cleanContent);
    }
};
