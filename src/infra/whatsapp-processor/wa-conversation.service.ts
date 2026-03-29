import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import Harvest from 'domain/enterprise/entities/Harvest';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import DrizzleService from 'infra/database/drizzle/drizzle.service';
import {
  waConversations,
  messages as messagesTable,
} from 'infra/database/drizzle/external-schemas';
import WaLlmService from './wa-llm.service';
import WaToolExecutorService from './wa-tool-executor.service';

const MAX_TOOL_ITERATIONS = 10;
const MAX_CONTEXT_MESSAGES = 20;

@Injectable()
export default class WaConversationService {
  private readonly logger = new Logger(WaConversationService.name);

  private readonly db: NodePgDatabase<Record<string, never>>;

  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly categoryRepository: TransactionCategoryRepository,
    private readonly llmService: WaLlmService,
    private readonly toolExecutor: WaToolExecutorService,
    drizzleService: DrizzleService,
  ) {
    this.db = drizzleService.connection;
  }

  async handle(
    phoneNumber: string,
    content: string,
    jid?: string | null,
  ): Promise<void> {
    const farmer = await this.farmerRepository.findByPhone(phoneNumber);

    if (!farmer) {
      await this.sendReply(
        phoneNumber,
        'Olá! Seu número não está vinculado ao CrescCampo. ' +
          'Acesse o app para vincular seu WhatsApp na tela de configurações.',
        jid,
      );
      return;
    }

    const conversation = await this.findOrCreateConversation(
      phoneNumber,
      farmer.id,
    );

    const harvests = await this.harvestRepository.findActiveByFarmId(
      farmer.farmId,
    );
    const categories = await this.categoryRepository.findByFarmId(
      farmer.farmId,
    );
    const systemPrompt = this.buildSystemPrompt(
      farmer.name,
      harvests,
      categories,
    );

    const history = conversation.context as ChatCompletionMessageParam[];

    let response = await this.llmService.process({
      systemPrompt,
      history,
      userMessage: content,
    });

    const accumulated: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content },
    ];

    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      const choice = response.choices[0];

      if (
        !choice.message.tool_calls ||
        choice.message.tool_calls.length === 0
      ) {
        break;
      }

      accumulated.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== 'function') continue;

        let args: Record<string, unknown>;
        try {
          args = JSON.parse(toolCall.function.arguments) as Record<
            string,
            unknown
          >;
        } catch {
          args = {};
        }

        const result = await this.toolExecutor.execute(
          toolCall.function.name,
          args,
          farmer.farmId,
        );

        accumulated.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      response = await this.llmService.continueWithToolResults(accumulated);
      iterations++;
    }

    const reply =
      response.choices[0]?.message?.content ??
      'Desculpe, não consegui processar sua mensagem.';

    const newHistory = this.updateContext(history, content, reply);

    await this.db
      .update(waConversations)
      .set({
        context: newHistory,
        lastActivityAt: new Date(),
        farmerId: farmer.id,
      })
      .where(eq(waConversations.phoneNumber, phoneNumber));

    await this.sendReply(phoneNumber, reply, jid);
  }

  private async findOrCreateConversation(
    phoneNumber: string,
    farmerId: string,
  ) {
    const [existing] = await this.db
      .select()
      .from(waConversations)
      .where(eq(waConversations.phoneNumber, phoneNumber))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await this.db
      .insert(waConversations)
      .values({
        phoneNumber,
        farmerId,
        context: [],
        lastActivityAt: new Date(),
      })
      .returning();

    return created;
  }

  private async sendReply(
    phoneNumber: string,
    text: string,
    jid?: string | null,
  ): Promise<void> {
    await this.db.insert(messagesTable).values({
      phoneNumber,
      jid: jid ?? undefined,
      text,
    });
  }

  private updateContext(
    history: ChatCompletionMessageParam[],
    userMessage: string,
    assistantReply: string,
  ): ChatCompletionMessageParam[] {
    const updated: ChatCompletionMessageParam[] = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantReply },
    ];

    if (updated.length <= MAX_CONTEXT_MESSAGES) {
      return updated;
    }

    // Truncate by removing oldest turns (pairs of user + assistant)
    let trimmed = updated;
    while (trimmed.length > MAX_CONTEXT_MESSAGES) {
      // Remove first 2 messages (one turn = user + assistant)
      trimmed = trimmed.slice(2);
    }

    return trimmed;
  }

  private buildSystemPrompt(
    farmerName: string,
    harvests: Harvest[],
    categories: TransactionCategory[],
  ): string {
    const harvestList =
      harvests.length > 0
        ? harvests
            .map(
              h =>
                `- ${h.name} (cultura: ${h.culture.name}, ID: ${h.id}) — receita: R$${h.revenue.toFixed(2)}, despesa: R$${h.expenses.toFixed(2)}`,
            )
            .join('\n')
        : '(nenhuma safra ativa)';

    const categoryList =
      categories.length > 0
        ? categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')
        : '(nenhuma categoria cadastrada)';

    return `Você é o assistente do CrescCampo, plataforma de gestão agrícola.
Você está conversando com ${farmerName}.

Safras ativas:
${harvestList}

Categorias disponíveis:
${categoryList}

Responda sempre em português brasileiro, de forma clara e objetiva.
Use as tools disponíveis para executar ações na plataforma.
Quando a mensagem for ambígua ou faltar informações, pergunte ao usuário antes de agir.
Nunca invente IDs — use apenas os IDs fornecidos no contexto acima.
Se o usuário não informar a data de um lançamento, omita o campo "date" — o sistema usará a data de hoje automaticamente.
Não use formatação markdown na resposta. Responda em texto simples.`;
  }
}
