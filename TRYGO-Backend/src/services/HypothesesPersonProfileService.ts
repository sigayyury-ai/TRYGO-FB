import {
    ChangeHypothesesPersonProfileInput,
    HypothesesPersonProfile,
} from '../generated/graphql';
import HypothesesPersonProfileModel from '../models/HypothesesPersonProfileModel';
import { IHypothesesPersonProfile } from '../types/IHypothesesPersonProfile';

class HypothesesPersonProfileService {
    private model: typeof HypothesesPersonProfileModel =
        HypothesesPersonProfileModel;

    async createHypothesesPersonProfile(
        data: HypothesesPersonProfile
    ): Promise<IHypothesesPersonProfile> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAllHypothesesPersonProfiles(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesPersonProfile[]> {
        try {
            console.log(`[HypothesesPersonProfileService] getAllHypothesesPersonProfiles for projectHypothesisId: ${projectHypothesisId}, userId: ${userId}`);
            const profiles = await this.model.find({
                projectHypothesisId,
                userId,
            });
            console.log(`[HypothesesPersonProfileService] Found ${profiles.length} ICP profiles`);
            profiles.forEach((profile, i) => {
                console.log(`[HypothesesPersonProfileService]   ${i + 1}. ${profile.name || 'Unnamed'} (ID: ${profile._id}, segmentId: ${profile.customerSegmentId})`);
            });
            return profiles;
        } catch (error) {
            console.error(`[HypothesesPersonProfileService] Error getting profiles:`, error);
            throw error;
        }
    }

    async getPersonProfileByCustomerSegmentId(
        customerSegmentId: string,
        userId: string
    ): Promise<IHypothesesPersonProfile> {
        try {
            const hypothesesPersonProfile = await this.model.findOne({
                customerSegmentId,
                userId,
            });
            if (!hypothesesPersonProfile) {
                throw new Error('Hypotheses person profile not found');
            }
            return hypothesesPersonProfile;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesPersonProfile(
        input: ChangeHypothesesPersonProfileInput,
        userId: string
    ): Promise<IHypothesesPersonProfile> {
        try {
            const hypothesesPersonProfile = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                input,
                {
                    new: true,
                }
            );
            if (!hypothesesPersonProfile) {
                throw new Error('Hypotheses person profile not found');
            }
            return hypothesesPersonProfile;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteAllHypothesesPersonProfiles(id: string, userId: string): Promise<void> {
        try {
            await this.model.deleteMany({ id, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesPersonProfileService = new HypothesesPersonProfileService();
export default hypothesesPersonProfileService;
