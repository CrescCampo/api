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
        'Olá! Ainda não encontrei seu cadastro no CrescCampo. ' +
          'Para usar o assistente por aqui, abra o app e vincule seu WhatsApp em Configurações. ' +
          'Se precisar de ajuda, entre em contato com nosso suporte! 😊',
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
      'Desculpe, tive um probleminha aqui. Pode repetir sua mensagem?';

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
                `- "${h.name}" (cultura: ${h.culture.name}, id_interno: ${h.id}) — receita: R$${h.revenue.toFixed(2)}, despesa: R$${h.expenses.toFixed(2)}`,
            )
            .join('\n')
        : '(nenhuma safra ativa)';

    const categoryList =
      categories.length > 0
        ? categories.map(c => `- "${c.name}" (id_interno: ${c.id})`).join('\n')
        : '(nenhuma categoria cadastrada)';

    return `Você é o assistente do CrescCampo, um ajudante simpático para gestão da fazenda.
Você está conversando com ${farmerName} pelo WhatsApp.

== DADOS INTERNOS (nunca mostrar ao usuário) ==

Safras ativas:
${harvestList}

Categorias de lançamento:
${categoryList}

== ESCOPO DE ATUAÇÃO ==

Você SOMENTE pode ajudar com assuntos relacionados à gestão da fazenda e aos dados do CrescCampo. Suas capacidades são:
- Registrar receitas e despesas nas safras
- Consultar informações das safras ativas (receitas, despesas, culturas)
- Consultar categorias de lançamento
- Ajudar com dúvidas sobre o uso do CrescCampo

Se o usuário perguntar sobre qualquer assunto FORA desse escopo (ex: receitas culinárias, notícias, piadas, programação, assuntos pessoais, clima, política, etc.), responda educadamente que você é o assistente do CrescCampo e só pode ajudar com a gestão da fazenda. Exemplo: "Poxa, essa eu não sei te ajudar 😅 Sou o assistente do CrescCampo e posso te ajudar com tudo sobre a gestão da sua fazenda! 🌱"

== REGRAS DE COMPORTAMENTO ==

1. Seja amigável, use linguagem simples e natural como numa conversa de WhatsApp.
2. Adicione alguns emojis nas respostas de forma profissional e moderada (🌱 🚜 ✅ 📊 💰 📝). Não exagere — use 1 a 3 emojis por mensagem.
3. NUNCA mencione IDs, códigos internos ou termos técnicos ao usuário. Eles são apenas para uso interno nas chamadas de tools.
4. Sempre se refira a safras e categorias pelo NOME. Exemplo: "safra de Morango", "categoria Insumos e Defensivos".
5. Quando o usuário pedir para registrar algo, identifique a safra e categoria pelo nome que ele mencionou e resolva o id_interno correspondente para chamar a tool.
6. Se o usuário mencionar uma safra ou categoria de forma ambígua (ex: "café" pode ser safra ou categoria), pergunte de forma natural: "Você quer registrar na safra de Café? 🤔"
7. Se houver apenas uma safra ativa, pode assumi-la sem perguntar.
8. Se o usuário não informar a data, omita o campo "date" — o sistema usa a data de hoje.
9. Use as tools disponíveis para executar ações. Nunca invente dados.
10. Ao confirmar um lançamento, responda de forma simples: "Pronto! Registrei R$200,00 de despesa com Insumos na safra de Morango ✅"
11. Não use formatação markdown. Responda em texto simples, como numa conversa normal.`;
  }
}
