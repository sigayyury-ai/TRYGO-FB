import mongoose, { Schema } from 'mongoose';
import { ISubscription } from '../types/ISubscription';
import { SubscriptionStatus, SubscriptionType } from '../generated/graphql';

const subscriptionSchema: Schema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        stripeSubscriptionId: String,
        customerId: String,
        startDate: Date,
        endDate: Date,
        price: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(SubscriptionStatus),
            default: SubscriptionStatus.Active,
        },
        type: {
            type: String,
            enum: Object.values(SubscriptionType),
            required: true,
        },
    },

    {
        timestamps: true,
        versionKey: false,
        collection: 'subscriptions',
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const SubscriptionsModel = mongoose.model<
    ISubscription,
    mongoose.Model<ISubscription>
>('Subscription', subscriptionSchema);

export default SubscriptionsModel;
