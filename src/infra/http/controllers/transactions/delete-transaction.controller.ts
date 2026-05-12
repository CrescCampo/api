import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import DeleteTransaction from 'domain/application/use-cases/transactions/delete-transaction';
import DeleteTransactionResponseDTO from 'infra/dtos/transactions/DeleteTransactionResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('transactions')
@ApiTags('Transactions')
export default class DeleteTransactionController {
  constructor(private readonly deleteTransaction: DeleteTransaction) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiOkResponse({
    description: 'Transaction deleted successfully',
    type: DeleteTransactionResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.deleteTransaction.execute({
      userId: req.user.id,
      transactionId: id,
    });
  }
}
