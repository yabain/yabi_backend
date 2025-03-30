/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReqStatus } from './transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './transaction.schema';
import * as mongoose from 'mongoose';
import { User } from 'src/user/user.schema';
import { Query } from 'express-serve-static-core';
import { CreateTransactionDto } from './create-transaction.dto';
import { catchError, firstValueFrom, Observable, tap, throwError } from 'rxjs';
import { TicketService } from 'src/ticket/ticket.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: mongoose.Model<Transaction>,
    private httpService: HttpService,
    private configService: ConfigService,
    private ticketService: TicketService,
  ) {}

  async findAll(query: Query): Promise<Transaction[]> {
    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const transactions = await this.transactionModel
      .find({ ...keyword, type: 'public' })
      .limit(resPerPage)
      .skip(skip);
    return transactions;
  }

  async findById(transactionId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Invalid event ID');
    }

    // Find the transaction and populate related data (user and event)
    const transaction: any = await this.transactionModel
      .findById(transactionId)
      .populate('usereId')
      .populate('eventId');
    if (!transaction) {
      throw new NotFoundException('Event not found');
    }
    return transaction;
  }

  async getTransactionsListOfUser(
    userId: any,
    query: Query,
  ): Promise<Transaction[]> {
    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const transactions = await this.transactionModel
      .find({ ...keyword, userId })
      .limit(resPerPage)
      .skip(skip);
    return transactions;
  }

  async processPayment(paymentData: any, userData: User): Promise<any> {
    try {
      const depositEndPoint = `${this.configService.get<string>('PAYMENT_GATWAY')}/payment/pay`;
      const depositData = {
        amount: paymentData.paymentWithTaxes,
        type: 'deposit',
        paymentMode: 'ORANGE',
        moneyCode: 'XAF',
        userRef: {
          fullName: paymentData.userName,
          account: `${paymentData.paymentMethodeNumber}`,
        },
        raison: 'Ticket - Yabi Events',
        appID: this.configService.get<string>('PAYMENT_GATWAY_KEY'),
      };

      const response = await firstValueFrom(
        this.httpService.post(depositEndPoint, depositData, {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYMENT_GATWAY_KEY')}`,
          },
        }),
      );

      const transaction = this.dataParser(paymentData, response.data, userData);

      return this.handleRequest(transaction, userData);
    } catch (error) {
      console.error(
        'Payment processing error:',
        error.response?.data || error.message,
      );

      const transaction = this.dataParser(
        paymentData,
        error.response?.data || {},
        userData,
      );
      await this.handleTransactionStateError(transaction);

      return {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.message || 'Payment processing failed',
      };
    }
  }

  private async handleRequest(transactionData, userData): Promise<any> {
    console.log('handleRequest: ', transactionData);
    if (transactionData.reqStatus === ReqStatus.SUCCESS) {
      console.log('SUCCESS: ', ReqStatus.SUCCESS);
      return this.handleTransactionStateSuccess(transactionData, userData);
    } else if (transactionData.reqStatus === ReqStatus.PENDING) {
      console.log('PENDING: ', ReqStatus.PENDING);
      return this.handleTransactionStatePending(transactionData, userData);
    } else if (transactionData.reqStatus === ReqStatus.ERROR) {
      console.log('ERROR: ', ReqStatus.ERROR);
      return this.handleTransactionStateError(transactionData);
    } else
      return {
        success: false,
        statusCode: 501,
        message: 'Unknow error',
      };
  }

  private async handleTransactionStateSuccess(transactionData, userData) {
    const transaction = await this.ticketService.createMultipleTicket(
      transactionData.tickets,
      userData,
    );
    if (!transaction) throw new NotFoundException('Error');
    return await this.updateTransaction(transactionData._id, {
      reqStatus: ReqStatus.SUCCESS,
      message: transactionData.message ? transactionData.message : '',
      reqErrorCode: transactionData.reqErrorCode
        ? transactionData.reqErrorCode
        : '',
    });
  }

  private async handleTransactionStatePending(
    transactionData,
    userData,
  ): Promise<any> {
    if (transactionData._id) {
      const transaction = await this.findById(transactionData._id);
      if (transaction) {
        return await this.updateTransaction(transactionData._id, {
          reqStatus: ReqStatus.PENDING,
          message: transactionData.message ? transactionData.message : '',
          reqErrorCode: transactionData.reqErrorCode
            ? transactionData.reqErrorCode
            : '',
        });
      } else throw new NotFoundException('Transaction not found');
    } else {
      setTimeout(() => {
        this.checkTransaction(transactionData, userData);
      }, 5000);
      return await this.createTransaction(transactionData);
    }
  }

  private async handleTransactionStateError(transactionData): Promise<any> {
    if (transactionData._id) {
      const transaction = await this.findById(transactionData._id);
      if (transaction) {
        return await this.updateTransaction(transactionData._id, {
          reqStatus: ReqStatus.ERROR,
          message: transactionData.message ? transactionData.message : '',
          reqErrorCode: transactionData.reqErrorCode
            ? transactionData.reqErrorCode
            : '',
        });
      } else throw new NotFoundException('Transaction not found');
    }
    return await this.createTransaction(transactionData);
  }

  private async createTransaction(
    transactionData: CreateTransactionDto,
  ): Promise<any> {
    return await this.transactionModel.create(transactionData);
  }

  checkTransaction(transactionData: any, userData): Observable<any> {
    console.log('transactionData: ', transactionData.token);
    const checkDepositEndPoint =
      this.configService.get<string>('PAYMENT_GATWAY') +
      '/payment/check/' +
      transactionData.token;

    return this.httpService.get<any>(checkDepositEndPoint).pipe(
      tap((response: any) => {
        if (response.statusCode === 200) {
          if (response.data.state === ReqStatus.SUCCESS)
            this.handleTransactionStateSuccess(
              this.dataParser(transactionData, response, userData),
              userData,
            );
        }
        return response;
      }),
      catchError((error) => {
        return throwError(error);
      }),
    );
  }

  //   chekStatus(res: any, userId: string, invoiceData) {
  //     const updateInvoiceStatus = (status: string, errorMsg?: string) => {
  //       invoiceData.status = status;
  //       if (errorMsg) {
  //         invoiceData.statusErrorMsg = errorMsg;
  //       }
  //     };

  //     switch (res.data.state) {
  //       case 'financial_transaction_pending':
  //         invoiceData.status = 'Pending';
  //         setTimeout(() => {
  //           this.checkTransactionStatus(invoiceData.ref.token).subscribe(
  //             (data) => {
  //               if (data.data.state === 'financial_transaction_success') {
  //                 updateInvoiceStatus('Completed');
  //               }
  //               this.chekStatus(data, userId, invoiceData);
  //             },
  //           );
  //         }, 3000);
  //         break;

  //       case 'financial_transaction_success':
  //         updateInvoiceStatus('Completed');
  //         break;

  //       case 'financial_transaction_error':
  //         const errorMessages: { [key: number]: string } = {
  //           '-201': 'Payer account not found',
  //           '-202': 'Receiver account not found',
  //           '-200': 'Unknown error',
  //           '-204': 'The balance of the payer account is insufficient',
  //           '-205': 'Payment method not found',
  //           '-206': 'Invalid amount',
  //           '-207': 'Waiting for a long time error',
  //           '-208': 'Payment rejected by the payer',
  //         };
  //         const errorMsg = errorMessages[res.data.error] || 'Unknown code error';
  //         updateInvoiceStatus('Rejected', errorMsg);
  //         break;

  //       default:
  //         console.warn('Unexpected transaction state:', res.data.state);
  //     }
  //   }

  //   getTransactionData(
  //     userId: string,
  //     eventId: string,
  //     invoiceId: string,
  //   ): Observable<any> {

  //   }

  dataParser(transactionData: any, responseData: any, userData: any) {
    if (responseData.data.statusCode === 401)
      responseData.data.message = 'Unauthorised request';
    else if (responseData.data.statusCode === 404)
      responseData.data.message = 'APP id not found';
    else if (responseData.data.statusCode > 500)
      responseData.data.message = 'Internal server error';
    else
      responseData.data.message =
        responseData.data.error != 0
          ? this.interprateErrorCode(Number(responseData.data.error))
          : ''; // Deduced from the response code

    return {
      invoiceRef: this.generateRef(),
      payment: transactionData.payment,
      paymentMethod: transactionData.paymentMethod,
      paymentMethodNumber: transactionData.paymentMethodNumber,
      paymentWithTaxes: transactionData.paymentWithTaxes, // as 'amount' in payment API req/re
      reqStatus: responseData.data.state
        ? responseData.data.state
        : ReqStatus.ERROR, // as data.state in payment API res
      taxes: transactionData.taxes,
      taxesAmount: transactionData.taxesAmount,
      tickets: transactionData.tickets,
      usereId: userData._id,
      usereEmail: userData.email,
      userName: transactionData.userName,
      userPhone: userData.phone,
      type: transactionData.type,
      moneyCode: transactionData.moneyCode, // as data.moneyCode in payment API req/res
      titled: responseData.data.raison
        ? responseData.data.raison
        : 'Ticket - Yabi Events', // as data.raison in payment API req/res
      paymentMode: transactionData.paymentMethode, // In payment API req/res
      token: responseData.data.token ? responseData.data.token : '', // In payment API res
      ref: responseData.data.ref ? responseData.data.ref : '', // In payment API res
      message: responseData.data.message ? responseData.data.message : '',
      reqStatusCode: responseData.statusCode, // as statusCode in payment API res
      reqErrorCode: responseData.data.error ? responseData.data.error : '', // data.error in payment API res
    };
  }

  generateRef(): string {
    const now = new Date();

    // Generate the components of the date and time
    const year = now.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = this.padNumber(now.getMonth() + 1, 2); // Months are zero-based, hence the +1
    const day = this.padNumber(now.getDate(), 2);
    const hours = this.padNumber(now.getHours(), 2);
    const minutes = this.padNumber(now.getMinutes(), 2);
    const seconds = this.padNumber(now.getSeconds(), 2);

    // Generate a random number between 100 and 999
    const randomNum = Math.floor(Math.random() * 900) + 100;

    // Construct the ID
    const id = `IN${randomNum}#${year}${month}${day}${hours}${minutes}${seconds}`;

    return id;
  }

  // Helper function to pad numbers with leading zeros
  private padNumber(num: number, size: number): string {
    let s = num.toString();
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
  }

  private interprateErrorCode(errorCode: number) {
    const errorMessages: { [key: number]: string } = {
      '-201': 'Payer account not found',
      '-202': 'Receiver account not found',
      '-200': 'Unknown error',
      '-204': 'The balance of the payer account is insufficient',
      '-205': 'Payment method not found',
      '-206': 'Invalid amount',
      '-207': 'Waiting for a long time error',
      '-208': 'Payment rejected by the payer',
    };
    return errorMessages[errorCode] || 'Unknown code error';
  }

  async deleteTransaction(transactionId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Invalid transaction ID');
    }
    return await this.transactionModel.findByIdAndDelete(transactionId);
  }

  async updateTransaction(
    transactionId: string,
    transactionData: any,
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel.findByIdAndUpdate(
      transactionId,
      transactionData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!transaction) throw new NotFoundException('Invalid transaction ID');

    return transaction;
  }
}
