/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.schema';

@Controller('transaction')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get()
  async getAllTransactoins(
    @Query() query: ExpressQuery,
  ): Promise<Transaction[]> {
    return this.transactionService.findAll(query);
  }

  /**
   * Get a specific transaction by ID.
   * @param transactionId - The ID of the transaction to retrieve.
   * @returns The transaction details.
   */
  @Get(':id')
  async getTransaction(@Param('id') transactionId: string): Promise<any> {
    return this.transactionService.findById(transactionId);
  }

  /**
   * Create a new transaction.
   * @param transaction - The transaction data to create.
   * @param req - The request object containing the authenticated user.
   * @param files - The uploaded files (e.g., transaction cover image).
   * @returns The created transaction.
   */
  @Post('new')
  @UseGuards(AuthGuard('jwt')) // Protect the route with authentication
  @UsePipes(ValidationPipe) // Validate the incoming data
  async processPayment(@Body() transactionData: any, @Req() req): Promise<any> {
    return this.transactionService.processPayment(transactionData, req.user);
  }

  /**
   * Delete an transaction by ID.
   * @param transactionId - The ID of the transaction to delete.
   * @returns The result of the deletion operation.
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') transactionId: string, @Req() req): Promise<any> {
    if (!req.user.isAdmin) throw new BadRequestException('Unauthorised !');
    return this.transactionService.deleteTransaction(transactionId);
  }

  /**
   * Get the list of transactions for a specific user.
   * @param transactionId - The ID of the transaction.
   * @returns A list of participants.
   */
  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'))
  async getParticipantsList(
    @Param('id') userId: string,
    @Query() query: ExpressQuery,
  ): Promise<any> {
    return this.transactionService.getTransactionsListOfUser(userId, query);
  }

  //////////////////////////////////////////////
  @Get('*path')
  getRedirect(@Res() res: Response) {
    return res.redirect('https://yabi.cm');
  }

  @Post('*path')
  postRedirect(@Res() res: Response) {
    return res.redirect('https://yabi.cm');
  }

  @Put('*path')
  putRedirect(@Res() res: Response) {
    return res.redirect('https://yabi.cm');
  }

  @Delete('*path')
  deleteRedirect(@Res() res: Response) {
    return res.redirect('https://yabi.cm');
  }
}
