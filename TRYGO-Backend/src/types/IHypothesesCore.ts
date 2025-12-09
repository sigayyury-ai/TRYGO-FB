import { Document, Types } from 'mongoose';
import {
    HypothesesCore as GraphQLHypothesesCore,
    CustomerSegment as GraphQLCustomerSegment,
} from '../generated/graphql';

export interface IHypothesesCore
    extends Document,
        Omit<
            GraphQLHypothesesCore,
            'id' | 'userId' | 'projectHypothesisId' | 'customerSegments'
        > {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    projectHypothesisId: Types.ObjectId;
    customerSegments: ICustomerSegment[];
}

export interface ICustomerSegment
    extends Document,
        Omit<GraphQLCustomerSegment, 'id'> {
    _id: Types.ObjectId;
    name: string;
    description: string;
}
