import WaConversationService from 'infra/whatsapp-processor/wa-conversation.service';
import {
  waConversations,
  messages as messagesTable,
} from 'infra/database/drizzle/external-schemas';
import type DrizzleService from 'infra/database/drizzle/drizzle.service';
import type FarmerRepository from 'domain/application/repositories/FarmerRepository';
import type WaLlmService from 'infra/whatsapp-processor/wa-llm.service';
import type WaToolExecutorService from 'infra/whatsapp-processor/wa-tool-executor.service';

const PHONE = '553599701740';
const FARMER = { id: 'farmer-1', farmId: 'farm-1', name: 'Matheus' };

interface InsertCall {
  table: unknown;
  values: Record<string, unknown>;
}

interface UpdateCall {
  table: unknown;
  set: Record<string, unknown>;
}

function makeDb(context: unknown[] = []) {
  const inserts: InsertCall[] = [];
  const updates: UpdateCall[] = [];

  const connection = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ phoneNumber: PHONE, context }]),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return Object.assign(Promise.resolve(), {
          returning: () => Promise.resolve([{ phoneNumber: PHONE, context }]),
        });
      },
    }),
    update: (table: unknown) => ({
      set: (set: Record<string, unknown>) => ({
        where: () => {
          updates.push({ table, set });
          return Promise.resolve();
        },
      }),
    }),
  };

  return { connection, inserts, updates };
}

function completion(message: {
  content?: string | null;
  tool_calls?: unknown[];
}) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: message.content ?? null,
          tool_calls: message.tool_calls,
        },
      },
    ],
  };
}

function toolCall(name: string, args: Record<string, unknown>) {
  return {
    id: `call-${name}`,
    type: 'function',
    function: { name, arguments: JSON.stringify(args) },
  };
}

function makeSut(
  llmService: Partial<WaLlmService>,
  toolExecutor: Partial<WaToolExecutorService>,
  context: unknown[] = [],
) {
  const { connection, inserts, updates } = makeDb(context);
  const farmerRepository = {
    findByPhone: vi.fn().mockResolvedValue(FARMER),
  };

  const sut = new WaConversationService(
    farmerRepository as unknown as FarmerRepository,
    llmService as WaLlmService,
    toolExecutor as WaToolExecutorService,
    { connection } as unknown as DrizzleService,
  );

  const replyText = () =>
    inserts.find(i => i.table === messagesTable)?.values.text as string;

  return { sut, inserts, updates, replyText };
}

