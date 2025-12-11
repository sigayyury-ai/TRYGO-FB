import { Agenda } from 'agenda';
import mongoose from 'mongoose';
import crypto from 'crypto';
// TODO: Эти модели отсутствуют в проекте, закомментировано для компиляции
// import { Project } from '../models/Project';
// import { Hypothesis } from '../models/Hypothesis';
// import { SeoCluster } from '../models/SeoCluster';
// import { BacklogIdea } from '../models/BacklogIdea';
// import { ContentItem } from '../models/ContentItem';
import { SeoSyncAudit } from '../models/SeoSyncAudit';
// Используем существующие модели проекта
import ProjectModel from '../models/ProjectModel';
import ProjectHypothesisModel from '../models/ProjectHypothesisModel';

interface SyncEvent {
  type: 'create' | 'update' | 'delete';
  entity: 'cluster' | 'backlog' | 'content';
  entityId: string;
  projectId: string;
  hypothesisId: string;
  data?: any;
  timestamp: Date;
  source: 'trygo' | 'seo-agent';
}

export class SeoSyncService {
  private agenda: Agenda;
  private syncQueue: SyncEvent[] = [];

  constructor(mongoConnection: mongoose.Connection) {
    // Исправлено: используем правильный формат для Agenda
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
    this.agenda = new Agenda({
      db: { address: mongoUri, collection: 'seo-sync-jobs' },
      processEvery: '30 seconds',
      maxConcurrency: 5,
      defaultLockLifetime: 10000,
    });

    this.setupJobs();
  }

  private setupJobs() {
    // Периодическая синхронизация раз в час
    this.agenda.define('sync-seo-data', async (job: any) => {
      const { projectId, hypothesisId } = job.attrs.data;
      await this.performFullSync(projectId, hypothesisId);
    });

    // Обработка очереди синхронизации
    this.agenda.define('process-sync-queue', async () => {
      await this.processSyncQueue();
    });

    // Синхронизация изменений в реальном времени
    this.agenda.define('sync-realtime-changes', async (job: any) => {
      const { event } = job.attrs.data;
      await this.handleRealtimeSync(event);
    });
  }

  async start() {
    await this.agenda.start();
    console.log('SEO Sync Service started');

    // Запуск периодической синхронизации
    await this.agenda.every('1 hour', 'sync-seo-data', {
      projectId: 'all',
      hypothesisId: 'all'
    });

    // Обработка очереди каждые 30 секунд
    await this.agenda.every('30 seconds', 'process-sync-queue');
  }

  async stop() {
    await this.agenda.stop();
  }

  // Добавление события в очередь синхронизации
  async queueSyncEvent(event: SyncEvent) {
    this.syncQueue.push(event);

    // Немедленная обработка критических изменений
    if (this.isCriticalEvent(event)) {
      await this.agenda.now('sync-realtime-changes', { event });
    }
  }

  private isCriticalEvent(event: SyncEvent): boolean {
    // Критические изменения: удаления, статусы публикации
    return event.type === 'delete' ||
           (event.type === 'update' && event.data?.status === 'published');
  }

  // Полная синхронизация проекта/гипотезы
  private async performFullSync(projectId: string, hypothesisId: string) {
    try {
      console.log(`Starting full sync for project ${projectId}, hypothesis ${hypothesisId}`);

      // Синхронизация кластеров
      await this.syncClusters(projectId, hypothesisId);

      // Синхронизация backlog
      await this.syncBacklog(projectId, hypothesisId);

      // Синхронизация контента
      await this.syncContent(projectId, hypothesisId);

      console.log(`Full sync completed for project ${projectId}, hypothesis ${hypothesisId}`);
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    }
  }

  private async syncClusters(projectId: string, hypothesisId: string) {
    // Логика синхронизации кластеров между TRYGO и SEO Agent
    // Здесь будет интеграция с SEO Agent API
  }

  private async syncBacklog(projectId: string, hypothesisId: string) {
    // Логика синхронизации backlog items
  }

  private async syncContent(projectId: string, hypothesisId: string) {
    // Логика синхронизации content items
  }

  // Обработка очереди синхронизации
  private async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const events = [...this.syncQueue];
    this.syncQueue = [];

