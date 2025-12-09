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
    try {
        await Promise.all(
            projectHypotheses.map(async (projectHypothesis) => {
                await createCorePart({
                    projectHypothesis,
                    assistantId,
                    userId,
                });
            })
        );
        return { isError: false, errorMessage: '' };
    } catch (error) {
        console.error(error);
        sendErrorToTg(error as Error);
        return { isError: true, errorMessage: error instanceof Error ? error.message : 'Unknown error' };
    }
};
