export interface VoiceCommand {
  command: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

export enum VoiceCommandType {
  START_TIMER = 'start_timer',
  STOP_TIMER = 'stop_timer',
  PAUSE_TIMER = 'pause_timer',
  RESUME_TIMER = 'resume_timer',
  COMPLETE_ORDER = 'complete_order',
  MARK_READY = 'mark_ready',
  NEXT_ORDER = 'next_order',
  PREVIOUS_ORDER = 'previous_order',
  SHOW_ORDERS = 'show_orders',
  FILTER_STATION = 'filter_station',
  SET_PRIORITY = 'set_priority',
  ADD_NOTE = 'add_note',
  SCAN_BARCODE = 'scan_barcode',
}

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  noiseReduction: boolean;
}

export interface VoiceCommandDefinition {
  type: VoiceCommandType;
  patterns: string[]
  parameters?: VoiceParameterDefinition[]
  confirmationRequired: boolean;
  description: string;
}

export interface VoiceParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  values?: string[]
  pattern?: RegExp;
}

export interface VoiceFeedback {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  audioEnabled: boolean;
  visualEnabled: boolean;
}