    for (const event of events) {
      try {
        await this.processSyncEvent(event);
      } catch (error) {
        console.error('Failed to process sync event:', event, error);
        // Повторная постановка в очередь с задержкой
        setTimeout(() => this.queueSyncEvent(event), 60000);
      }
    }
  }

  private async processSyncEvent(event: SyncEvent) {
    console.log('Processing sync event:', event);

    try {
      switch (event.entity) {
        case 'cluster':
          await this.syncClusterEvent(event);
          break;
        case 'backlog':
          await this.syncBacklogEvent(event);
          break;
        case 'content':
          await this.syncContentEvent(event);
          break;
      }

      // Обновление статуса в audit trail
      await this.updateAuditEventStatus(event, 'success');
    } catch (error: any) {
      console.error('Failed to process sync event:', error);
      await this.updateAuditEventStatus(event, 'failed', error?.message || 'Unknown error');
      throw error;
    }
  }

  private async syncClusterEvent(event: SyncEvent) {
    // Синхронизация кластера
  }

  private async syncBacklogEvent(event: SyncEvent) {
    // Синхронизация backlog item
  }

  private async syncContentEvent(event: SyncEvent) {
    // Синхронизация content item
  }

  private async handleRealtimeSync(event: SyncEvent) {
    // Немедленная синхронизация критических изменений
    console.log('Handling realtime sync:', event);
    await this.processSyncEvent(event);
  }

  private async logSyncEvent(event: SyncEvent) {
    try {
      const auditEvent = new SeoSyncAudit({
        eventId: crypto.randomUUID(),
        type: event.type,
        entity: event.entity,
        entityId: event.entityId,
        projectId: event.projectId,
        hypothesisId: event.hypothesisId,
        source: event.source,
        data: event.data,
        status: 'pending'
      });

      await auditEvent.save();
      console.log('Logged sync event:', auditEvent.eventId);
    } catch (error) {
      console.error('Failed to log sync event:', error);
    }
  }

  // Публичные методы для ручной синхронизации
  async syncProject(projectId: string) {
    await this.agenda.now('sync-seo-data', { projectId, hypothesisId: 'all' });
  }

  async syncHypothesis(projectId: string, hypothesisId: string) {
    await this.agenda.now('sync-seo-data', { projectId, hypothesisId });
  }

  // Обновление статуса audit события
  private async updateAuditEventStatus(event: SyncEvent, status: 'success' | 'failed', errorMessage?: string) {
    try {
      // Находим audit событие по данным события (поскольку у нас нет eventId в SyncEvent)
      const query: any = {
        type: event.type,
        entity: event.entity,
        entityId: event.entityId,
        projectId: event.projectId,
        hypothesisId: event.hypothesisId,
        source: event.source,
        status: 'pending'
      };

      await SeoSyncAudit.findOneAndUpdate(query, {
        status,
        errorMessage,
        processedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to update audit event status:', error);
    }
  }

  // Обработка вебхуков от SEO Agent
  async handleWebhook(payload: any, signature?: string) {
    try {
      // Валидация подписи для безопасности
      if (signature && !this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const event: SyncEvent = {
        type: payload.type,
        entity: payload.entity,
        entityId: payload.entityId,
        projectId: payload.projectId,
        hypothesisId: payload.hypothesisId,
        source: 'seo-agent',
        data: payload.data,
        timestamp: new Date(payload.timestamp || Date.now())
      };

      await this.queueSyncEvent(event);

      return { success: true, eventId: event.entityId };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  // Валидация подписи вебхука
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const secret = process.env.SEO_AGENT_WEBHOOK_SECRET;
    if (!secret) return true; // В dev режиме без проверки

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Методы для обработки конфликтов
  async resolveConflict(entityType: string, entityId: string, resolution: 'trygo-wins' | 'seo-agent-wins' | 'merge') {
    try {
      const auditEvent = await SeoSyncAudit.findOne({
        entity: entityType,
        entityId,
        status: 'conflict'
      });

      if (!auditEvent) {
        throw new Error('Conflict event not found');
      }

      // Применение решения конфликта
      await this.applyConflictResolution(auditEvent, resolution);

      // Обновление статуса
      auditEvent.status = 'success';
      auditEvent.conflictResolution = resolution;
      auditEvent.processedAt = new Date();
      await auditEvent.save();

      return { success: true };
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      throw error;
    }
  }

  private async applyConflictResolution(auditEvent: any, resolution: string) {
    // Логика применения решения конфликта
    console.log('Applying conflict resolution:', resolution, 'for event:', auditEvent.eventId);
  }

  // Получение статуса синхронизации
  async getSyncStatus(projectId: string, hypothesisId?: string) {
    const query: any = { projectId };
    if (hypothesisId) query.hypothesisId = hypothesisId;

    const stats = await SeoSyncAudit.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          lastEvent: { $max: '$createdAt' }
        }
      }
    ]);

    return {
      projectId,
      hypothesisId,
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, lastEvent: stat.lastEvent };
        return acc;
      }, {})
    };
  }
}
