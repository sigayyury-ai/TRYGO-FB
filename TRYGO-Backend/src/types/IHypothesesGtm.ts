import { Document, Types } from 'mongoose';
import { HypothesesGtm as GraphQLHypothesesGtm, HypothesesGtmStage as GraphQLHypothesesGtmStage, HypothesesGtmChannel as GraphQLHypothesesGtmChannel } from '../generated/graphql';

export interface IHypothesesGtm
    extends Document,
        Omit<GraphQLHypothesesGtm, 'id' | 'userId' | 'projectHypothesisId'> {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectHypothesisId: Types.ObjectId;
}

export interface IHypothesesGtmStage extends Document, Omit<GraphQLHypothesesGtmStage, 'channels'> {
    channels: IHypothesesGtmChannel[];
}

export interface IHypothesesGtmChannel extends Document, Omit<GraphQLHypothesesGtmChannel, 'id'> {
    _id: Types.ObjectId;
}