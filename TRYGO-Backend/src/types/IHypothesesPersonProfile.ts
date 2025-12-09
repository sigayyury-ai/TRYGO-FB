import { Document, Types } from 'mongoose';
import { HypothesesPersonProfile as GraphQLHypothesesPersonProfile } from '../generated/graphql';
import { CjmPart as GraphQLCjmPart } from '../generated/graphql';

export interface IHypothesesPersonProfile
    extends Document,
        Omit<
            GraphQLHypothesesPersonProfile,
            'id' | 'userId' | 'projectHypothesisId' | 'customerSegmentId'
        > {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectHypothesisId: Types.ObjectId;
    customerSegmentId: Types.ObjectId;
}

export interface ICjmPart extends Document, GraphQLCjmPart {}
