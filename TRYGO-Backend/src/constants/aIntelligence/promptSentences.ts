export const promptSentences = {
    returnGeneratePlan: () =>
        'Return response as JSON in such format: {stages: {name: string, about: string, lessons: {name: string, about: string}[]}[]}',

    useUniqueNames: () => 'Use unique names without numbering them.',

    dontNumberThem: () => 'do not number content in response',

    dontLetterThem: () => 'do not letter them',

    exceptJson: () => 'Don’t return anything except JSON.',

    returnWebsiteInformation: () =>
        `Return response as JSON in such format: {name: string, description: string, category: string (one of the following: Marketing, Productivity, Data & Analytics, Development Tools, Content Creation, Communication, Finance, Education, Ecommerce, Healthcare, Entertainment, Social Media, Travel, Real Estate, Food & Beverage, Fitness & Wellness, Gaming, News & Media, Non-profit, or Other)}`,

    structureHypothesesCore: () => `
        problems: string[],
            customerSegments: {
                name: string,
                description: string,
                personProfile: {${promptSentences.structureHypothesesPersonProfile()}}
            }[],
            uniqueProposition: string,
            solutions: string[],
            keyMetrics: string[],
            channels: {
                channelType: "ORGANIC_SEARCH" | "PAID_SEARCH" | "ORGANIC_SOCIAL_MEDIA" | "PAID_SOCIAL_MEDIA" | "PARTNERS",
                variants: {
                    name: string,
                    url: string
                }[]
            }[],
            costStructure: string,
            revenueStream: string,
            unfairAdvantages: string[]
    `,

    structureHypothesesPersonProfile: () => `
        name: string, // 'John Doe'
        description: string,
        platforms: string[],
        age: number,
        location: string,
        education: string,
        userGoals: string[],
        userPains: string[],
        userGains: string[],
        userTriggers: string[],
        jbtd: {
            functionalAspects: string,
            personalDimension: string,
            socialDimension: string,
        },
        cjm: {
            awareness: CjmPart,
            consideration: CjmPart,
            acquisition: CjmPart,
            service: CjmPart,
            loyalty: CjmPart,
        } 
        // type CjmPart { opportunities: string, barriers: string }
    `,

    structureHypothesesMarketResearch: () => `
        summary: string,
    `,

    structureHypothesesValidation: (isSummaryInterviewNeed: boolean) => `
        validationChannels: string[],
        customerInterviewQuestions: string[],
        ${
            isSummaryInterviewNeed
                ? `summaryInterview: {
            goals: string[],
            pains: string[],
            hypotheses: string[],
            toneOfVoice: string
        }
    `
                : ''
        }`,

    structureHypothesesPacking: () => `
        summary: string,
    `,

    structureHypothesesGtm: () => `
    type Stage {
            name: string, // 'Validate', 'Build Audience', 'Scale'
            channels: {
                name: string,
                type: string, // 'ORGANIC_SEARCH', 'PAID_SEARCH', 'ORGANIC_SOCIAL_MEDIA', 'PAID_SOCIAL_MEDIA', 'PARTNERS'
                description: string,
                kpis: string, // Replies, Clicks, Leads, Customers, Revenue, etc.,
                status: string, // 'PLANNED', 'IN_PROGRESS', 'COMPLETED'
                strategy: string,
            }[]
    }

        stageValidate: Stage,
        stageBuildAudience: Stage,
        stageScale: Stage,
    `,

    structureHypothesesGtmDetailedChannel: () => `
    type TextIsCompleted {
        text: string,
        isCompleted: boolean,
    }

    type GtmChannelContentIdea{
        title: string,
        text: string,
    }

    type GtmChannelActionPlan{
        stageTitle: string,
        tasks: TextIsCompleted[],
        isCompleted: boolean,
    }

    type GtmChannelMetricsAndKpis{
        key: string,
        value: string,
    }
    
        channelStrategy: string,
        channelPreparationTasks: TextIsCompleted[],
        tools: string, // should be formatted as a single string with each paragraph separated by newline characters (\n)
        resources: string, // should be formatted as a single string with each paragraph separated by newline characters (\n)
        contentIdeas: GtmChannelContentIdea[],
        actionPlan: GtmChannelActionPlan[],
        metricsAndKpis: string[],
    `,
};
