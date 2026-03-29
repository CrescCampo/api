import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import config from 'infra/config';

const MODEL = 'gpt-4o-mini';

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description:
        'Registra um lançamento financeiro (receita ou despesa) em uma safra',
      parameters: {
        type: 'object',
        properties: {
          harvestId: { type: 'string', description: 'ID da safra' },
          categoryId: {
            type: 'string',
            description: 'ID da categoria de lançamento',
          },
          type: {
            type: 'string',
            enum: ['revenue', 'expense'],
            description: 'Tipo: revenue (receita) ou expense (despesa)',
          },
          amount: {
            type: 'number',
            description: 'Valor em reais (ex: 200.50)',
          },
          description: {
            type: 'string',
            description: 'Descrição do lançamento',
          },
          date: {
            type: 'string',
            description:
              'Data no formato YYYY-MM-DD. Se não informada, usa a data de hoje.',
          },
        },
        required: ['harvestId', 'categoryId', 'type', 'amount', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_harvests',
      description:
        'Lista as safras ativas da fazenda do agricultor com seus IDs',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description:
        'Lista as categorias de lançamento cadastradas na fazenda com seus IDs',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profit_report',
      description:
        'Retorna o lucro total da fazenda (receitas menos despesas de todas as safras)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_harvest_expenses',
      description: 'Retorna os gastos totais de uma safra específica',
      parameters: {
        type: 'object',
        properties: {
          harvestId: { type: 'string', description: 'ID da safra' },
        },
        required: ['harvestId'],
      },
    },
  },
];

@Injectable()
export default class WaLlmService {
  private readonly logger = new Logger(WaLlmService.name);

  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
  }

  async process(params: {
    systemPrompt: string;
    history: ChatCompletionMessageParam[];
    userMessage: string;
  }): Promise<ChatCompletion> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: params.systemPrompt },
      ...params.history,
      { role: 'user', content: params.userMessage },
    ];

    return this.call(messages);
  }

  async continueWithToolResults(
    messages: ChatCompletionMessageParam[],
  ): Promise<ChatCompletion> {
    return this.call(messages);
  }

  private async call(
    messages: ChatCompletionMessageParam[],
  ): Promise<ChatCompletion> {
    this.logger.debug(`Calling OpenAI with ${messages.length} messages`);

    return this.openai.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      temperature: 0.3,
    });
  }
}
