import { Document, Types } from 'mongoose';
import { HypothesesMarketResearch as GraphQLHypothesesMarketResearch } from '../generated/graphql';

export interface IHypothesesMarketResearch
    extends Document,
        Omit<GraphQLHypothesesMarketResearch, 'id' | 'userId' | 'projectHypothesisId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectHypothesisId: Types.ObjectId;
}
