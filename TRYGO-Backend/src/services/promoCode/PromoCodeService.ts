import PromoCodeModel from '../../models/PromoCodeModel';
import SubscriptionModel from '../../models/SubscriptionModel';
import { elevateError } from '../../errors/elevateError';
import { SubscriptionType, SubscriptionStatus } from '../../generated/graphql';
import { IPromoCode } from '../../types/IPromoCode';
import mongoose from 'mongoose';

class PromoCodeService {
    private model: typeof PromoCodeModel = PromoCodeModel;

    /**
     * Активирует промокод для пользователя
     */
    async activatePromoCode(
        code: string,
        userId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Найти промокод
            const promoCode = await this.model.findOne({
                code: code.toUpperCase().trim(),
            });

            if (!promoCode) {
                throw new Error('Промокод не найден');
            }

            // Проверить активность
            if (!promoCode.isActive) {
                throw new Error('Промокод неактивен');
            }

            // Проверить срок действия
            if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
                throw new Error('Промокод истек');
            }

            // Проверить количество использований
            if (promoCode.usedCount >= promoCode.maxUses) {
                throw new Error('Промокод уже использован максимальное количество раз');
            }

            // Проверить, не использовал ли уже этот пользователь этот промокод
            // (опционально, можно убрать если нужно разрешить повторное использование)
            const existingSubscription = await SubscriptionModel.findOne({
                userId: new mongoose.Types.ObjectId(userId),
            });

            if (existingSubscription) {
                // Обновить существующую подписку
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + promoCode.durationMonths);

                await SubscriptionModel.updateOne(
                    { userId: new mongoose.Types.ObjectId(userId) },
                    {
                        $set: {
                            type: promoCode.subscriptionType,
                            status: SubscriptionStatus.Active,
                            startDate: new Date(),
                            endDate: endDate,
                            price: 0,
                            updatedAt: new Date(),
                            stripeSubscriptionId:
                                existingSubscription.stripeSubscriptionId ||
                                `promo_${Date.now()}`,
                            customerId:
                                existingSubscription.customerId ||
                                `promo_customer_${Date.now()}`,
                        },
                    }
                );
            } else {
                // Создать новую подписку
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + promoCode.durationMonths);

                await SubscriptionModel.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    type: promoCode.subscriptionType,
                    status: SubscriptionStatus.Active,
                    startDate: new Date(),
                    endDate: endDate,
                    price: 0,
                    stripeSubscriptionId: `promo_${Date.now()}`,
                    customerId: `promo_customer_${Date.now()}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            // Увеличить счетчик использований
            await this.model.updateOne(
                { _id: promoCode._id },
                {
                    $inc: { usedCount: 1 },
                }
            );

            return {
                success: true,
                message: `Промокод активирован! Подписка ${promoCode.subscriptionType} активна на ${promoCode.durationMonths} месяцев`,
            };
        } catch (error) {
            elevateError(error);
            throw error;
        }
    }

    /**
     * Создает новый промокод (для админов)
     */
    async createPromoCode(data: {
        code: string;
        subscriptionType: SubscriptionType;
        durationMonths?: number;
        maxUses?: number;
        expiresAt?: Date;
        description?: string;
        createdBy?: string;
    }): Promise<IPromoCode> {
        try {
            const promoCode = await this.model.create({
                code: data.code.toUpperCase().trim(),
                subscriptionType: data.subscriptionType,
                durationMonths: data.durationMonths || 12,
                maxUses: data.maxUses || 1,
                expiresAt: data.expiresAt,
                description: data.description,
                createdBy: data.createdBy
                    ? new mongoose.Types.ObjectId(data.createdBy)
                    : undefined,
                isActive: true,
                usedCount: 0,
            });

            return promoCode;
        } catch (error) {
            if (error instanceof Error && error.message.includes('duplicate key')) {
                throw new Error('Промокод с таким кодом уже существует');
            }
            elevateError(error);
            throw error;
        }
    }

    /**
     * Получить информацию о промокоде (без активации)
     */
    async getPromoCodeInfo(code: string): Promise<{
        code: string;
        subscriptionType: SubscriptionType;
        durationMonths: number;
        isValid: boolean;
        message?: string;
    }> {
        try {
            const promoCode = await this.model.findOne({
                code: code.toUpperCase().trim(),
            });

            if (!promoCode) {
                return {
                    code: code.toUpperCase().trim(),
                    subscriptionType: SubscriptionType.Starter,
                    durationMonths: 0,
                    isValid: false,
                    message: 'Промокод не найден',
                };
            }

            if (!promoCode.isActive) {
                return {
                    code: promoCode.code,
                    subscriptionType: promoCode.subscriptionType,
                    durationMonths: promoCode.durationMonths,
                    isValid: false,
                    message: 'Промокод неактивен',
                };
            }

            if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
                return {
                    code: promoCode.code,
                    subscriptionType: promoCode.subscriptionType,
                    durationMonths: promoCode.durationMonths,
                    isValid: false,
                    message: 'Промокод истек',
                };
            }

            if (promoCode.usedCount >= promoCode.maxUses) {
                return {
                    code: promoCode.code,
                    subscriptionType: promoCode.subscriptionType,
                    durationMonths: promoCode.durationMonths,
                    isValid: false,
                    message: 'Промокод уже использован максимальное количество раз',
                };
            }

            return {
                code: promoCode.code,
                subscriptionType: promoCode.subscriptionType,
                durationMonths: promoCode.durationMonths,
                isValid: true,
                message: `Промокод дает доступ к ${promoCode.subscriptionType} на ${promoCode.durationMonths} месяцев`,
            };
        } catch (error) {
            elevateError(error);
            throw error;
        }
    }

    /**
     * Получить все промокоды (для админов)
     */
    async getAllPromoCodes(): Promise<IPromoCode[]> {
        try {
            return await this.model.find().sort({ createdAt: -1 });
        } catch (error) {
            elevateError(error);
            throw error;
        }
    }
}

const promoCodeService = new PromoCodeService();
export default promoCodeService;

