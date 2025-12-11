import { Document, Types } from 'mongoose';
import { HypothesesPacking as GraphQLHypothesesPacking } from '../generated/graphql';

export interface IHypothesesPacking
    extends Document,
        Omit<GraphQLHypothesesPacking, 'id' | 'userId' | 'projectHypothesisId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectHypothesisId: Types.ObjectId;
}
