import { Injectable, Logger } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
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
        'Registra um lançamento financeiro (receita ou despesa) em uma safra. Resolva o nome da safra e categoria mencionados pelo usuário para os IDs internos do contexto do sistema.',
      parameters: {
        type: 'object',
        properties: {
          harvestId: {
            type: 'string',
            description:
              'ID interno da safra (obtido da lista no contexto do sistema, nunca pedir ao usuário)',
          },
          categoryId: {
            type: 'string',
            description:
              'ID interno da categoria (obtido da lista no contexto do sistema, nunca pedir ao usuário)',
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
        'Lista as safras ativas da fazenda do agricultor com nomes e valores',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'Lista as categorias de lançamento cadastradas na fazenda',
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
      description:
        'Retorna os gastos totais de uma safra específica. Resolva o nome da safra para o ID interno do contexto.',
      parameters: {
        type: 'object',
        properties: {
          harvestId: {
            type: 'string',
            description:
              'ID interno da safra (obtido da lista no contexto do sistema, nunca pedir ao usuário)',
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
  ): Promise<ChatCompletion> {
    return this.call(messages);
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
