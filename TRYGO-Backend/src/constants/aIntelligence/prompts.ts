import { CustomerSegment } from '../../generated/graphql';
import { ICustomerSegment, IHypothesesCore } from '../../types/IHypothesesCore';
import { IHypothesesMarketResearch } from '../../types/IHypothesesMarketResearch';
import { IHypothesesPacking } from '../../types/IHypothesesPacking';
import { IHypothesesPersonProfile } from '../../types/IHypothesesPersonProfile';
import { IHypothesesValidation } from '../../types/IHypothesesValidation';
import { IProjectHypothesis } from '../../types/IProjectHypothesis';
import { promptSentences } from './promptSentences';
import {
    IHypothesesGtm,
    IHypothesesGtmChannel,
} from '../../types/IHypothesesGtm';
import { IHypothesesGtmDetailedChannel } from '../../types/IHypothesesGtmDetailedChannel';

export const prompts = {
    aggregateProjectAssistantInfo: (projectInfo: string) => {
        return `
        Create instructions for project assistant that will be used to assist user with marketing in project.
        Information about project: '${projectInfo}'
        Instructions must start with "You are a project assistant".
        Project title must be short and concise, it's name of the project.
        Return response in JSON format: {
            instructions: string,
            projectTitle: string
        }
        `;
    },

    createProjectHypotheses: (isFirstProject: boolean) => {
        return `
      Generate ${
          isFirstProject ? '3' : '5'
      } radically different and realistic business hypotheses based on project info that you know
      
      Each hypothesis must:
      - Address a specific problem or need this product could solve
      - Target a different audience segment or use case
      - Include a clear channel of acquisition or distribution
      - Be practical, realistic, and testable within 1–2 weeks
      
      Vary the following dimensions across hypotheses:
      - Target audience (job roles, demographics, mindset)
      - Acquisition channels (ads, partnerships, SEO, influencers)
      - Problem/need (emotional, social, professional)
      - Timing or context (relocation, burnout, sabbatical, career change)
      
      Hypothesis Format (either one is acceptable):
      1.
      {
        "title": "Hypothesis: COMOON for solo founders",
        "description": "Solo startup founders looking for focus and inspiration will book COMOON to escape distractions and work alongside like-minded peers. We'll reach them via Twitter and newsletters like Indie Hackers or TLDR."
      }
      
      2.
      We believe that [audience] will [take specific action] because [reason or problem], and we can reach them through [channel].
      
      Do not repeat scenarios. Avoid vague or generic statements. Output 5–7 strong, unique hypotheses.
        `;
    },

    createHypothesesCoreWithPersonProfiles: (
        projectHypothesis: IProjectHypothesis,
        promptPart?: string
    ) => {
        return `
        ${
            promptPart
                ? `
        ${promptPart}
        `
                : 'Create hypotheses core based on info that you know about project and hypothesis: '
        }
        title: '${projectHypothesis.title}', description: '${
            projectHypothesis.description
        }'
    `;
    },

    createPersonProfile: (
        projectHypothesis: IProjectHypothesis,
        customerSegment: CustomerSegment
    ) => {
        return `
        Create person profile based on info that you know about project, hypothesis: title: '${projectHypothesis.title}', description: '${projectHypothesis.description}' and customer segment: title: '${customerSegment.name}', description: '${customerSegment.description}'
    `;
    },

    createLeanCanvasMessage: (
        message: string,
        hypothesesCore: IHypothesesCore,
        wantToChangeInfo: boolean,
        projectHypothesis?: IProjectHypothesis,
        icpProfiles?: Array<{
            segmentName: string;
            segmentDescription: string;
            profile: IHypothesesPersonProfile;
        }>
    ) => {
        // Build context section
        let contextSection = '';
        
        if (projectHypothesis) {
            contextSection += `
            Project Hypothesis Context:
            - Title: ${projectHypothesis.title}
            - Description: ${projectHypothesis.description}
            `;
        }
        
        contextSection += `
            Lean Canvas Data:
            {
                problems: ${JSON.stringify(hypothesesCore.problems)},
                customerSegments: ${JSON.stringify(hypothesesCore.customerSegments)},
                uniqueProposition: ${JSON.stringify(hypothesesCore.uniqueProposition)},
                solutions: ${JSON.stringify(hypothesesCore.solutions)},
                keyMetrics: ${JSON.stringify(hypothesesCore.keyMetrics)},
                channels: ${JSON.stringify(hypothesesCore.channels)},
                costStructure: ${JSON.stringify(hypothesesCore.costStructure)},
                revenueStream: ${JSON.stringify(hypothesesCore.revenueStream)},
                unfairAdvantages: ${JSON.stringify(hypothesesCore.unfairAdvantages)},
            }
        `;
        
        if (icpProfiles && icpProfiles.length > 0) {
            contextSection += `
            
            Ideal Customer Profiles (ICP) for Customer Segments:
            ${icpProfiles.map(icp => `
            Customer Segment: ${icp.segmentName}
            Segment Description: ${icp.segmentDescription}
            ICP Profile: {
                name: ${JSON.stringify(icp.profile.name)},
                description: ${JSON.stringify(icp.profile.description)},
                platforms: ${JSON.stringify(icp.profile.platforms)},
                age: ${JSON.stringify(icp.profile.age)},
                location: ${JSON.stringify(icp.profile.location)},
                education: ${JSON.stringify(icp.profile.education)},
                userGoals: ${JSON.stringify(icp.profile.userGoals)},
                userPains: ${JSON.stringify(icp.profile.userPains)},
                userGains: ${JSON.stringify(icp.profile.userGains)},
                userTriggers: ${JSON.stringify(icp.profile.userTriggers)},
                jbtd: ${JSON.stringify(icp.profile.jbtd)},
                cjm: ${JSON.stringify(icp.profile.cjm)}
            }
            `).join('\n')}
            `;
        }
        
        return `
        You are an AI assistant helping with Lean Canvas business model development.
        Use the following context to provide accurate and relevant answers:
        ${contextSection}
        
        User message: '${message}'
        
        ${
            wantToChangeInfo
                ? `
            Change info in lean canvas based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
            Use the existing Lean Canvas data and ICP profiles above as context when making changes.
            `
                : `
            Provide a helpful answer based on the user's message, using the Lean Canvas data and ICP profiles as context.
            Reference specific elements from the Lean Canvas and ICP when relevant to the question.
            `
        }
        `;
    },

    createPersonProfileMessage: (
        message: string,
        customerSegment: ICustomerSegment,
        personProfile: IHypothesesPersonProfile,
        wantToChangeInfo: boolean
    ) => {
        return `
        Create reply based on message: '${message}'
        ${
            wantToChangeInfo
                ? `
            Change info in ICP for customer segment: ${
                customerSegment.name
            }, description: '${
                customerSegment.description
            }' based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
            Existing info:
            {
                name: ${JSON.stringify(personProfile.name)},
                description: ${JSON.stringify(personProfile.description)},
                platforms: ${JSON.stringify(personProfile.platforms)},
                age: ${JSON.stringify(personProfile.age)},
                location: ${JSON.stringify(personProfile.location)},
                education: ${JSON.stringify(personProfile.education)},
                userGoals: ${JSON.stringify(personProfile.userGoals)},
                userPains: ${JSON.stringify(personProfile.userPains)},
                userGains: ${JSON.stringify(personProfile.userGains)},
                userTriggers: ${JSON.stringify(personProfile.userTriggers)},
                jbtd: ${JSON.stringify(personProfile.jbtd)},
                cjm: ${JSON.stringify(personProfile.cjm)}
            }
        `
                : ''
        }
        `;
    },

    createHypothesesMarketResearch: (
        projectHypothesis: IProjectHypothesis,
        promptPart?: string
    ) => {
        return `
            ${
                promptPart
                    ? `
            ${promptPart}
            `
                    : `
            You are an expert in competitive analysis and product packaging.
                
            Step 1. Find and analyze the top 5–7 competitors operating in a similar niche and with a similar business model. For each competitor, gather:
    
            Competitors – company name and website.  
            Competitors Lead Magnets – free offers to attract clients (e.g., free trial, checklist, webinar).  
            Competitors CTA – main calls-to-action (button texts, lead form copy).  
            Competitors Offers – main offers (core value proposition, pricing, unique features).  
            Negative Competitor Review Clients – recurring negative client reviews (at least 3–5).  
            Positive Reviews – recurring positive client reviews (at least 3–5).  
            Channels – promotion channels (SEO, social media, advertising, email, etc.).  
            Competitive Differentiation – how they stand out in the market.  
    
            Step 2. Perform a SWOT analysis based on comparison with our product:
    
            UVP — key unique value proposition.  
            Solutions — what solutions we provide, and how they are better/worse than competitors.  
            Unfair Advantages — unique advantages that competitors don’t have.  
    
            Identify:  
            Strengths – our strengths relative to competitors.  
            Weaknesses – our weaknesses relative to competitors.  
            Opportunities – market opportunities we can use, including:  
            • product improvements based on recurring competitor negative reviews;  
            • unmet audience needs;  
            • new trends or channels.  
            Threats – threats to our product.  
    
            Finally, form a Summary — that started with all analysis and then concise conclusion with key findings from the competitive analysis (5–7 sentences). 
            
            Response must be in human-readable format.
            `
            }

            Hypothesis input: title: '${
                projectHypothesis.title
            }', description: '${projectHypothesis.description}'  
        `;
    },

    createMarketResearchMessage: (
        message: string,
        hypothesesMarketResearch: IHypothesesMarketResearch,
        wantToChangeInfo: boolean
    ) => {
        return `
        Create reply based on message: '${message}'
        ${
            wantToChangeInfo
                ? `
            Change info in market research based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
            Existing info:
            {
                summary: ${JSON.stringify(hypothesesMarketResearch.summary)},
            }
        `
                : ''
        }
        `;
    },

    createHypothesesValidation: (
        projectHypothesis: IProjectHypothesis,
        promptPart?: string
    ) => {
        return `
            ${
                promptPart
                    ? `
            ${promptPart}
            `
                    : `
            You are an AI assistant for validating business hypotheses.
Your role is to help the founder run Customer Development: formulate interview questions, collect feedback from the target audience, and extract insights.     

Your tasks:
1 - Customer interview

1. Context & Personal Experience:
• Can you describe your role and typical tasks in your area?
• Can you recall a specific situation where you faced a particularly difficult challenge? What happened and how did you feel?
2. Problem Solving Process:
• How do you usually approach unexpected or new tasks?
• Which steps or stages are most challenging or most likely to be postponed?
• Was there a case that was very different from the rest? What was unique about it?
3. Stories & Alternative Approaches:
• What methods have you previously tried to solve this problem? Why did you choose them?
• Have you ever used unconventional or unexpected approaches? How did they work?
• How do personal habits, beliefs, or doubts influence your choices?
4. Emotions & Internal Barriers:
• What emotions do you usually experience when facing difficulties: anxiety, interest, irritation, fear?
• What helps or hinders you in making decisions and overcoming obstacles quickly?
• Have you ever felt like a problem was unsolvable? What made it feel that way?
5. Tools & Ideal Solution:
• What tools, services, or platforms do you use to solve professional challenges? What do you like or dislike about them?
• If you could have an 'ideal tool' or solution, what would it be able to do as if by magic?
Interview facilitation tips:

— Use open-ended questions for more detailed responses.
— Ask for concrete situations and examples.
— Pay attention to non-verbal cues when possible.
— Avoid interrupting and allow for pauses.
— Encourage honesty and explain why any answer is valuable.
— Be ready to rephrase questions if the conversation drifts.
— Finish with questions about dreams or wishes — this both relaxes the interviewee and generates innovative insights.


2. Finding Respondents (validationChannels):  
Recommend suitable channels for gathering feedback based on the ICP, such as:  
• Reddit, Facebook groups, Telegram chats, Product Hunt, Indie Hackers, niche forums  
• Subreddits (e.g., /r/freelance for freelancers)  
• Interview recruitment platforms (Respondent, Askable, LinkedIn)
            `
            } 


        Hypothesis info: 
        title: '${projectHypothesis.title}', description: '${
            projectHypothesis.description
        }'. 
        `;
    },

    createValidationInsightsCustomerInterviews: (customerInterview: string) => {
        return `
        You are an AI assistant analyzing customer interview answers.  
        When you receive textual answers from users (as a list or separate phrases), you must:  
        • Extract key pains, desires, and behavior patterns  
        • Highlight recurring themes  
        • Conclude: hypothesis confirmed / partially confirmed / not confirmed  
        • Suggest what to clarify in next interviews  
        • Create a comprehensive summary with goals, pains, hypotheses validation results, and recommended tone of voice

        Customer interview answers: "${customerInterview}"
        `;
    },

    createValidationMessage: (
        message: string,
        hypothesesValidation: IHypothesesValidation,
        wantToChangeInfo: boolean
    ) => {
        return `
        Create reply based on message: '${message}'
        ${
            wantToChangeInfo
                ? `
            Change info in hypotheses validation based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
            Existing info:
            {
                validationChannels: ${JSON.stringify(
                    hypothesesValidation.validationChannels
                )},
                customerInterviewQuestions: ${JSON.stringify(
                    hypothesesValidation.customerInterviewQuestions
                )},
                uploadedCustomerInterviews: ${JSON.stringify(
                    hypothesesValidation.uploadedCustomerInterviews
                )},
                insightsCustomerInterviews: ${JSON.stringify(
                    hypothesesValidation.insightsCustomerInterviews
                )},
                summaryInterview: ${JSON.stringify(
                    hypothesesValidation.summaryInterview
                )},
            }
        `
                : ''
        }
        `;
    },

    createHypothesesPacking: (
        projectHypothesis: IProjectHypothesis,
        promptPart?: string
    ) => {
        return `
            ${
                promptPart
                    ? `
            ${promptPart}
            `
                    : `
            Create landing page structure for product  based on the info that you know about project and hypothesis.  In texts use info from ICP: pains points, goals and triggers

The packing should be structured as follows:

0. SEO title and description  – clear product name and a short slogan.  
1 Hero section - H1 title and short descriptions and CTA buttons 
2. Key Benefits / Unique Features – list of main advantages and differentiators - with short description
3. First Experience (Onboarding) – what happens during the first interaction.  
4 .Mani paint points - which pain pains we are covering with product
5. Social Proof – testimonials, statistics, or success cases.  
6. List of triggers - when our product will be need 
7. CTA– elements of gamification that motivate users.  
8. Pricing / Plans – description of tariffs, trial, or payment logic.  
9. CTA – examples of marketing and in-app communication
10 Lead magnet - make lead magnet  free idea. 

Settings for development and design
Tone of Voice – communication style guidelines.  
Visual Style / Identity – description of how the product should look and feel.
            `
            }          
            Hypothesis input: title: '${
                projectHypothesis.title
            }', description: '${projectHypothesis.description}'  
        `;
    },

    createPackingMessage: (
        message: string,
        packing: IHypothesesPacking,
        wantToChangeInfo: boolean
    ) => {
        return `
        Create reply based on message: '${message}'
        ${
            wantToChangeInfo
                ? `
            Change info in packing based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
            Existing info:
            {
                summary: ${JSON.stringify(packing.summary)},
            }
        `
                : ''
        }
        `;
    },

    createHypothesesGtm: (
        projectHypothesis: IProjectHypothesis,
        promptPart?: string
    ) => {
        return `
            ${
                promptPart
                    ? `
            ${promptPart}
            `
                    : `
                    You are an expert in go to market strategy.  
                    Create Gtm based on the info that you know about project and hypothesis.
                    For each stage (stageValidate, stageBuildAudience, stageScale), create 3 channels.
                    `
            }
            Hypothesis input: title: '${
                projectHypothesis.title
            }', description: '${projectHypothesis.description}' 
        `;
    },

    createGtmMessage: (
        message: string,
        hypothesesGtm: IHypothesesGtm,
        wantToChangeInfo: boolean
    ) => {
        return `
            Create reply based on message: '${message}'
            ${
                wantToChangeInfo
                    ? `
                Change info in Gtm based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
                Existing info:
                {
                    stageValidate: ${JSON.stringify(
                        hypothesesGtm.stageValidate
                    )},
                    stageBuildAudience: ${JSON.stringify(
                        hypothesesGtm.stageBuildAudience
                    )},
                    stageScale: ${JSON.stringify(hypothesesGtm.stageScale)},
                }
            `
                    : ''
            }
            `;
    },

    createGtmDetailedChannelMessage: (
        message: string,
        hypothesesGtmDetailedChannel: IHypothesesGtmDetailedChannel,
        wantToChangeInfo: boolean
    ) => {
        return `
        Create reply based on message: '${message}'
        ${
            wantToChangeInfo
                ? `
                Change info in Gtm detailed channel based on user message. You must only change info that user asked you to change. If you didn't change something, just return it as is.
                Existing info:
                {
                    ${JSON.stringify(hypothesesGtmDetailedChannel)}
                }
            `
                : ''
        }
        `;
    },

    createHypothesesGtmDetailedChannel: (
        projectHypothesis: IProjectHypothesis,
        customerSegment: ICustomerSegment,
        channel: IHypothesesGtmChannel,
        promptPart?: string
    ) => {
        return `
        Create a detailed GTM action plan for the channel: name: '${
            channel.name
        }', type: '${channel.type}', based on:
Hypothesis: title: '${projectHypothesis.title}', description: '${
            projectHypothesis.description
        }'
ICP: name: '${customerSegment.name}', description: '${
            customerSegment.description
        }'
            ${
                promptPart
                    ? `
            ${promptPart}
            `
                    : `
Result Structure:

1. Preparation
   - What steps need to be taken before launch (profile setup, tool configuration, creative preparation, etc.).
   - List of required resources: website, CRM, landing page, scripts.

2. Step-by-Step Plan
   - Clear sequence of actions by days or weeks.
   - Specify the number of actions (e.g., “10 connections per day,” “3 posts per week”).

3. Success Metrics
   - What to track to validate the hypothesis.
   - Target values (e.g., Connection rate >30%, Reply rate >20%).

4. Tools
   - Specific services and solutions for launching and tracking the channel.
   - Break down by categories: search/segmentation, automation, content, analytics.

5. Resources
   - Human resources: who should be involved (founder, marketer, designer, SDR, contractor).
   - Financial resources: budgets by stages (e.g., $200 for paid ads testing, $50 for automation, 10 hours of work per week).

6. Content Library
   - Ready-made texts/templates for this channel (messages, posts, emails, offers).
   - At least 2–3 options for A/B testing.

7. Content Needed to Execute the Action Plan

Format the plan in a structured way so it can be used as a working instruction.
                    `
            }
        `;
    },

    generateContentIdea: (
        hypothesesGtmDetailedChannel: IHypothesesGtmDetailedChannel
    ) => {
        return `
        Generate content idea for hypotheses Gtm detailed channel.
        Info about hypotheses Gtm detailed channel: {
            channelStrategy: ${hypothesesGtmDetailedChannel.channelStrategy},
            channelPreparationTasks: ${hypothesesGtmDetailedChannel.channelPreparationTasks},
            existingContentIdeas: ${hypothesesGtmDetailedChannel.contentIdeas},
            tools: ${hypothesesGtmDetailedChannel.tools},
            resources: ${hypothesesGtmDetailedChannel.resources},
        }
        `;
    },
};
