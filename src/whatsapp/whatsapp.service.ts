/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
} from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { WhatsappQr } from './whatsapp-qr.schema';
import { ConfigService } from '@nestjs/config';
import * as qrcode from 'qrcode-terminal';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/user.schema';

/**
 * Interface representing a message in the queue
 */
interface QueuedMessage {
  /** Unique identifier for the message */
  id: string;
  /** Recipient phone number (international format) */
  to: string;
  /** Message content to send */
  message: string;
  /** Timestamp when the message was queued */
  timestamp: Date;
  /** Number of retry attempts for this message */
  retries: number;
}

/**
 * Interface for mass failure alert configuration
 */
interface MassFailureAlert {
  /** Threshold percentage for mass failure detection */
  failureThreshold: number;
  /** Minimum number of messages to trigger alert */
  minMessagesThreshold: number;
  /** Time window for failure analysis (in minutes) */
  timeWindowMinutes: number;
  /** Email address for alerts */
  alertEmail: string;
}

/**
 * WhatsApp service providing message sending capabilities with queue management,
 * automatic reconnection, health monitoring, and mass failure alerts.
 *
 * Features:
 * - Asynchronous message queue with FIFO ordering
 * - Automatic reconnection with exponential backoff
 * - Health monitoring and crash recovery
 * - Session persistence and QR code management
 * - Mass failure detection and email alerts
 *
 */
