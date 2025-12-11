import { Document, Types } from 'mongoose';
import {
    HypothesesGtmDetailedChannel as GraphQLHypothesesGtmDetailedChannel,
} from '../generated/graphql';
import {
    GtmChannelContentIdea as GraphQLHypothesesGtmDetailedChannelContentIdea,
    GtmChannelActionPlan as GraphQLHypothesesGtmDetailedChannelActionPlan,
    TextIsCompleted as GraphQLHypothesesGtmDetailedChannelPreparationTask,
    GtmChannelMetricsAndKpis as GraphQLHypothesesGtmDetailedChannelMetricsAndKpis,
} from '../generated/graphql';

export interface IHypothesesGtmDetailedChannel
    extends Document,
        Omit<
            GraphQLHypothesesGtmDetailedChannel,
            'id' | 'userId' | 'hypothesesGtmChannelId' | 'customerSegmentId'
        > {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    hypothesesGtmChannelId: Types.ObjectId;
    customerSegmentId: Types.ObjectId;
}

export interface IHypothesesGtmDetailedChannelPreparationTask
    extends Document,
        Omit<GraphQLHypothesesGtmDetailedChannelPreparationTask, 'id'> {
    _id: Types.ObjectId;
}

export interface IHypothesesGtmDetailedChannelContentIdea
    extends Document,
        Omit<GraphQLHypothesesGtmDetailedChannelContentIdea, 'id'> {
    _id: Types.ObjectId;
}

export interface IHypothesesGtmDetailedChannelActionPlan
    extends Document,
        Omit<GraphQLHypothesesGtmDetailedChannelActionPlan, 'id'> {
    _id: Types.ObjectId;
}

export interface IHypothesesGtmDetailedChannelMetricsAndKpis
    extends Document,
        Omit<GraphQLHypothesesGtmDetailedChannelMetricsAndKpis, 'id'> {
    _id: Types.ObjectId;
}
