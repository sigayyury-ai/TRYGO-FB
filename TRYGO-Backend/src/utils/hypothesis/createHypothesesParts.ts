import { Types } from 'mongoose';
import hypothesesMarketResearchService from '../../services/HypothesesMarketResearchService';
import { IProjectHypothesis } from '../../types/IProjectHypothesis';
import { sendErrorToTg } from '../sendErrorToTg';
import { createCorePart } from './createCorePart';

export const createHypothesesParts = async ({
    projectHypotheses,
    assistantId,
    userId,
}: {
    projectHypotheses: IProjectHypothesis[];
    assistantId: string;
    userId: string;
}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [createHypothesesParts] Starting for ${projectHypotheses.length} hypotheses, userId: ${userId}`);
    console.log(`[${timestamp}] [createHypothesesParts] Hypothesis IDs:`, projectHypotheses.map(h => h._id.toString()));

    try {
        if (!projectHypotheses || projectHypotheses.length === 0) {
            console.error(`[${timestamp}] [createHypothesesParts] ERROR: No hypotheses provided`);
            return { 
                isError: true, 
                errorMessage: 'No hypotheses provided to create parts for' 
            };
        }

        console.log(`[${timestamp}] [createHypothesesParts] Creating parts for each hypothesis...`);
        const results = await Promise.allSettled(
            projectHypotheses.map(async (projectHypothesis, index) => {
                const hypothesisTimestamp = new Date().toISOString();
                try {
                    console.log(`[${hypothesisTimestamp}] [createHypothesesParts] Creating parts for hypothesis ${index + 1}/${projectHypotheses.length}: ${projectHypothesis._id.toString()}`);
                    await createCorePart({
                        projectHypothesis,
                        assistantId,
                        userId,
                    });
                    console.log(`[${hypothesisTimestamp}] [createHypothesesParts] SUCCESS: Parts created for hypothesis ${projectHypothesis._id.toString()}`);
                } catch (hypothesisError) {
                    console.error(`[${hypothesisTimestamp}] [createHypothesesParts] ERROR: Failed to create parts for hypothesis ${projectHypothesis._id.toString()}`);
                    console.error(`[${hypothesisTimestamp}] [createHypothesesParts] Error:`, hypothesisError);
                    throw hypothesisError;
                }
            })
        );

        // Check for failures
        const failures = results.filter(result => result.status === 'rejected');
        if (failures.length > 0) {
            console.error(`[${timestamp}] [createHypothesesParts] ERROR: Failed to create parts for ${failures.length} out of ${projectHypotheses.length} hypotheses`);
            failures.forEach((failure, index) => {
                if (failure.status === 'rejected') {
                    console.error(`[${timestamp}] [createHypothesesParts] Failure ${index + 1}:`, failure.reason);
                }
            });
            const errorMessage = `Failed to create parts for ${failures.length} hypotheses`;
            sendErrorToTg(new Error(errorMessage));
            return { isError: true, errorMessage };
        }

        console.log(`[${timestamp}] [createHypothesesParts] SUCCESS: All parts created for ${projectHypotheses.length} hypotheses`);
        return { isError: false, errorMessage: '' };
    } catch (error) {
        const errorTimestamp = new Date().toISOString();
        console.error(`[${errorTimestamp}] [createHypothesesParts] FATAL ERROR: Failed to create hypotheses parts`);
        console.error(`[${errorTimestamp}] [createHypothesesParts] Error:`, error);
        console.error(`[${errorTimestamp}] [createHypothesesParts] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        console.error(`[${errorTimestamp}] [createHypothesesParts] Error details:`, {
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
            hypothesesCount: projectHypotheses.length,
            assistantId,
            userId,
        });
        sendErrorToTg(error as Error);
        return { 
            isError: true, 
            errorMessage: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
};
