import { Document, Types } from 'mongoose';
import { ProjectHypotheses as GraphQLProjectHypotheses } from '../generated/graphql';

export interface IProjectHypothesis
    extends Document,
        Omit<GraphQLProjectHypotheses, 'id' | 'userId' | 'projectId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectId: Types.ObjectId;
}
