import { Document, Types } from 'mongoose';
import { HypothesesValidation as GraphQLHypothesesValidation } from '../generated/graphql';

export interface IHypothesesValidation
    extends Document,
        Omit<GraphQLHypothesesValidation, 'id' | 'userId' | 'projectHypothesisId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectHypothesisId: Types.ObjectId;
}
