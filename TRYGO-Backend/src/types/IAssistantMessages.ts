import { Document, Types } from 'mongoose';
import { AssistantMessages as GraphQLAssistantMessages } from '../generated/graphql';

export interface IAssistantMessages
    extends Document,
        Omit<GraphQLAssistantMessages, 'id' | 'userId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
}
