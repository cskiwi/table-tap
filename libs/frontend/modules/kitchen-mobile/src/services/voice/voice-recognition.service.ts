import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent, EMPTY } from 'rxjs';
import { map, filter, share, catchError } from 'rxjs/operators';
import {
  VoiceCommand,
  VoiceCommandType,
  VoiceRecognitionConfig,
  VoiceCommandDefinition,
  VoiceFeedback
} from '../../types';

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class VoiceRecognitionService {
  private recognition: any;
  private isListening$ = new BehaviorSubject<boolean>(false);
  private isSupported$ = new BehaviorSubject<boolean>(false);
  private lastCommand$ = new BehaviorSubject<VoiceCommand | null>(null);

  private readonly defaultConfig: VoiceRecognitionConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: false,
    maxAlternatives: 1,
    confidenceThreshold: 0.7,
    noiseReduction: true,
  }

  private readonly commandDefinitions: VoiceCommandDefinition[] = [
    {
      type: VoiceCommandType.START_TIMER,
      patterns: ['start timer', 'begin timer', 'timer start'],
      parameters: [
        { name: 'orderId', type: 'string', required: false }
      ],
      confirmationRequired: false,
      description: 'Start a timer for an order'
    },
    {
      type: VoiceCommandType.STOP_TIMER,
      patterns: ['stop timer', 'end timer', 'timer stop'],
      parameters: [
        { name: 'orderId', type: 'string', required: false }
      ],
      confirmationRequired: false,
      description: 'Stop a running timer'
    },
    {
      type: VoiceCommandType.PAUSE_TIMER,
      patterns: ['pause timer', 'timer pause'],
      confirmationRequired: false,
      description: 'Pause the current timer'
    },
    {
      type: VoiceCommandType.RESUME_TIMER,
      patterns: ['resume timer', 'continue timer', 'timer resume'],
      confirmationRequired: false,
      description: 'Resume a paused timer'
    },
    {
      type: VoiceCommandType.COMPLETE_ORDER,
      patterns: ['order complete', 'complete order', 'order done', 'finished'],
      parameters: [
        { name: 'orderId', type: 'string', required: false }
      ],
      confirmationRequired: true,
      description: 'Mark an order as complete'
    },
    {
      type: VoiceCommandType.MARK_READY,
      patterns: ['mark ready', 'ready', 'order ready'],
      parameters: [
        { name: 'orderId', type: 'string', required: false }
      ],
      confirmationRequired: false,
      description: 'Mark an order item as ready'
    },
    {
      type: VoiceCommandType.NEXT_ORDER,
      patterns: ['next order', 'next', 'show next'],
      confirmationRequired: false,
      description: 'Navigate to next order'
    },
    {
      type: VoiceCommandType.PREVIOUS_ORDER,
      patterns: ['previous order', 'previous', 'go back'],
      confirmationRequired: false,
      description: 'Navigate to previous order'
    },
    {
      type: VoiceCommandType.SHOW_ORDERS,
      patterns: ['show orders', 'list orders', 'display orders'],
      confirmationRequired: false,
      description: 'Display all orders'
    },
    {
      type: VoiceCommandType.FILTER_STATION,
      patterns: ['filter by station', 'show station', 'filter station'],
      parameters: [
        {
          name: 'station',
          type: 'enum',
          required: true,
          values: ['grill', 'fryer', 'salad', 'dessert', 'drinks', 'expedite']
        }
      ],
      confirmationRequired: false,
      description: 'Filter orders by kitchen station'
    },
    {
      type: VoiceCommandType.SET_PRIORITY,
      patterns: ['set priority', 'priority', 'urgent'],
      parameters: [
        {
          name: 'priority',
          type: 'enum',
          required: true,
          values: ['low', 'normal', 'high', 'urgent']
        },
        { name: 'orderId', type: 'string', required: false }
      ],
      confirmationRequired: false,
      description: 'Set order priority level'
    },
    {
      type: VoiceCommandType.ADD_NOTE,
      patterns: ['add note', 'note', 'comment'],
      parameters: [
        { name: 'note', type: 'string', required: true },
        { name: 'orderId', type: 'string', required: false }
      ],
      confirmationRequired: false,
      description: 'Add a note to an order',
    },
    {
      type: VoiceCommandType.SCAN_BARCODE,
      patterns: ['scan barcode', 'scan code', 'barcode'],
      confirmationRequired: false,
      description: 'Start barcode scanning'
  }
  ];
  constructor(private ngZone: NgZone) {
    this.initializeSpeechRecognition()
  }

  get isListening(): Observable<boolean> {
    return this.isListening$.asObservable()
  }

  get isSupported(): Observable<boolean> {
    return this.isSupported$.asObservable()
  }

  get lastCommand(): Observable<VoiceCommand | null> {
    return this.lastCommand$.asObservable()
  }

  get commands(): Observable<VoiceCommand> {
    return this.lastCommand$.pipe(
      filter(command => command !== null),
      map(command => command!)
    );
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported');
      this.isSupported$.next(false);
      return;
    }

    this.recognition = new SpeechRecognition()
    this.configureRecognition(this.defaultConfig);
    this.setupEventListeners()
    this.isSupported$.next(true);
  }

  private configureRecognition(config: VoiceRecognitionConfig): void {
    if (!this.recognition) return;

    this.recognition.lang = config.language;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.ngZone.run(() => {
        this.isListening$.next(true);
      });
    }

    this.recognition.onend = () => {
      this.ngZone.run(() => {
        this.isListening$.next(false);
      });
    }

    this.recognition.onerror = (event: any) => {
      this.ngZone.run(() => {
        console.error('Speech recognition error:', event.error);
        this.isListening$.next(false);
      });
    }

    this.recognition.onresult = (event: any) => {
      this.ngZone.run(() => {
        this.processRecognitionResult(event);
      });
    }
  }

  private processRecognitionResult(event: any): void {
    const resultIndex = event.resultIndex;
    const result = event.results[resultIndex]

    if (result.isFinal) {
      const transcript = result[0].transcript.toLowerCase().trim()
      const confidence = result[0].confidence;

      if (confidence >= this.defaultConfig.confidenceThreshold) {
        const command = this.parseCommand(transcript, confidence);
        if (command) {
          this.lastCommand$.next(command);
        }
      }
    }
  }

  private parseCommand(transcript: string, confidence: number): VoiceCommand | null {
    for (const definition of this.commandDefinitions) {
      for (const pattern of definition.patterns) {
        if (this.matchesPattern(transcript, pattern)) {
          const parameters = this.extractParameters(transcript, definition);

          return {
            command: definition.type,
            parameters,
            confidence,
            timestamp: new Date()
          };
        }
      }
    }

    return null;
  }

  private matchesPattern(transcript: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with fuzzy matching
    const transcriptWords = transcript.split(' ');
    const patternWords = pattern.split(' ');

    return patternWords.every(word =>
      transcriptWords.some(transcriptWord =>
        transcriptWord.includes(word) || word.includes(transcriptWord)
      )
    );
  }

  private extractParameters(transcript: string, definition: VoiceCommandDefinition): Record<string, any> {
    const parameters: Record<string, any> = {};

    if (!definition.parameters) return parameters;

    for (const param of definition.parameters) {
      if (param.type === 'enum' && param.values) {
        for (const value of param.values) {
          if (transcript.includes(value)) {
            parameters[param.name] = value;
            break;
          }
        }
      } else if (param.type === 'string') {
        // Extract string parameters using context
        const extracted = this.extractStringParameter(transcript, param.name);
        if (extracted) {
          parameters[param.name] = extracted;
        }
      } else if (param.type === 'number') {
        const numbers = transcript.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          parameters[param.name] = parseInt(numbers[0], 10);
        }
      }
    }

    return parameters;
  }

  private extractStringParameter(transcript: string, paramName: string): string | null {
    // This is a simplified implementation
    // In practice, you might want more sophisticated NLP

    if (paramName === 'note') {
      const noteKeywords = ['note', 'comment', 'add'];
      for (const keyword of noteKeywords) {
        const index = transcript.indexOf(keyword);
        if (index !== -1) {
          return transcript.substring(index + keyword.length).trim()
        }
      }
    }

    if (paramName === 'orderId') {
      const orderMatch = transcript.match(/order\s+(\w+)/);
      return orderMatch ? orderMatch[1] : null;
    }

    return null;
  }

  startListening(): void {
    if (!this.recognition || this.isListening$.value) return;

    try {
      this.recognition.start()
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
    }
  }

  stopListening(): void {
    if (!this.recognition || !this.isListening$.value) return;

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  toggleListening(): void {
    if (this.isListening$.value) {
      this.stopListening()
    } else {
      this.startListening()
    }
  }

  updateConfig(config: Partial<VoiceRecognitionConfig>): void {
    const newConfig = { ...this.defaultConfig, ...config }
    this.configureRecognition(newConfig);
  }

  getAvailableCommands(): VoiceCommandDefinition[] {
    return [...this.commandDefinitions]
  }

  addCustomCommand(definition: VoiceCommandDefinition): void {
    this.commandDefinitions.push(definition);
  }

  removeCustomCommand(type: VoiceCommandType): void {
    const index = this.commandDefinitions.findIndex(def => def.type === type);
    if (index > -1) {
      this.commandDefinitions.splice(index, 1);
    }
  }

  // Text-to-speech for feedback
  speakFeedback(feedback: VoiceFeedback): void {
    if (!feedback.audioEnabled || !('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(feedback.message);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Set voice based on feedback type
    const voices = speechSynthesis.getVoices()
    const voice = voices.find(v => v.lang.startsWith('en')) || voices[0]
    if (voice) {
      utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
  }

  // Test voice recognition
  testRecognition(): Observable<boolean> {
    return new Observable(observer => {
      if (!this.isSupported$.value) {
        observer.next(false);
        observer.complete()
        return;
      }

      const testUtterance = new SpeechSynthesisUtterance('Voice recognition test');
      testUtterance.onend = () => {
        observer.next(true);
        observer.complete()
      }

      testUtterance.onerror = () => {
        observer.next(false);
        observer.complete()
      }

      speechSynthesis.speak(testUtterance);
    });
  }
}