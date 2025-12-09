import {
    ChangeHypothesesGtmInput,
    ChangeHypothesesGtmDetailedChannelInput,
    CreateHypothesesGtmDetailedChannelInput,
    HypothesesGtm,
    GetHypothesesGtmDetailedChannelInput,
} from '../generated/graphql';
import HypothesesGtmDetailedChannelModel from '../models/HypothesesGtmDetailedChannelModel';
import { IHypothesesGtmDetailedChannel } from '../types/IHypothesesGtmDetailedChannel';
import { createGtmDetailedChannelPart } from '../utils/hypothesis/createGtmDetailedChannelPart';
import { preserveDetailedChannelIds } from '../utils/hypothesis/preserveDetailedChannelIds';

class HypothesesGtmDetailedChannelService {
    private model: typeof HypothesesGtmDetailedChannelModel = HypothesesGtmDetailedChannelModel;

    async createHypothesesGtmDetailedChannel(
        input: CreateHypothesesGtmDetailedChannelInput,
        userId: string
    ): Promise<IHypothesesGtmDetailedChannel> {
        try {
            const existingHypothesesGtmDetailedChannel =
                await this.getHypothesesGtmDetailedChannel(
                    input,
                    userId
                );
            if (existingHypothesesGtmDetailedChannel) {
                throw new Error('Hypotheses Gtm Detailed Channel    already exists');
            }

            return await createGtmDetailedChannelPart({
                ...input,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async initHypothesesGtmDetailedChannel(
        data: HypothesesGtm
    ): Promise<IHypothesesGtmDetailedChannel> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getHypothesesGtmDetailedChannel(
        input: GetHypothesesGtmDetailedChannelInput,
        userId: string
    ): Promise<IHypothesesGtmDetailedChannel | null> {
        try {
            return await this.model.findOne({
                customerSegmentId: input.customerSegmentId,
                hypothesesGtmChannelId: input.hypothesesGtmChannelId,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

        async getHypothesesGtmDetailedChannelWithCheck(
        input: GetHypothesesGtmDetailedChannelInput,
        userId: string
    ): Promise<IHypothesesGtmDetailedChannel> {
        try {
            const hypothesesGtmDetailedChannel =
                await this.getHypothesesGtmDetailedChannel(
                    input,
                    userId
                );
            if (!hypothesesGtmDetailedChannel) {
                throw new Error('Hypotheses Gtm Detailed Channel not found');
            }
            return hypothesesGtmDetailedChannel;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesGtmDetailedChannel(
        input: ChangeHypothesesGtmDetailedChannelInput,
        userId: string
    ): Promise<IHypothesesGtmDetailedChannel> {
        try {
            // First, get the existing document to preserve item IDs
            const existingHypothesesGtmDetailedChannel = await this.model.findOne({
                userId,
                _id: input.id,
            });
            
            if (!existingHypothesesGtmDetailedChannel) {
                throw new Error('Hypotheses Gtm Detailed Channel not found');
            }

            const dataForUpdate = preserveDetailedChannelIds(input, existingHypothesesGtmDetailedChannel);
            
            const hypothesesGtmDetailedChannel = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                dataForUpdate,
                {
                    new: true,
                }
            );
            
            return hypothesesGtmDetailedChannel!;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteHypothesesGtmDetailedChannel(customerSegmentId: string, userId: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ customerSegmentId, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesGtmDetailedChannelService = new HypothesesGtmDetailedChannelService();
export default hypothesesGtmDetailedChannelService;
