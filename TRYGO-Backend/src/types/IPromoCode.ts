import { Document, Types } from 'mongoose';
import { SubscriptionType } from '../generated/graphql';

export interface IPromoCode extends Document {
    _id: Types.ObjectId;
    code: string;
    subscriptionType: SubscriptionType;
    durationMonths: number;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    expiresAt?: Date;
    createdBy?: Types.ObjectId;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

