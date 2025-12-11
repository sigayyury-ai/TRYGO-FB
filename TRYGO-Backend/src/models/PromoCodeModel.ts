import mongoose, { Schema } from 'mongoose';
import { IPromoCode } from '../types/IPromoCode';
import { SubscriptionType } from '../generated/graphql';

const promoCodeSchema: Schema = new Schema<IPromoCode>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        subscriptionType: {
            type: String,
            enum: Object.values(SubscriptionType),
            required: true,
        },
        durationMonths: {
            type: Number,
            required: true,
            default: 12, // По умолчанию 12 месяцев
        },
        maxUses: {
            type: Number,
            required: true,
            default: 1, // По умолчанию одноразовый
        },
        usedCount: {
            type: Number,
            required: true,
            default: 0,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        expiresAt: {
            type: Date,
            required: false, // Если не указан, промокод не истекает
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        description: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'promocodes',
    }
);

// Индекс для быстрого поиска по коду
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, expiresAt: 1 });

const PromoCodeModel = mongoose.model<IPromoCode, mongoose.Model<IPromoCode>>(
    'PromoCode',
    promoCodeSchema
);

export default PromoCodeModel;

