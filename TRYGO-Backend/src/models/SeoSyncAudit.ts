import mongoose, { Schema, Document } from 'mongoose';

export interface ISeoSyncAudit extends Document {
  eventId: string;
  type: 'create' | 'update' | 'delete';
  entity: 'cluster' | 'backlog' | 'content';
  entityId: string;
  projectId: string;
  hypothesisId: string;
  userId?: string;
  source: 'trygo' | 'seo-agent';
  data: any;
  status: 'pending' | 'success' | 'failed' | 'conflict';
  conflictResolution?: 'trygo-wins' | 'seo-agent-wins' | 'merge';
  errorMessage?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SeoSyncAuditSchema = new Schema<ISeoSyncAudit>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['create', 'update', 'delete'] },
  entity: { type: String, required: true, enum: ['cluster', 'backlog', 'content'] },
  entityId: { type: String, required: true },
  projectId: { type: String, required: true },
  hypothesisId: { type: String, required: true },
  userId: { type: String },
  source: { type: String, required: true, enum: ['trygo', 'seo-agent'] },
  data: { type: Schema.Types.Mixed },
  status: { type: String, required: true, enum: ['pending', 'success', 'failed', 'conflict'], default: 'pending' },
  conflictResolution: { type: String, enum: ['trygo-wins', 'seo-agent-wins', 'merge'] },
  errorMessage: { type: String },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Индексы для быстрого поиска
SeoSyncAuditSchema.index({ projectId: 1, hypothesisId: 1 });
SeoSyncAuditSchema.index({ entity: 1, entityId: 1 });
SeoSyncAuditSchema.index({ status: 1 });
SeoSyncAuditSchema.index({ createdAt: 1 });

export const SeoSyncAudit = mongoose.model<ISeoSyncAudit>('SeoSyncAudit', SeoSyncAuditSchema);
