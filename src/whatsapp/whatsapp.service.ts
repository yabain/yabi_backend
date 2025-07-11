/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsappQr } from './whatsapp-qr.schema';
import { ConfigService } from '@nestjs/config';
import * as qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private isReady = false;
  private reconnectAttempts: number = 0;
  private healthCheckInterval: NodeJS.Timeout;
  frontUrl: any = '';

  constructor(
    @InjectModel(WhatsappQr.name)
    private readonly qrModel: Model<WhatsappQr>,
    private readonly configService: ConfigService,
  ) {
    this.frontUrl = this.configService.get<string>('FRONT_URL')
      ? this.configService.get<string>('FRONT_URL')
      : 'https://yabi.cm';
  }

  onModuleInit() {
    // Start WhatsApp initialization in the background, without waiting
    this.initWhatsapp().catch((err) => {
      this.logger.error(
        'Error during WhatsApp init (non-blocking) : ' + err.message,
      );
    });
  }

  private formatChatId(phone: string): string {
    return phone.replace(/\D/g, '') + '@c.us';
  }

  private async initWhatsapp() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath:
          this.configService.get<string>('WHATSAPP_SESSION_PATH') ||
          './assets/sessions/whatsapp',
      }),
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
          '--single-process',
        ],
      },
    });

    this.setupEventHandlers();
    await this.client.initialize();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  private setupEventHandlers() {
    this.client.on('qr', async (qr) => this.handleQrCode(qr));
    this.client.on('ready', () => this.handleReady());
    this.client.on('auth_failure', (msg) => this.handleAuthFailure(msg));
    this.client.on('disconnected', (reason) => this.handleDisconnect(reason));
  }

  async handleQrCode(qr) {
    this.logger.warn(
      'Received QR code for WhatsApp Web. Scan it with your phone. :',
    );
    this.logger.warn(qr);
    qrcode.generate(qr, { small: true });
    try {
      await this.qrModel.findOneAndUpdate(
        {},
        { qr },
        { upsert: true, new: true },
      );
    } catch (err) {
      this.logger.error('QR backup error in database : ' + err.message);
    }
  }

  handleReady() {
    this.isReady = true;
    this.logger.log('WhatsApp client ready !');
  }

  handleAuthFailure(msg) {
    this.logger.error('WhatsApp authentication failure : ' + msg);
  }

  private async handleDisconnect(reason: string) {
    this.isReady = false;
    this.logger.warn(`Disconnected: ${reason}`);

    // Cleaning ressources
    try {
      if (this.client) {
        await this.client.destroy();
      }
    } catch (e) {
      this.logger.error(`Cleanup error: ${e.message}`);
    }

    // Reinitialisation with exponentiel backoff
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts++;

    setTimeout(() => {
      this.initWhatsapp().catch((err) => {
        this.logger.error(`Reconnect attempt failed: ${err.message}`);
      });
    }, delay);
  }

  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      if (!this.isReady) {
        this.logger.warn('WhatsApp client is not ready - attempting recovery');
        this.initWhatsapp().catch((err) => {
          this.logger.error(`Recovery attempt failed: ${err.message}`);
        });
      }
    }, 60000); // Vérification toutes les minutes
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  getClient(): Client | null {
    return this.isReady ? this.client : null;
  }

  async sendMessage(to: string, message: string): Promise<any> {
    if (!this.isReady) {
      this.logger.error('WhatsApp client is not ready.');
      throw new Error('WhatsApp client is not ready.');
    }
    const chatId = this.formatChatId(to);
    try {
      const response = await this.client.sendMessage(chatId, message);
      this.sendFormattedMessage(to, {
        title: 'Nouvel événement',
        subtitle: 'Concert de jazz',
        content:
          'Venez assister à un magnifique concert de jazz ce samedi soir.',
        link: 'https://app.yabi.cm/event_data/6854371b376fb9fe2dcdec19',
      });
      this.logger.log(`Message sent to ${to}`);
      return response;
    } catch (error) {
      this.logger.error(`WhatsApp-web.js sending error: ${error.message}`);
      if (error.message.includes('Session closed')) {
        return this.initWhatsapp().catch((err) => {
          this.logger.error(
            'Error during WhatsApp init (non-blocking) : ' + err.message,
          );
          throw error;
        });
      } else throw error;
    }
  }

  async sendMsg(phone: string, message, code?: string) {
    if (!code) code = '237';
    if (!this.isReady) {
      this.logger.error('WhatsApp client is not ready.');
      throw new Error('WhatsApp client is not ready.');
    }

    phone = this.formatChatId(phone);
    // if (code === '237' && phone.startWith(9)) {
    //   phone = '6' + phone;
    // }
    const response = await this.client.sendMessage(code + phone, message);
    return response;
  }

  async sendFormattedMessage(
    to: string,
    messageData: {
      title?: string;
      subtitle?: string;
      content?: string;
      link?: string;
    },
  ): Promise<any> {
    if (!this.isReady) {
      this.logger.error('WhatsApp client is not ready.');
      throw new Error('WhatsApp client is not ready.');
    }

    const chatId = this.formatChatId(to);

    // Message construction
    let formattedMessage = '';

    if (messageData.title) {
      formattedMessage += `📢 *${messageData.title}*\n\n`;
    }

    if (messageData.subtitle) {
      formattedMessage += `🎵 *${messageData.subtitle}*\n\n`; // italiqc
    }

    if (messageData.content) {
      formattedMessage += `${messageData.content}\n\n`; // normal
    }

    if (messageData.link) {
      formattedMessage += `🔗 *Lien de l'événement :*\n${messageData.link}`; // Link (metatag)
    }

    try {
      // const response = await this.client.sendMessage(chatId, formattedMessage);
      // this.logger.log(`Formatted message sent to ${to}`);
      return this.sendMsg(chatId, formattedMessage);
    } catch (error) {
      this.logger.error(`WhatsApp-web.js sending error: ${error.message}`);
      throw error;
    }
  }

  async getCurrentQr(): Promise<string | null> {
    try {
      const qrDoc = await this.qrModel.findOne({});
      return qrDoc?.qr || null;
    } catch (err) {
      this.logger.error('QR reading error in database : ' + err.message);
      return null;
    }
  }

  /**
   * Disconnects the WhatsApp session and destroys the client.
   */
  async disconnect(): Promise<any> {
    if (this.client) {
      await this.client.destroy();
      const message: string =
        'WhatsApp session disconnected and client destroyed.';
      this.isReady = false;
      this.logger.warn(message);
      return {
        status: true,
        message,
      };
    } else {
      const message: string = 'No current WhatsApp client to disconnect.';
      this.logger.warn(message);
      return {
        status: true,
        message,
      };
    }
  }

  private logMessageSending(to: string, message: string) {
    const shortMessage =
      message.length > 50 ? `${message.substring(0, 50)}...` : message;

    this.logger.log(`Sending to ${to}: ${shortMessage.replace(/\n/g, ' ')}`);
  }

  welcomeMessage(user) {
    // Message construction
    let formattedMessage = '';
    if (user.language === 'fr') {
      formattedMessage += `Hello *${user.firstName} !!*\n\n`;
      formattedMessage += `Nous sommes ravis de vous accueillir sur *Yabi Events*\n`;
      formattedMessage += `Votre solution tout-en-un pour la gestion d’événements.`;
      formattedMessage += `Grâce à notre plateforme, vous pouvez facilement créer,
                                    organiser et gérer vos événements, tout en offrant une expérience
                                    fluide à vos participants.`;
      formattedMessage += `🔗 _Rendez-vous sur :_ \n${this.frontUrl}`;
    } else {
      formattedMessage += `Hello *${user.firstName} !!*\n\n`;
      formattedMessage += `We are thrilled to welcome you to *Yabi Events*\n`;
      formattedMessage += `Your all-in-one solution for event management.`;
      formattedMessage += `With our platform, you can easily create,
                                    organize and manage your events, while offering a seamless experience
                                    for your attendees.`;
      formattedMessage += `🔗 _Visit us at:_ \n${this.frontUrl}`;
    }

    return formattedMessage;
  }

  participateToEventMessage(userName, language, event) {
    // Message construction
    let formattedMessage = '';
    if (language === 'fr') {
      formattedMessage += `*Votre place est assurée !*\n\n`;
      formattedMessage += `Hello ${userName}\n`;
      formattedMessage += `Nous avons réservé votre place pour *${event.event_title}*\n`;
      formattedMessage += `Début : ${event.event_start}\n`;
      formattedMessage += `Fin : ${event.event_end}\n`;
      formattedMessage += `Lieu : ${event.event_country}, ${event.event_city},\n`;
      formattedMessage += `${event.event_location}\n\n`;
      formattedMessage += `🔗 _A propos de l'event :_ ${event.event_url}`;
    } else {
      formattedMessage += `*Your seat is reserved !*\n\n`;
      formattedMessage += `Hello ${userName}\n`;
      formattedMessage += `We have reserved your seat for *${event.event_title}*\n`;
      formattedMessage += `Start : ${event.event_start}\n`;
      formattedMessage += `End : ${event.event_end}\n`;
      formattedMessage += `Location : ${event.event_country}, ${event.event_city},\n`;
      formattedMessage += `${event.event_location}\n\n`;
      formattedMessage += `🔗 _About event :_ ${event.event_url}`;
    }
    return formattedMessage;
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.disconnect();
  }
}
