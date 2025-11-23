/**
 * Sync Queue - Persistent queue for offline operations
 * 
 * Handles operations that fail due to network issues or MongoDB unavailability.
 * Automatically retries when connection is restored.
 */

export interface QueuedOperation {
  id: string;
  operation: 'saveWorkspace' | 'updateTiles' | 'updateNotes' | 'updateContacts' | 'migrateGuest';
  data: any;
  userId: string;
  sessionId: string;
  attempts: number;
  createdAt: number;
  lastAttempt?: number;
}

const QUEUE_STORAGE_KEY = 'insights_sync_queue';
const MAX_ATTEMPTS = 5;
const RETRY_INTERVAL_MS = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;

class SyncQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      this.startProcessor();
      this.setupOnlineListener();
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[SyncQueue] 📥 Loaded ${this.queue.length} queued operations`);
      }
    } catch (error) {
      console.error('[SyncQueue] ❌ Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Persist queue to localStorage
   */
  private persist(): void {
    try {
      // Limit queue size
      if (this.queue.length > MAX_QUEUE_SIZE) {
        console.warn(`[SyncQueue] ⚠️ Queue size exceeded ${MAX_QUEUE_SIZE}, removing oldest items`);
        this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
      }

      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[SyncQueue] ❌ Failed to persist queue:', error);
    }
  }

  /**
   * Add operation to queue
   */
  async add(op: Omit<QueuedOperation, 'id' | 'attempts' | 'createdAt'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...op,
      id: crypto.randomUUID(),
      attempts: 0,
      createdAt: Date.now(),
    };

    this.queue.push(queuedOp);
    this.persist();

    console.log(`[SyncQueue] ➕ Added operation to queue:`, {
      id: queuedOp.id,
      operation: queuedOp.operation,
      queueSize: this.queue.length,
    });

    // Try to process immediately
    await this.process();
  }

  /**
   * Process queue
   */
  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const op = this.queue[0];

        // Check if we should retry this operation
        if (op.lastAttempt && Date.now() - op.lastAttempt < 5000) {
          // Wait at least 5 seconds between retries
          break;
        }

        try {
          console.log(`[SyncQueue] 🔄 Processing operation:`, {
            id: op.id,
            operation: op.operation,
            attempt: op.attempts + 1,
          });

          await this.executeOperation(op);

          // Success: remove from queue
          this.queue.shift();
          this.persist();

          console.log(`[SyncQueue] ✅ Operation completed:`, {
            id: op.id,
            operation: op.operation,
          });
        } catch (error) {
          op.attempts++;
          op.lastAttempt = Date.now();

          const errorMsg = error instanceof Error ? error.message : String(error);

          if (op.attempts >= MAX_ATTEMPTS) {
            // Failed permanently
            console.error(`[SyncQueue] ❌ Operation failed permanently after ${op.attempts} attempts:`, {
              id: op.id,
              operation: op.operation,
              error: errorMsg,
            });

            // Move to dead letter queue (could be implemented later)
            this.queue.shift();
            this.persist();
          } else {
            // Will retry later
            console.warn(`[SyncQueue] ⚠️ Operation failed (attempt ${op.attempts}/${MAX_ATTEMPTS}):`, {
              id: op.id,
              operation: op.operation,
              error: errorMsg,
            });

            this.persist();
            break; // Stop processing, will retry later
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(op: QueuedOperation): Promise<void> {
    // Dynamic import to avoid circular dependencies
    const { withRetry } = await import('@/lib/db/mongodb');

    switch (op.operation) {
      case 'saveWorkspace': {
        const mongodbStore = await import('@/lib/storage/mongodb-store');
        
        await withRetry(async () => {
          const { tiles, notes, contacts } = op.data;
          
          await mongodbStore.syncWorkspaceTilesToMongo(op.sessionId, op.userId, tiles);
          await mongodbStore.syncWorkspaceNotesToMongo(op.sessionId, op.userId, notes);
          await mongodbStore.syncWorkspaceContactsToMongo(op.sessionId, op.userId, contacts);
        }, 3);
        break;
      }

      case 'updateTiles': {
        const mongodbStore = await import('@/lib/storage/mongodb-store');
        await withRetry(
          () => mongodbStore.syncWorkspaceTilesToMongo(op.sessionId, op.userId, op.data),
          3
        );
        break;
      }

      case 'updateNotes': {
        const mongodbStore = await import('@/lib/storage/mongodb-store');
        await withRetry(
          () => mongodbStore.syncWorkspaceNotesToMongo(op.sessionId, op.userId, op.data),
          3
        );
        break;
      }

      case 'updateContacts': {
        const mongodbStore = await import('@/lib/storage/mongodb-store');
        await withRetry(
          () => mongodbStore.syncWorkspaceContactsToMongo(op.sessionId, op.userId, op.data),
          3
        );
        break;
      }

      case 'migrateGuest': {
        const mongodbStore = await import('@/lib/storage/mongodb-store');
        const { tiles, notes, contacts } = op.data;
        
        await withRetry(async () => {
          await mongodbStore.syncWorkspaceTilesToMongo(op.sessionId, op.userId, tiles);
          await mongodbStore.syncWorkspaceNotesToMongo(op.sessionId, op.userId, notes);
          await mongodbStore.syncWorkspaceContactsToMongo(op.sessionId, op.userId, contacts);
        }, 3);
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${op.operation}`);
    }
  }

  /**
   * Start background processor
   */
  private startProcessor(): void {
    // Process every 30 seconds
    this.intervalId = setInterval(() => {
      this.process();
    }, RETRY_INTERVAL_MS);

    console.log('[SyncQueue] 🚀 Background processor started');
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('[SyncQueue] 🌐 Network connection restored, processing queue');
      this.process();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncQueue] 📡 Network connection lost');
    });
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    processing: boolean;
    operations: Array<{ id: string; operation: string; attempts: number }>;
  } {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      operations: this.queue.map((op) => ({
        id: op.id,
        operation: op.operation,
        attempts: op.attempts,
      })),
    };
  }

  /**
   * Clear queue (for testing/debugging)
   */
  clear(): void {
    this.queue = [];
    this.persist();
    console.log('[SyncQueue] 🗑️ Queue cleared');
  }

  /**
   * Stop processor (for cleanup)
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[SyncQueue] 🛑 Background processor stopped');
    }
  }
}

// Singleton instance (client-side only)
let syncQueueInstance: SyncQueue | null = null;

export function getSyncQueue(): SyncQueue {
  if (typeof window === 'undefined') {
    throw new Error('SyncQueue can only be used in browser environment');
  }

  if (!syncQueueInstance) {
    syncQueueInstance = new SyncQueue();
  }

  return syncQueueInstance;
}

// Export for testing
export { SyncQueue };
