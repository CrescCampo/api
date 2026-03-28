import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import EditTransaction from 'domain/application/use-cases/transactions/edit-transaction';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

class EditTransactionBodyDTO {
  @ApiProperty({
    enum: TransactionType,
    required: false,
    example: TransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    type: String,
    required: false,
    example: 'Seeds purchase',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: Number,
    required: false,
    example: 150.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({
    type: String,
    required: false,
    example: 'category-uuid',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    type: Number,
    required: false,
    example: 1715270400000,
    description: 'Timestamp in milliseconds',
  })
  @IsOptional()
  @IsNumber()
  date?: number;
}

class EditTransactionResponseDTO {
  @ApiProperty({
    type: String,
    example: 'transaction-uuid',
  })
  transactionId: string;
}

@Controller('transactions')
@ApiTags('Transactions')
export default class EditTransactionController {
  constructor(private readonly editTransaction: EditTransaction) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Edit a transaction' })
  @ApiBody({ type: EditTransactionBodyDTO })
  @ApiOkResponse({
    description: 'Transaction updated successfully',
    type: EditTransactionResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Param('id') id: string,
    @Body() body: EditTransactionBodyDTO,
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
