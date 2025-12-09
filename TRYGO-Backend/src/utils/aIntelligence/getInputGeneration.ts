// export function getInputGenerationSmart(prompt: string, max_tokens: number) {
//     return {
//         model: 'o1-preview',
//         max_completion_tokens: max_tokens,
//         messages: [
//             {
//                 role: 'system',
//                 content:
//                     "You are a system for generating materials for language tutors' lessons.",
//             },
//             {
//                 role: 'user',
//                 content: prompt,
//             },
//         ],
//         ...getBasicInput(prompt),
//     };
// }

export function getInputGenerationSmart(prompt: string, max_tokens: number) {
    return {
        model: 'gpt-4.1-mini',
        max_tokens,
        temperature: 0.4,
        // response_format: {
        //     type: 'json_object',
        // },
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        ...getBasicInput(prompt),
    };
}

export function getInputGenerationBasedOnSearch(prompt: string) {
    return {
        model: 'gpt-4o-search-preview',
        web_search_options: {},
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        max_tokens: 5000,
    };
}

export function getInputGenerationBasic(
    prompt: string,
    max_output_tokens: number
) {
    return {
        model: 'gpt-5',
        max_output_tokens,
        text: {
            format: {
                type: 'json_object',
            },
        },
        reasoning: {
            effort: 'low',
            summary: 'auto',
        },
        input: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        top_p: 1,
    };
}

function getBasicInput(prompt: string) {
    return {
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    };
}
