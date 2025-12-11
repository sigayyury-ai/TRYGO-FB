import { Document, Types } from 'mongoose';
import { ProjectAssistant as GraphQLProjectAssistant } from '../generated/graphql';

export interface IProjectAssistant
    extends Document,
        Omit<GraphQLProjectAssistant, 'id' | 'userId' | 'projectId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectId: Types.ObjectId;
}