@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);

  /** WhatsApp Web client instance */
  private client: Client;

  /** Indicates if the WhatsApp client is ready to send messages */
  private isReady = false;

  private needToScan = true;

  // Message queue management
  /** Array of messages waiting to be sent (FIFO queue) */
  private messageQueue: QueuedMessage[] = [];

  /** Flag to prevent concurrent queue processing */
  private isProcessingQueue = false;

  /** Maximum number of retry attempts for failed messages */
  private maxRetries = 3;

  // Reconnection management with exponential backoff
  /** Current number of reconnection attempts */
  private reconnectAttempts = 0;

  /** Maximum number of reconnection attempts before giving up */
  private maxReconnectAttempts = 5;

  /** Base delay for exponential backoff (in milliseconds) */
  private baseReconnectDelay = 1000; // 1 second

  /** Maximum delay for exponential backoff (in milliseconds) */
  private maxReconnectDelay = 30000; // 30 seconds

  /** Timeout reference for scheduled reconnection attempts */
  private reconnectTimeout: NodeJS.Timeout;

  /** Flag to track if we're currently attempting reconnection */
  private isReconnecting = false;

  /** Flag to track if we had a successful connection recently */
  private hadSuccessfulConnection = false;

  /** Timestamp of last successful connection */
  private lastSuccessfulConnection: Date | null = null;

  /** Minimum time to consider a connection stable (in milliseconds) */
  private readonly stableConnectionTime = 30000; // 30 seconds

  /** Timeout to reset reconnection attempts after stable connection */
  private stableConnectionTimeout: NodeJS.Timeout;

  // Health monitoring
  /** Interval reference for periodic health checks */
  private healthCheckInterval: NodeJS.Timeout;

  /** Delay between health checks (in milliseconds) */
  private readonly healthCheckDelay = 60000; // 60 seconds

  private ResultsLimite = 1000;

  count: number = 0;

  // Mass failure monitoring
  /** Configuration for mass failure alerts */
  private readonly massFailureConfig: MassFailureAlert = {
    failureThreshold: 50, // 50% failure rate triggers alert
    minMessagesThreshold: 10, // Minimum 10 messages to consider for alert
    timeWindowMinutes: 15, // 15 minutes window for analysis
    alertEmail: 'support@yabi.cm',
  };

  /** Array to store recent message processing results for failure analysis */
  private recentProcessingResults: Array<{
    timestamp: Date;
    success: boolean;
    messageId: string;
  }> = [];

  /** Flag to prevent multiple alerts for the same failure period */
  private alertSent = false;

  /** Frontend URL for messages */
  private frontUrl: any = '';

  private results: any;

  /**
   * Creates a new WhatsApp service instance
   * @param qrModel - Mongoose model for storing QR codes
   * @param configService - Configuration service for environment variables
   */
  constructor(
    @InjectModel(WhatsappQr.name)
    private readonly qrModel: Model<WhatsappQr>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.count = 0;
    this.reconnectAttempts = 0;
    this.frontUrl = this.configService.get<string>('FRONT_URL')
      ? this.configService.get<string>('FRONT_URL')
      : 'https://yabi.cm';
  }

  /**
   * Initializes the WhatsApp service when the module starts.
   * Starts the WhatsApp client initialization and health monitoring in the background.
   */
  onModuleInit() {
    console.log('Whatsapp module initiated');
    // Start WhatsApp initialization in the background, without waiting
    this.initWhatsapp().catch((err) => {
      const message =
        'Error during WhatsApp init (non-blocking) : ' + err.message;
      this.logger.error(message);
      this.sendConnexionFailureAlert(message);
    });
  }

  /**
   * Cleans up resources when the module is destroyed.
   * Stops health monitoring, clears timeouts, and destroys the WhatsApp client.
   */
  onModuleDestroy() {
    // Clean up resources
    this.stopHealthCheck();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.client) this.disconnect();
  }

  /**
   * Initializes the WhatsApp Web client with session persistence and event handlers.
   * Sets up QR code handling, connection monitoring, and automatic reconnection.
   *
   */
  async initWhatsapp() {
    console.log('initWhatsapp');
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({ dataPath: './assets/sessions/whatsapp' }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-default-browser-check',
            '--safebrowsing-disable-auto-update',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=4096',
          ],
        },
      });

      // Handle QR code generation for authentication
      this.setupEventHandlers();
      await this.client.initialize();
    } catch (err) {
      const message = `Error initializing WhatsApp client : ${err.message}`;
      this.updateQrStatus(false, message);
      this.logger.error(message);
      this.handleDisconnect();
      setTimeout(() => this.initWhatsapp(), 30 * 1000);
      throw new Error(message);
    }
  }

  /**
   * Adds a message to the queue for asynchronous sending.
   * Returns immediately with a promise that resolves when the message is queued.
   * The message will be sent when the WhatsApp client is ready.
   *
   * @param to - Recipient phone number in international format (e.g., '237612345678')
   * @param message - Text message to send
   * @param code - Optional country code to prefix the phone number
   * @returns Promise resolving to queue status information
   *
   * @example
   * ```typescript
   * const result = await whatsappService.sendMessage('237612345678', 'Hello World!');
   * console.log(result);
   * // Output: { success: true, messageId: 'msg_123...', queued: true, estimatedDelivery: 'immediate' }
   * ```
   */
  async sendMessage(to: string, message: string, code?: string): Promise<any> {
    console.log('sendMessage');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    const messageId = this.generateMessageId();

    // Handle country code prefix
    let formattedPhoneNumber = to;
    if (code && !to.startsWith(code)) formattedPhoneNumber = code + to;

    const queuedMessage: QueuedMessage = {
      id: messageId,
      to: formattedPhoneNumber,
      message,
      timestamp: new Date(),
      retries: 0,
    };

    // Add to message queue
    this.messageQueue.push(queuedMessage);
    this.logger.log(
      `Message ${messageId} added to queue. Queue length: ${this.messageQueue.length}`,
    );

    // Process immediately if client is ready and not currently processing
    if (this.isReady && !this.isProcessingQueue) {
      this.processQueueBatch();
    }

    // Return queue status information
    const queueStatus = this.getQueueStatus();
    return {
      success: true,
      messageId,
      queued: true,
      estimatedDelivery: this.isReady ? 'immediate' : 'when_ready',
      queueStatus,
    };
  }

  /**
   * Processes the message queue in FIFO order.
   * Sends messages one by one and handles retries for failed messages.
   * Includes comprehensive error handling, performance metrics, and mass failure detection.
   *
   * @private
   */
  private async processQueueBatch(batchSize = 5): Promise<void> {
    console.log('processQueueBatch');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    if (this.isProcessingQueue || !this.isReady) {
      return;
    }

    this.isProcessingQueue = true;
    const batch = this.messageQueue.splice(0, batchSize);
    this.results = { success: 0, failure: 0, retry: 0 };

    try {
      await Promise.all(batch.map(async (msg) => this.sendQueuedMessage(msg)));
    } finally {
      this.isProcessingQueue = false;
      this.finalProcess(batchSize);
    }
  }

  private async sendQueuedMessage(msg) {
    console.log('sendQueuedMessage', msg.to, msg.message, msg.id, msg.retries);
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.logger.log(`Sending message (ID: ${msg.id})...`); // Log before sending message to ensure logging is done before re')
    try {
      const chatId = msg.to.replace(/\D/g, '') + '@c.us';
      await this.client.sendMessage(chatId, msg.message);
      this.results.success++;
      this.recordProcessingResult(msg.id, true);
      this.logger.log(`Message sent (ID: ${msg.id})`);
    } catch (error) {
      if (msg.retries < this.maxRetries) {
        msg.retries++;
        this.results.retry++;
        this.messageQueue.unshift(msg);
        this.logger.warn(
          `Message retry (ID: ${msg.id}, Attempt: ${msg.retries})`,
        );
      } else {
        this.results.failure++;
        this.recordProcessingResult(msg.id, false);
        this.logger.error(`Message failed (ID: ${msg.id})`);
      }
    }
  }

  private finalProcess(batchSize) {
    console.log('finalProcess');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.logger.log(
      `Batch processed - Success: ${this.results.success}, Failed: ${this.results.failure}, Retries: ${this.results.retry}`,
    );
    this.checkForMassFailure();

    if (this.messageQueue.length > 0) {
      setImmediate(() => this.processQueueBatch(batchSize));
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private setupEventHandlers(): void {
    console.log('setupEventHandlers');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.client.on('qr', async (qr) => this.handleQrCode(qr));

    this.client.on('ready', () => this.handleReady());

    this.client.on('auth_failure', (msg) => this.handleAuthFailure(msg));

    this.client.on('disconnected', (reason) => this.handleDisconnected(reason));
  }

  private async handleQrCode(qr) {
    console.log('handleQrCode');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.isReady = false;
    this.needToScan = true;
    const message =
      'Received QR code for WhatsApp Web. Scan it with your phone.';
    this.logger.warn(message);
    qrcode.generate(qr, { small: true });
    if (this.count === 0) {
      this.sendQrNeedToScanAlert();
      this.count++;
    }

    try {
      await this.qrModel.findOneAndUpdate(
        {},
        { qr, status: false, message: 'Awaiting QR scan' },
        { upsert: true, new: true },
      );
    } catch (err) {
      const errMessage = `QR save failed: ${err.message}`;
      this.logger.error(errMessage);
      this.sendQrCodeFailureAlert(errMessage);
    }
  }

  private handleReady() {
    console.log('handleReady');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.isReady = true;
    this.reconnectAttempts = 0;
    this.needToScan = false;
    this.logger.log('Client ready');
    this.updateQrStatus(true, 'Client ready');
    this.sendMessage('91224472', ' ✅ ✅ *WhatsApp Service is ready* ', '237');
    this.sendWhatsappConnectedNotification();
    this.processQueueBatch();

    // Start health monitoring
    this.startHealthCheck();
  }

  private handleAuthFailure(msg) {
    console.log('handlAuthFailure');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.isReady = false;
    this.needToScan = false;
    const message = `Auth failure: ${msg}`;
    this.logger.error(message);
    this.updateQrStatus(false, message);
    this.handleDisconnect();
  }

  private handleDisconnected(reason) {
    console.log('handleDisconnected');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.isReady = false;
    this.needToScan = false;
    const message = `Disconnected: ${reason}`;
    if (reason === 'LOGOUT') return this.disconnect();
    this.logger.warn(message);
    this.updateQrStatus(false, message);
    this.handleDisconnect();
  }

  /**
   * Records a message processing result for failure analysis.
   *
   * @param messageId - The ID of the processed message
   * @param success - Whether the message was sent successfully
   * @private
   */
  private recordProcessingResult(messageId: string, success: boolean): void {
    console.log('recordProcessingResult ', messageId);
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.recentProcessingResults.push({
      timestamp: new Date(),
      success,
      messageId,
    });
    this.cleanUpSuccessfulResults(this.recentProcessingResults);

    console.log(
      'this.recentProcessingResults -0- ',
      this.recentProcessingResults,
    );

    // Clean up old results (keep only results from the last time window)
    const cutoffTime = new Date(
      Date.now() - this.massFailureConfig.timeWindowMinutes * 60 * 1000,
    );
    this.recentProcessingResults = this.recentProcessingResults.filter(
      (result) => result.timestamp > cutoffTime,
    );

    this.cleanUpSuccessfulResults(this.recentProcessingResults);
    console.log(
      'this.recentProcessingResults -1- ',
      this.recentProcessingResults,
    );
  }
  private cleanUpSuccessfulResults(
    recentProcessingResults: Array<{
      timestamp: Date;
      success: boolean;
      messageId: string;
    }>,
    maxSize: number = this.ResultsLimite,
  ) {
    if (recentProcessingResults.length <= maxSize) return;

    const failures = recentProcessingResults.filter(
      (result) => result.success === false,
    );

    while (failures.length > maxSize) {
      failures.shift();
    }

    recentProcessingResults.length = 0;
    recentProcessingResults.push(...failures);
    this.recentProcessingResults = recentProcessingResults;
  }

  /**
   * Checks for mass failure conditions and sends alert if threshold is exceeded.
   *
   * @private
   */
  private async checkForMassFailure(): Promise<void> {
    console.log('checkForMassFailure');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    console.log(
      'recentProcessingResults length: ',
      this.recentProcessingResults.length,
    );
    if (
      this.alertSent ||
      this.recentProcessingResults.length <
        this.massFailureConfig.minMessagesThreshold
    ) {
      return;
    }

    const failureCount = this.recentProcessingResults.filter(
      (result) => !result.success,
    ).length;
    const totalMessages = this.recentProcessingResults.length;
    const failureRate = (failureCount / totalMessages) * 100;

    if (failureRate >= this.massFailureConfig.failureThreshold) {
      const errMessage =
        `MASS FAILURE DETECTED: ${failureRate.toFixed(1)}% failure rate ` +
        `(${failureCount}/${totalMessages} messages failed in last ${this.massFailureConfig.timeWindowMinutes} minutes)`;
      this.logger.error(errMessage);

      // this.updateQrStatus(false, errMessage);
      this.sendMassFailureAlert(failureRate, failureCount, totalMessages);
      this.alertSent = true;

      // Reset alert flag after some time to allow future alerts
      setTimeout(
        () => {
          this.alertSent = false;
        },
        15 * 60 * 1000,
      ); // 15 minutes
    }
  }

  /**
   * Sends a mass failure alert email to the configured address.
   *
   * @param failureRate - The percentage of failed messages
   * @param failureCount - The number of failed messages
   * @param totalMessages - The total number of messages processed
   * @private
   */
  private async sendMassFailureAlert(
    failureRate: number,
    failureCount: number,
    totalMessages: number,
  ): Promise<void> {
    try {
      const subject =
        `🚨 🚨 WhatsApp Mass Failure Alert - Yabi Events` +
        new Date().toISOString();
      const message = `
        <h2>WhatsApp Mass Failure Alert</h2>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Failure Rate:</strong> ${failureRate.toFixed(1)}%</p>
        <p><strong>Failed Messages:</strong> ${failureCount}/${totalMessages}</p>
        <p><strong>Time Window:</strong> Last ${this.massFailureConfig.timeWindowMinutes} minutes</p>
        <p><strong>Client Status:</strong> ${this.isReady ? 'Ready' : 'Not Ready'}</p>
        <p><strong>Queue Length:</strong> ${this.messageQueue.length}</p>
        <p><strong>Reconnection Attempts:</strong> ${this.reconnectAttempts}/${this.maxReconnectAttempts}</p>

        <h3>Recommended Actions:</h3>
        <ul>
          <li>Check WhatsApp Web session status</li>
          <li>Verify network connectivity</li>
          <li>Review recent error logs</li>
          <li>Consider manual reconnection if needed</li>
        </ul>

        <p><em>This is an automated alert from the Yabi Events WhatsApp service.</em></p>
      `;

      this.logger.warn(
        `🚨 🚨 🚨  Mass failure alert would be sent to ${this.massFailureConfig.alertEmail}`,
      );
      this.logger.warn(
        `Alert details: ${failureRate.toFixed(1)}% failure rate, ${failureCount}/${totalMessages} messages`,
      );
      // Send alert by mail
      await this.emailService.sendEmail(
        this.massFailureConfig.alertEmail,
        subject,
        message,
      );
      this.disconnect();
    } catch (error) {
      this.logger.error(`Failed to send mass failure alert: ${error.message}`);
    }
  }

  private async sendConnexionFailureAlert(info?: string): Promise<void> {
    if (this.alertSent) return;
    this.isReady = false;
    if (!info) info = 'Connexion Failure Alert';

    try {
      const subject =
        `🚨🚨🚨 WhatsApp Connexion Failure Alert - Yabi Events ` +
        new Date().toISOString();
      const message = `
        <h2>WhatsApp messaging service: ${info}</h2>
        <p>The system is unable to send WhatsApp messages because the attempt to connect to the Yabi Events WhatsApp account failed.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Failed Messages:</strong> WhatsApp Connexion Failure.</p>
        <p><strong>Time Window:</strong> Last ${this.massFailureConfig.timeWindowMinutes} minutes</p>
        <p><strong>Client Status:</strong> ${this.isReady ? 'Ready' : 'Not Ready'}</p>
        <p><strong>Queue Length:</strong> ${this.messageQueue.length}</p>
        <p><strong>Reconnection Attempts:</strong> ${this.reconnectAttempts}/${this.maxReconnectAttempts}</p>
        <p><strong>Action required:</strong> You need to open the admin dashboard and scan the Whatsapp QR code with Yabi Events WhatsApp account.</p>

        <h3>Recommended Actions:</h3>
        <ul>
          <li>Check WhatsApp Web session status</li>
          <li>Verify network connectivity</li>
          <li>Review recent error logs</li>
          <li>Consider manual reconnection if needed</li>
        </ul>

        <p><em>This is an automated alert from the Yabi Events WhatsApp service.</em></p>
      `;

      // Send alert by mail
      await this.emailService.sendEmail(
        this.massFailureConfig.alertEmail,
        subject,
        message,
      );

      this.logger.warn(
        `${info} would be sent to ${this.massFailureConfig.alertEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send mass failure alert: ${error.message}`);
    }
  }

  private async sendQrCodeFailureAlert(info?: string): Promise<void> {
    if (this.alertSent) return;
    if (!info) info = 'Error saving WhatsApp Qr-Code alert';

    try {
      const subject =
        `🚨 Error saving WhatsApp Qr-Code alert - Yabi Events ` +
        new Date().toISOString();
      const message = `
        <h2>WhatsApp messaging service: ${info}</h2>
        <p>The system is unable to save WhatsApp AR-code to update database for scan.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Failed Messages:</strong> Error saving WhatsApp Qr-Code alert.</p>
        <p><strong>Time Window:</strong> Last ${this.massFailureConfig.timeWindowMinutes} minutes</p>
        <p><strong>Client Status:</strong> ${this.isReady ? 'Ready' : 'Not Ready'}</p>
        <p><strong>Queue Length:</strong> ${this.messageQueue.length}</p>
        <p><strong>Reconnection Attempts:</strong> ${this.reconnectAttempts}/${this.maxReconnectAttempts}</p>
        <p><strong>Action required:</strong> Restart the backend server to night.</p>

        <h3>Recommended Actions:</h3>
        <ul>
          <li>Check WhatsApp Web session status</li>
          <li>Verify network connectivity</li>
          <li>Review recent error logs</li>
          <li>Consider manual reconnection if needed</li>
        </ul>

        <p><em>This is an automated alert from the Yabi Events WhatsApp service.</em></p>
      `;

      // Send alert by mail
      await this.emailService.sendEmail(
        this.massFailureConfig.alertEmail,
        subject,
        message,
      );

      this.logger.warn(
        `${info} would be sent to ${this.massFailureConfig.alertEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send mass failure alert: ${error.message}`);
    }
  }

  private async sendQrNeedToScanAlert(info?: string): Promise<void> {
    if (this.alertSent) return;
    if (!info) info = 'WhatsApp Qr-Code Need to scan alert';

    try {
      const subject =
        `🚨 WhatsApp Qr-Code Need to scan alert - Yabi Events ` +
        new Date().toISOString();
      const message = `
        <h2>WhatsApp messaging service: ${info}</h2>
        <p>The system is unable to save WhatsApp AR-code to update database for scan.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Failed Messages:</strong> WhatsApp Qr-Code Need to scan alert.</p>
        <p><strong>Time Window:</strong> Last ${this.massFailureConfig.timeWindowMinutes} minutes</p>
        <p><strong>Client Status:</strong> ${this.isReady ? 'Ready' : 'Not Ready'}</p>
        <p><strong>Queue Length:</strong> ${this.messageQueue.length}</p>
        <p><strong>Reconnection Attempts:</strong> ${this.reconnectAttempts}/${this.maxReconnectAttempts}</p>

        <p><em>This is an automated alert from the Yabi Events WhatsApp service.</em></p>
      `;

      // Send alert by mail
      await this.emailService.sendEmail(
        this.massFailureConfig.alertEmail,
        subject,
        message,
      );

      this.logger.warn(
        `${info} would be sent to ${this.massFailureConfig.alertEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send mass failure alert: ${error.message}`);
    }
  }

  private async sendWhatsappConnectedNotification(
    info?: string,
  ): Promise<void> {
    if (this.alertSent) return;
    if (!info) info = '✅ ✅ WhatsApp Service is ready';

    try {
      const subject =
        `✅ ✅ WhatsApp Service is ready - Yabi Events ` +
        new Date().toISOString();
      const message = `
        <h2>WhatsApp messaging service: ${info}</h2>
        <p>The system is ready to send messages using Whatsapp service.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Time Window:</strong> Last ${this.massFailureConfig.timeWindowMinutes} minutes</p>
        <p><strong>Client Status:</strong> ${this.isReady ? 'Ready' : 'Not Ready'}</p>
        <p><strong>Queue Length:</strong> ${this.messageQueue.length}</p>
        <p><strong>Reconnection Attempts:</strong> ${this.reconnectAttempts}/${this.maxReconnectAttempts}</p>

        <p><em>This is an automated notification from the Yabi Events WhatsApp service.</em></p>
      `;

      await this.emailService.sendEmail(
        this.massFailureConfig.alertEmail,
        subject,
        message,
      );

      this.logger.debug(
        `${info} notification would be sent to ${this.massFailureConfig.alertEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send Whatsapp Connected Notification: ${error.message}`,
      );
    }
  }

  /**
   * Handles client disconnection with exponential backoff reconnection strategy.
   * Schedules reconnection attempts with increasing delays to avoid overwhelming the service.
   *
   * @private
   */
  private async handleDisconnect(): Promise<void> {
    console.log('handleDisconnect');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const message = `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection attempts.`;
      this.logger.error(message);
      this.updateQrStatus(false, message);
      this.isReady = false;
      this.sendConnexionFailureAlert(message);
      this.disconnect();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );

    this.logger.warn(
      `Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(async () => {
      this.logger.log(
        `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      );

      try {
        // if (this.client) await this.client.destroy();
        await this.initWhatsapp();
      } catch (error) {
        const message = `Reconnection attempt ${this.reconnectAttempts} failed: ${error.message}`;
        this.updateQrStatus(false, message);
        this.logger.error(message);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleDisconnect();
        }
      }
    }, delay);
  }

  private async updateQrStatus(
    status: boolean,
    message: string,
  ): Promise<void> {
    try {
      await this.qrModel.findOneAndUpdate(
        {},
        { status, message },
        { upsert: true, new: true },
      );
    } catch (err) {
      this.logger.error(`QR status update failed: ${err.message}`);
    }
  }

  /**
   * Starts periodic health monitoring to detect silent failures.
   * Checks client status every 60 seconds and triggers reconnection if needed.
   *
   * @private
   */
  private startHealthCheck(): void {
    console.log('startHealthCheack');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckDelay);

    this.logger.log(`Health check started (every ${this.healthCheckDelay}ms)`);
  }

  /**
   * Stops the periodic health monitoring.
   *
   * @private
   */
  private stopHealthCheck(): void {
    console.log('stopHealthCheck');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.logger.log('Health check stopped');
    }
  }

  /**
   * Performs a health check on the WhatsApp client.
   * Triggers reconnection if the client is not ready and max attempts not reached.
   *
   * @private
   */
  private async performHealthCheck(): Promise<void> {
    console.log('performHealthCheck');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    if (!this.isReady && this.reconnectAttempts < this.maxReconnectAttempts) {
      const message =
        'Health check: Client not ready - attempting reconnection';
      this.logger.warn(message);
      this.updateQrStatus(false, message);
      console.log('needToScan: ', this.needToScan);
      if (this.needToScan === false) this.handleDisconnect();
    } else if (this.isReady) {
      const message = 'Health check: Whatsapp Client is healthy';
      this.logger.debug(message);
      this.updateQrStatus(true, message);
      console.log('needToScan: ', this.needToScan);
      console.log('this.getQueueStatus(): ', this.getQueueStatus().queueLength);
      // if (this.getQueueStatus().queueLength > 1) {
      this.processQueueBatch();
      // }
    }
  }

  /**
   * Returns the current status of the message queue and client state.
   * Useful for monitoring and debugging purposes.
   *
   * @returns Object containing queue status, processing state, and connection information
   *
   * @example
   * ```typescript
   * const status = whatsappService.getQueueStatus();
   * console.log(status);
   * // Output: { queueLength: 5, isProcessing: true, isReady: true, reconnectAttempts: 0, maxReconnectAttempts: 10 }
   * ```
   */
  getQueueStatus(): any {
    console.log('getQueueStatus');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessingQueue,
      isReady: this.isReady,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  /**
   * Clears all messages from the queue.
   * Use with caution as this will permanently delete all pending messages.
   *
   * @returns Promise that resolves when the queue is cleared
   */
  async clearQueue(): Promise<void> {
    this.messageQueue = [];
    this.logger.log('Message queue cleared');
  }

  public async refreshQr() {
    console.log('refreshQr');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    this.setupEventHandlers();
    const qr = await this.getCurrentQr();
    qrcode.generate(qr, { small: true });
    return qr;
  }

  /**
   * Sends a formatted message with title, subtitle, content, and optional link.
   * Formats the message using WhatsApp's markdown syntax and emojis.
   *
   * @param to - Recipient phone number in international format
   * @param messageData - Object containing message components
   * @param messageData.title - Optional title (displayed in bold with 📢 emoji)
   * @param messageData.subtitle - Optional subtitle (displayed in bold with 🎵 emoji)
   * @param messageData.content - Optional main content text
   * @param messageData.link - Optional link (displayed with 🔗 emoji)
   * @returns Promise resolving to queue status information
   *
   * @example
   * ```typescript
   * await whatsappService.sendFormattedMessage('237612345678', {
   *   title: 'Event Update',
   *   subtitle: 'Concert Tonight',
   *   content: 'Don\'t forget the concert tonight! Doors open at 8 PM.',
   *   link: 'https://example.com/event/123'
   * });
   * ```
   */
  // async sendFormattedMessage(
  //   to: string,
  //   messageData: {
  //     title?: string;
  //     subtitle?: string;
  //     content?: string;
  //     link?: string;
  //   },
  // ): Promise<any> {
  //   // Build formatted message
  //   let formattedMessage = '';

  //   if (messageData.title) {
  //     formattedMessage += `📢 *${messageData.title}*\n\n`;
  //   }

  //   if (messageData.subtitle) {
  //     formattedMessage += `🎵 *${messageData.subtitle}*\n\n`;
  //   }

  //   if (messageData.content) {
  //     formattedMessage += `${messageData.content}\n\n`;
  //   }

  //   if (messageData.link) {
  //     formattedMessage += `🔗 *Event Link:*\n${messageData.link}`;
  //   }

  //   return this.sendMessage(to, formattedMessage);
  // }

  /**
   * Sends a welcome formatted message to user.
   * Formats the message using WhatsApp's markdown syntax and emojis.
   *
   * @param data - Recipient phone number in international format
   * @param isUser - True if data contain user data, false if data contain just userId (string)
   * @returns Promise resolving to queue status information
   *
   * @example
   * ```typescript
   * await whatsappService.welcomeMessage ('237612345678', {
   *   firstName: 'Tagne Bernard',
   *   language: 'en',
   *   ...
   * });
   * ```
   */
  async welcomeMessage(data: any, isUser: boolean) {
    const user = isUser ? data : await this.getUser(data);

    // Message construction
    const formattedMessage =
      user.language === 'fr'
        ? this.buildFrenchWelcomeMessage(user)
        : this.buildEnglishWelcomeMessage(user);

    return this.sendMessage(user.phone, formattedMessage, user.countryId.code);
  }

  async participateToEventMessage(userId, event) {
    const user = await this.getUser(userId);
    const formattedMessage =
      user.language === 'fr'
        ? this.buildFrenchEventMessage(user, event)
        : this.buildEnglishEventMessage(user, event);
    return this.sendMessage(user.phone, formattedMessage, user.countryId.code);
  }

  private async getUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).populate('countryId');
    if (!user) throw new NotFoundException('User not found');

    // Clean sensitive data
    user.password = '';
    user.resetPasswordToken = '';

    return user;
  }

  /**
   * Retrieves the current QR code from the database.
   * Useful for displaying the QR code in a web interface or API endpoint.
   *
   * @returns Promise resolving to the QR code string or null if not available
   *
   * @example
   * ```typescript
   * const qrCode = await whatsappService.getCurrentQr();
   * if (qrCode) {
   *   // Display QR code in web interface
   *   res.json({ qrCode });
   * }
   * ```
   */
  async getCurrentQr(): Promise<string | null> {
    console.log('getCurrentQr');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    try {
      const qrDoc = await this.qrModel.findOne({});
      return qrDoc?.qr || null;
    } catch (err) {
      this.logger.error('QR reading error in database : ' + err.message);
      return null;
    }
  }

  /**
   * Gracefully disconnects the WhatsApp session and cleans up resources.
   * Stops health monitoring, clears timeouts, and destroys the client.
   *
   * @returns Promise resolving to disconnect status information
   *
   * @example
   * ```typescript
   * const result = await whatsappService.disconnect();
   * console.log(result);
   * // Output: { status: true, message: 'WhatsApp session disconnected and client destroyed.' }
   * ```
   */
  async disconnect(): Promise<{ status: boolean; message: string }> {
    console.log('disconnect');
    console.log(
      'isReady: ',
      this.isReady,
      ' isPreocessing: ',
      this.isProcessingQueue,
    );
    // this.sendConnexionFailureAlert();
    this.stopHealthCheck();

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    let message = '';
    if (this.client) {
      await this.client.destroy();
      message =
        'health check stopped: WhatsApp session disconnected and client destroyed';
    } else {
      message = 'No current WhatsApp client to disconnect.';
    }
    this.isReady = false;
    this.needToScan = true;
    this.logger.warn(message);
    this.updateQrStatus(false, message);
    return {
      status: true,
      message,
    };
  }

  private buildFrenchWelcomeMessage(user: User): string {
    const userName = user.name || `${user.firstName} ${user.lastName}`;
    return (
      `Hello *${userName} !!*\n\n` +
      `Nous sommes ravis de vous accueillir sur *Yabi Events*\n` +
      `Votre solution intelligente tout-en-un pour la gestion d'événements.\n\n` +
      `🔗 _Rendez-vous sur_ :\n${this.frontUrl}` +
      `\n\n\n> Ceci est un message automatique du service WhatsApp de Yabi Events.`
    );
  }

  private buildEnglishWelcomeMessage(user: User): string {
    const userName = user.name || `${user.firstName} ${user.lastName}`;
    return (
      `Hello *${userName} !!*\n\n` +
      `We are thrilled to welcome you to *Yabi Events*\n` +
      `Your smart all-in-one solution for event management.\n\n` +
      `🔗 _Visit us at:_\n${this.frontUrl}` +
      `\n\n\n> This is an automatic message from the Yabi Events WhatsApp service.`
    );
  }

  private buildFrenchEventMessage(user: User, event: any): string {
    const userName = user.name || `${user.firstName} ${user.lastName}`;
    return (
      `*Votre place est assurée !*\n\n` +
      `Hello ${userName}\n` +
      `Nous avons réservé votre place pour *${event.event_title}*\n` +
      `* Début : ${event.event_start}\n` +
      `* Fin : ${event.event_end}\n` +
      `* Lieu : ${event.event_country}, ${event.event_city},\n` +
      `${event.event_location}\n\n` +
      `🔗 _A propos de l'event :_ ${event.event_url}` +
      `\n\n\n> Ceci est un message automatique du service WhatsApp de Yabi Events.`
    );
  }

  private buildEnglishEventMessage(user: User, event: any): string {
    const userName = user.name || `${user.firstName} ${user.lastName}`;
    return (
      `*Your seat is reserved !*\n\n` +
      `Hello ${userName}\n` +
      `We have reserved your seat for *${event.event_title}*\n` +
      `* Start : ${event.event_start}\n` +
      `* End : ${event.event_end}\n` +
      `* Location : ${event.event_country}, ${event.event_city},\n` +
      `${event.event_location}\n\n` +
      `🔗 _About event :_ ${event.event_url}` +
      `\n\n\n> This is an automatic message from the Yabi Events WhatsApp service.`
    );
  }
}