describe('WaConversationService', () => {
  it('should refuse to confirm a transaction the model never actually created', async () => {
    const claim =
      'Pronto! Registrei uma receita de R$6,51 na safra de Morango 2026 ✅';
    const llmService = {
      process: vi.fn().mockResolvedValue(completion({ content: claim })),
      continueWithToolResults: vi
        .fn()
        .mockResolvedValue(completion({ content: claim })),
    };
    const toolExecutor = { execute: vi.fn() };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(PHONE, 'Adiciona uma receita de 6,51.');

    expect(toolExecutor.execute).not.toHaveBeenCalled();
    expect(llmService.continueWithToolResults).toHaveBeenCalled();
    expect(replyText()).not.toContain('Registrei');
    expect(replyText()).toContain('não consegui registrar');
  });

  it('should let the model correct an unconfirmed write claim with a grounded read', async () => {
    const grounded = 'Sim! Ontem entrou R$50,00 de Adubo na safra Morango 🌱';
    const llmService = {
      process: vi
        .fn()
        .mockResolvedValue(
          completion({ content: 'Sim, registrei ontem R$50 de adubo ✅' }),
        ),
      continueWithToolResults: vi
        .fn()
        .mockResolvedValueOnce(
          completion({
            tool_calls: [toolCall('get_harvest_expenses', { harvestId: 'h1' })],
          }),
        )
        .mockResolvedValueOnce(completion({ content: grounded })),
    };
    const toolExecutor = {
      execute: vi
        .fn()
        .mockResolvedValue(
          JSON.stringify({ expenses: [{ amount: 50, category: 'Adubo' }] }),
        ),
    };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(PHONE, 'Você registrou aquela despesa de ontem?');

    expect(toolExecutor.execute).toHaveBeenCalledWith(
      'get_harvest_expenses',
      { harvestId: 'h1' },
      FARMER.farmId,
    );
    expect(replyText()).toBe(grounded);
    expect(replyText()).not.toContain('não consegui registrar');
  });

  it('should confirm with the tool message, not with what the model wrote', async () => {
    const toolMessage =
      'Pronto! Registrei uma receita de R$6.51 na safra "Morango 2028", categoria "Vendas".';

    const llmService = {
      process: vi.fn().mockResolvedValue(
        completion({
          tool_calls: [
            toolCall('create_transaction', {
              harvestId: 'harvest-1',
              categoryId: 'cat-1',
              type: 'revenue',
              amount: 6.51,
              description: 'Venda',
            }),
          ],
        }),
      ),
      continueWithToolResults: vi.fn().mockResolvedValue(
        completion({
          content: 'Pronto! Registrei R$99,00 na safra de Morango 2026 ✅',
        }),
      ),
    };
    const toolExecutor = {
      execute: vi
        .fn()
        .mockResolvedValue(
          JSON.stringify({ success: true, message: toolMessage }),
        ),
    };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(PHONE, 'Adiciona uma receita de 6,51 no Morango 2028.');

    expect(replyText()).toBe(toolMessage);
    expect(replyText()).not.toContain('99,00');
    expect(replyText()).not.toContain('Morango 2026');
  });

  it('should not leak farm data into the system prompt', async () => {
    const llmService = {
      process: vi
        .fn()
        .mockResolvedValue(
          completion({ content: 'Oi! Como posso ajudar? 🌱' }),
        ),
      continueWithToolResults: vi.fn(),
    };

    const { sut } = makeSut(llmService, { execute: vi.fn() });

    await sut.handle(PHONE, 'Oi');

    const { systemPrompt } = llmService.process.mock.calls[0][0];
    expect(systemPrompt).toContain(FARMER.name);
    expect(systemPrompt).not.toContain('DADOS INTERNOS');
    expect(systemPrompt).not.toContain('id_interno:');
    expect(systemPrompt).not.toMatch(/receita: R\$/);
  });

  it('should force a grounded lookup when the model states farm data without a tool', async () => {
    const grounded = 'O lucro da sua safra de Morango 2028 é de R$506,53 🌱';
    const llmService = {
      process: vi
        .fn()
        .mockResolvedValue(
          completion({ content: 'Seu lucro é de R$13,02 🌱' }),
        ),
      continueWithToolResults: vi
        .fn()
        .mockResolvedValueOnce(
          completion({
            tool_calls: [toolCall('get_harvest_profit', { harvestId: 'h1' })],
          }),
        )
        .mockResolvedValueOnce(completion({ content: grounded })),
    };
    const toolExecutor = {
      execute: vi.fn().mockResolvedValue(
        JSON.stringify({
          harvestName: 'Morango 2028',
          revenue: 806.73,
          expenses: 300.2,
          profit: 506.53,
        }),
      ),
    };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(PHONE, 'Qual o lucro da safra?');

    expect(toolExecutor.execute).toHaveBeenCalledWith(
      'get_harvest_profit',
      { harvestId: 'h1' },
      FARMER.farmId,
    );
    expect(llmService.continueWithToolResults).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'required',
    );
    expect(replyText()).toBe(grounded);
    expect(replyText()).not.toContain('13,02');
  });

  it('should force grounding even when the stale assertion ends with a follow-up question', async () => {
    const grounded = 'Seu lucro total é de R$506,53 🌱';
    const llmService = {
      process: vi.fn().mockResolvedValue(
        completion({
          content: 'Seu lucro é de R$13,02 💰 Quer ver as despesas também?',
        }),
      ),
      continueWithToolResults: vi
        .fn()
        .mockResolvedValueOnce(
          completion({
            tool_calls: [toolCall('get_profit_report', {})],
          }),
        )
        .mockResolvedValueOnce(completion({ content: grounded })),
    };
    const toolExecutor = {
      execute: vi.fn().mockResolvedValue(
        JSON.stringify({
          totalRevenue: 806.73,
          totalExpenses: 300.2,
          profit: 506.53,
        }),
      ),
    };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(PHONE, 'Qual meu lucro?');

    expect(llmService.continueWithToolResults).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'required',
    );
    expect(replyText()).toBe(grounded);
    expect(replyText()).not.toContain('13,02');
  });

  it('should keep the grounded read answer alongside the tool write confirmation', async () => {
    const toolMessage =
      'Pronto! Registrei uma despesa de R$50.00 na safra "Morango 2028", categoria "Insumos".';
    const profitAnswer = 'O lucro da safra Morango 2028 é de R$456,53 🌱';
    const llmService = {
      process: vi.fn().mockResolvedValue(
        completion({
          tool_calls: [
            toolCall('create_transaction', {
              harvestId: 'harvest-1',
              categoryId: 'cat-1',
              type: 'expense',
              amount: 50,
              description: 'Adubo',
            }),
            toolCall('get_harvest_profit', { harvestId: 'harvest-1' }),
          ],
        }),
      ),
      continueWithToolResults: vi.fn().mockResolvedValue(
        completion({
          content: `Registrei R$50,00 de Insumos ✅ ${profitAnswer}`,
        }),
      ),
    };
    const toolExecutor = {
      execute: vi.fn().mockImplementation((name: string) => {
        if (name === 'create_transaction') {
          return Promise.resolve(
            JSON.stringify({ success: true, message: toolMessage }),
          );
        }
        return Promise.resolve(JSON.stringify({ profit: 456.53 }));
      }),
    };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(
      PHONE,
      'Lança R$50 de adubo no Morango 2028 e me diz o lucro dela.',
    );

    expect(replyText()).toContain(toolMessage);
    expect(replyText()).toContain(profitAnswer);
    expect(replyText()).not.toContain('Registrei R$50,00 de Insumos');
  });

  it('should not mistake a read answer with "registradas" for a failed write', async () => {
    const answer =
      'Suas categorias registradas são: Insumos, Vendas e Mão de obra 🌱';
    const llmService = {
      process: vi.fn().mockResolvedValue(
        completion({
          tool_calls: [toolCall('list_categories', {})],
        }),
      ),
      continueWithToolResults: vi
        .fn()
        .mockResolvedValue(completion({ content: answer })),
    };
    const toolExecutor = {
      execute: vi
        .fn()
        .mockResolvedValue(JSON.stringify([{ id: 'c1', name: 'Insumos' }])),
    };

    const { sut, replyText } = makeSut(llmService, toolExecutor);

    await sut.handle(PHONE, 'Quais categorias eu tenho?');

    expect(replyText()).toBe(answer);
    expect(replyText()).not.toContain('não consegui registrar');
  });

  it('should persist the exchange in the conversation context', async () => {
    const llmService = {
      process: vi
        .fn()
        .mockResolvedValue(
          completion({ content: 'Oi! Como posso ajudar? 🌱' }),
        ),
      continueWithToolResults: vi.fn(),
    };

    const { sut, updates } = makeSut(llmService, { execute: vi.fn() });

    await sut.handle(PHONE, 'Oi');

    const saved = updates.find(u => u.table === waConversations);
    expect(saved?.set.context).toEqual([
      { role: 'user', content: 'Oi' },
      { role: 'assistant', content: 'Oi! Como posso ajudar? 🌱' },
    ]);
  });
});
