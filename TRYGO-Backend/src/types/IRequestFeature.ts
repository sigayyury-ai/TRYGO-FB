import { Document, Types } from 'mongoose';
import { RequestFeature as GraphQLRequestFeature } from '../generated/graphql';

export interface IRequestFeature
    extends Document,
        Omit<GraphQLRequestFeature, 'id' | 'userId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
}
