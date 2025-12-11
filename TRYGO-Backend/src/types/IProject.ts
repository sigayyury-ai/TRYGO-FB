import { Document, Types } from 'mongoose';
import { Project as GraphQLProject } from '../generated/graphql';

export interface IProject
    extends Document,
        Omit<GraphQLProject, 'id' | 'userId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
}
