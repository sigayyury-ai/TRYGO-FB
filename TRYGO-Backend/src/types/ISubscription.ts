import { Types } from 'mongoose';
import { Subscription } from '../generated/graphql';

export interface ISubscription extends Document, Omit<Subscription, 'userId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
}
