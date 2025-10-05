export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  data: any;
  timestamp: Date;
  status: SyncStatus;
  retryCount: number;
  error?: string;
}

export enum SyncOperationType {
  ORDER_UPDATE = 'order_update',
  ORDER_STATUS_CHANGE = 'order_status_change',
  TIMER_START = 'timer_start',
  TIMER_STOP = 'timer_stop',
  INVENTORY_UPDATE = 'inventory_update',
  CONFIGURATION_UPDATE = 'configuration_update',
  KITCHEN_STATS = 'kitchen_stats',
}

export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRY = 'retry',
}

export interface OfflineStorageConfig {
  maxStorageSize: number;
  maxRetryAttempts: number;
  retryInterval: number;
  syncInterval: number;
  conflictResolution: ConflictResolutionStrategy;
}

export enum ConflictResolutionStrategy {
  SERVER_WINS = 'server_wins',
  CLIENT_WINS = 'client_wins',
  TIMESTAMP_WINS = 'timestamp_wins',
  MANUAL_RESOLVE = 'manual_resolve',
}

export interface SyncState {
  isOnline: boolean;
  lastSyncTime: Date;
  pendingOperations: number;
  failedOperations: number;
  isSync: boolean;
  queueSize: number;
}

export interface OfflineQueueItem {
  id: string;
  operation: SyncOperation;
  priority: number;
  createdAt: Date;
  scheduledFor?: Date;
}