import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import EditTransaction from 'domain/application/use-cases/transactions/edit-transaction';
import EditTransactionRequestDTO from 'infra/dtos/transactions/EditTransactionRequestDTO';
import EditTransactionResponseDTO from 'infra/dtos/transactions/EditTransactionResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('transactions')
@ApiTags('Transactions')
export default class EditTransactionController {
  constructor(private readonly editTransaction: EditTransaction) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Edit a transaction' })
  @ApiBody({ type: EditTransactionRequestDTO })
  @ApiOkResponse({
    description: 'Transaction updated successfully',
    type: EditTransactionResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Param('id') id: string,
    @Body() body: EditTransactionRequestDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.editTransaction.execute({
      userId: req.user.id,
      transactionId: id,
      type: body.type,
      description: body.description,
      amount: body.amount,
      categoryId: body.categoryId,
      date: body.date ? new Date(body.date) : undefined,
    });
  }
}
