/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusRef } from './transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './transaction.schema';
import * as mongoose from 'mongoose';
import { User } from 'src/user/user.schema';
import { Query } from 'express-serve-static-core';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: mongoose.Model<Transaction>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async processPayment(paymentData: any, userData: User): Promise<any> {
    try {
      const depositEndPoint =
        this.configService.get<string>('PAYMENT_GATWAY') + '/payment/pay';
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

      this.httpService
        .post(depositEndPoint, depositData, {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYMENT_GATWAY_KEY')}`,
          },
        })
        .subscribe((response: any) => {
          if (response.statusCode === 201) {
            return this.handleRequest(response, paymentData, userData);
          } else
            return this.handleTransactionStateError(
              response,
              paymentData,
              userData,
            );
        });
    } catch (error) {
      console.error(
        'Payment processing error:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        statusCode: error.statusCode,
        message: error.message || 'Payment processing failed',
      };
    }
  }

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

  private handleRequest(paymentData: any, response: any, userData: User) {
    if (response.data.state === StatusRef.SUCCESS) {
      return this.handleTransactionStateSuccess(
        response,
        paymentData,
        userData,
      );
    } else if (response.data.state === StatusRef.PENDING) {
      return this.handleTransactionStatePending(
        response,
        paymentData,
        userData,
      );
    } else if (response.data.state === StatusRef.ERROR) {
      return this.handleTransactionStateError(response, paymentData, userData);
    } else return false;
  }

  private handleTransactionStateSuccess(response, transactionData, userData) {
    transactionData.ref = {
      ref: response.data.ref,
      token: response.data.token,
    };

    if (response.data.state === 'financial_transaction_pending') {
      // Save transaction data
    } else if (response.data.state === 'financial_transaction_error') {
      // Gestion des erreurs spécifiques de la transaction
      // this.handleTransactionStateError(response.data);
    } else {
      return false;
    }
    return {
      success: response.data.success,
      transactionRef: response.data.ref,
      token: response.data.token,
      message: response.data.message,
      status: response.data.state,
    };
  }

  private handleTransactionStatePending(
    transactionData: any,
    responseData: any,
    userData: User,
  ) {
    transactionData.ref = {
      ref: responseData.data.ref,
      token: responseData.data.token,
    };

    const transaction = this.dataParser(
      transactionData,
      responseData,
      userData,
    );
  }

  private handleTransactionStateError(
    errorData: any,
    paymentData: any,
    userData: User,
  ) {}

  private interprateErrorCode(errorData: any) {
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
    return errorMessages[errorData.error] || 'Unknown code error';
  }

  //   checkTransactionStatus(
  //     paymentRef: string,
  //     invoiceId?: string,
  //   ): Observable<any> {
  //     // console.log('paymentRef: ', paymentRef);
  //     const checkDepositEndPoint =
  //       environment.apiUrl + '/payment/check/' + paymentRef;

  //     return this.http.get<any>(checkDepositEndPoint).pipe(
  //       tap((response) => {
  //         return response;
  //       }),
  //       catchError((error) => {
  //         return throwError(error);
  //       }),
  //     );
  //   }

  // Helper function to pad numbers with leading zeros
  private padNumber(num: number, size: number): string {
    let s = num.toString();
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
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
    return {
      invoiceRef: this.generateRef(),
      payment: transactionData.payment,
      paymentMethod: transactionData.paymentMethod,
      paymentMethodNumber: transactionData.paymentMethodNumber,
      paymentWithTaxes: transactionData.paymentWithTaxes, // as 'amount' in payment API req/re
      StatusRef: responseData.state, // as 'state' in payment API res
      taxes: transactionData.taxes,
      taxesAmount: transactionData.taxesAmount,
      tickets: transactionData.tickets,
      usereId: userData._id,
      usereEmail: userData.email,
      userName: transactionData.userName,
      userPhone: userData.phone,
      type: transactionData.type,
      moneyCode: transactionData.moneyCode, // as 'moneyCode' in payment API req/res
      titled: responseData.raison, // as 'raison' in payment API req/res
      paymentMode: transactionData.paymentMethode, // In payment API req/res
      token: responseData.token ? responseData.token : '', // In payment API res
      ref: responseData.ref, // In payment API res
      message:
        responseData.error != 0 ? this.interprateErrorCode(responseData) : '', // Deduced from the response code
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

  async deleteTransaction(transactionId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Invalid transaction ID');
    }
    return await this.transactionModel.findByIdAndDelete(transactionId);
  }
}
