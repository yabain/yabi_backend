/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsappQr } from './whatsapp-qr.schema';
import * as qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private isReady = false;

  constructor(
    @InjectModel(WhatsappQr.name)
    private readonly qrModel: Model<WhatsappQr>,
  ) {}

  onModuleInit() {
    // Start WhatsApp initialization in the background, without waiting
    this.initWhatsapp().catch((err) => {
      this.logger.error(
        'Error during WhatsApp init (non-blocking) : ' + err.message,
      );
    });
  }

  private async initWhatsapp() {
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
        ],
      },
    });

    this.client.on('qr', async (qr) => {
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
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('WhatsApp client ready !');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error('WhatsApp authentication failure : ' + msg);
    });

    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.logger.warn('WhatsApp client disconnected : ' + reason);
    });

    try {
      await this.client.initialize();
    } catch (err) {
      this.logger.error('Error initializing WhatsApp client : ' + err.message);
    }
  }

  async sendMessage(to: string, message: string): Promise<any> {
    if (!this.isReady) {
      this.logger.error('WhatsApp client is not ready.');
      throw new Error('WhatsApp client is not ready.');
    }
    const chatId = to.replace(/\D/g, '') + '@c.us';
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
      throw error;
    }
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

    const chatId = to.replace(/\D/g, '') + '@c.us';

    // Message construction
    let formattedMessage = '';

    if (messageData.title) {
      formattedMessage += `📢 *${messageData.title}*\n\n`; // gras
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
      const response = await this.client.sendMessage(chatId, formattedMessage);
      this.logger.log(`Formatted message sent to ${to}`);
      return response;
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
}
