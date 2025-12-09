import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/IUser';
import { UserRole } from '../generated/graphql';

const userSchema: Schema = new Schema<IUser>(
    {
        email: {
            type: String,
        },
        passwordHash: {
            type: String,
        },
        role: {
            type: String,
            required: true,
            enum: Object.values(UserRole),
            default: UserRole.User,
        },
        resetPassword: {
            resetCode: Number,
            expire: Date,
        },
        timeZoneOffset: {
            type: Number,
            default: 0,
            required: true,
        },
        isProjectGenerationStarted: {
            type: Boolean,
            required: true,
            default: false,
        },
        isProjectGenerated: {
            type: Boolean,
            required: true,
            default: false,
        },
        freeTrialDueTo: {
            type: Date,
            required: true,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'users',
    }
);

const UserModel = mongoose.model<IUser, mongoose.Model<IUser>>(
    'User',
    userSchema
);
export default UserModel;
