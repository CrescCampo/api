import { Injectable, Logger } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import config from 'infra/config';

const MODEL = 'gpt-4o-mini';
const TRANSCRIPTION_MODEL = 'whisper-1';

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description:
        'Registra um lançamento financeiro (receita ou despesa) em uma safra. Esta é a ÚNICA forma de registrar um lançamento: nunca diga que registrou algo sem ter chamado esta tool e recebido success: true.',
      parameters: {
        type: 'object',
        properties: {
          harvestId: {
            type: 'string',
            description:
              'ID interno da safra, obtido via list_harvests. Nunca pedir ao usuário nem inventar.',
          },
          categoryId: {
            type: 'string',
            description:
              'ID interno da categoria, obtido via list_categories. Nunca pedir ao usuário nem inventar.',
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
        'Lista as safras ativas da fazenda (id interno, nome e cultura). Use SEMPRE que precisar saber quais safras existem, quantas são, ou para resolver o nome citado pelo usuário para o id interno. Não retorna valores.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description:
        'Lista as categorias de lançamento cadastradas na fazenda (id interno e nome). Use SEMPRE que precisar resolver o nome de uma categoria para o id interno.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profit_report',
      description:
        'Retorna o lucro da fazenda inteira, já calculado, somando todas as safras. Use SEMPRE que o usuário pedir o lucro/resultado da fazenda. Nunca calcule isso por conta própria.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_harvest_profit',
      description:
        'Retorna a receita, a despesa e o lucro JÁ CALCULADO de uma safra específica. Use SEMPRE que o usuário pedir o lucro/resultado de uma safra. Nunca subtraia despesa de receita você mesmo.',
      parameters: {
        type: 'object',
        properties: {
          harvestId: {
            type: 'string',
            description:
              'ID interno da safra, obtido via list_harvests. Nunca pedir ao usuário.',
          },
        },
        required: ['harvestId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_harvest_expenses',
      description:
        'Retorna APENAS o total de despesas de uma safra. Isto não é lucro: para lucro use get_harvest_profit.',
      parameters: {
        type: 'object',
        properties: {
          harvestId: {
            type: 'string',
            description:
              'ID interno da safra, obtido via list_harvests. Nunca pedir ao usuário.',
          },
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
    toolChoice: ChatCompletionToolChoiceOption = 'auto',
  ): Promise<ChatCompletion> {
    return this.call(messages, toolChoice);
  }

  async transcribe(buffer: Buffer): Promise<string> {
    const file = await toFile(buffer, 'audio.ogg', { type: 'audio/ogg' });

    const transcription = await this.openai.audio.transcriptions.create({
      model: TRANSCRIPTION_MODEL,
      file,
      language: 'pt',
    });

    return transcription.text;
  }

  private async call(
    messages: ChatCompletionMessageParam[],
    toolChoice: ChatCompletionToolChoiceOption = 'auto',
  ): Promise<ChatCompletion> {
    this.logger.debug(`Calling OpenAI with ${messages.length} messages`);

    return this.openai.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: toolChoice,
      temperature: 0.3,
    });
  }
}
