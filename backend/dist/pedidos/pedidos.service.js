"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosService = exports.INCLUDE_PEDIDO = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const enums_1 = require("../shared/enums");
const desconto_functions_1 = require("../shared/functions/desconto.functions");
const falha_1 = require("../common/falha");
const client_1 = require("../generated/prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const Decimal = client_1.Prisma.Decimal;
exports.INCLUDE_PEDIDO = {
    empresa: true,
    cliente: { include: { cidade: true } },
    meio_pagamento: true,
    itens: { include: { produto: true, corte: { include: { chapa: true } }, servico: true, desenho: true } },
};
const STATUS_PRODUTIVOS = [enums_1.EStatusPedido.EmProducao, enums_1.EStatusPedido.Concluido];
const STATUS_VALIDOS = [enums_1.EStatusPedido.Aberto, enums_1.EStatusPedido.EmProducao, enums_1.EStatusPedido.Concluido, enums_1.EStatusPedido.Cancelado];
const arred = (n) => Math.round(n * 10) / 10;
function jsonMedidas(medidas) {
    return medidas == null ? client_1.Prisma.DbNull : medidas;
}
function usaDesenhoLivre(item) {
    return !item.cod_desenho && Array.isArray(item.desenho_pontos) && item.desenho_pontos.length >= 2;
}
function jsonPontos(pontos) {
    return pontos.map((p) => ({ x: arred(p.x), y: arred(p.y) }));
}
function jsonDiagonais(diagonais) {
    if (!diagonais?.length)
        return client_1.Prisma.DbNull;
    return diagonais.map((d) => ({ p1: { x: arred(d.p1.x), y: arred(d.p1.y) }, p2: { x: arred(d.p2.x), y: arred(d.p2.y) } }));
}
function dadosItem(item) {
    const livre = usaDesenhoLivre(item);
    return {
        tipo: item.tipo,
        cod_produto: item.cod_produto ?? null,
        cod_servico: item.cod_servico ?? null,
        cod_corte: item.cod_corte ?? null,
        cod_desenho: item.cod_desenho ?? null,
        medidas: jsonMedidas(item.medidas),
        desenho_pontos: livre ? jsonPontos(item.desenho_pontos) : client_1.Prisma.DbNull,
        desenho_diagonais: livre ? jsonDiagonais(item.desenho_diagonais) : client_1.Prisma.DbNull,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: new Decimal(item.quantidade).mul(new Decimal(item.valor_unitario)),
        observacoes: item.observacoes ?? null,
    };
}
function validarCabecalho(dto) {
    if (dto.desconto_tipo === enums_1.EDescontoTipo.Percentual && (dto.desconto_valor ?? 0) > 100) {
        throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'O desconto percentual não pode ser maior que 100%.');
    }
    for (const item of dto.itens)
        validarItem(item);
    const data = new Date(dto.data_pedido);
    if (Number.isNaN(data.getTime()))
        throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Data do pedido inválida.');
    return data;
}
function validarItem(item) {
    if (item.cod_produto == null && item.cod_servico == null && item.cod_corte == null) {
        throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Item deve ter produto, serviço ou corte.');
    }
}
let PedidosService = class PedidosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, codEmpresa) {
        const pedido = await this.prisma.pedido.findFirst({ where: { id, cod_empresa: codEmpresa, excluido: false } });
        if (!pedido)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Pedido não encontrado.');
        return pedido;
    }
    async buscar(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        return { success: true, data: await this.completo(id) };
    }
    async completo(id) {
        return this.prisma.pedido.findFirst({ where: { id }, include: exports.INCLUDE_PEDIDO });
    }
    async listar(codEmpresa, q) {
        const where = { cod_empresa: codEmpresa, excluido: false };
        if (q['status'] !== undefined && q['status'] !== '') {
            const s = Number(q['status']);
            if (!Number.isInteger(s))
                throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Status inválido.');
            where.status = s;
        }
        const codCliente = Number(q['codCliente']);
        if (Number.isInteger(codCliente) && codCliente > 0)
            where.cod_cliente = codCliente;
        const dia = /^\d{4}-\d{2}-\d{2}$/;
        const inicio = dia.test(q['dataInicio'] ?? '') ? q['dataInicio'] : null;
        const fim = dia.test(q['dataFim'] ?? '') ? q['dataFim'] : null;
        if (inicio || fim) {
            where.data_pedido = {
                ...(inicio && { gte: new Date(`${inicio}T00:00:00`) }),
                ...(fim && { lte: new Date(`${fim}T23:59:59.999`) }),
            };
        }
        const pagina = Math.max(1, parseInt(q['pagina'] ?? '1', 10) || 1);
        const limite = Math.min(100, Math.max(1, parseInt(q['limite'] ?? '10', 10) || 10));
        const [total, data] = await Promise.all([
            this.prisma.pedido.count({ where }),
            this.prisma.pedido.findMany({
                where,
                omit: { aprovacao_assinatura: true },
                include: exports.INCLUDE_PEDIDO,
                orderBy: { data_pedido: 'desc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);
        return { success: true, data, total, pagina, totalPaginas: Math.ceil(total / limite) };
    }
    async criar(dto, codEmpresa) {
        const dataPedido = validarCabecalho(dto);
        await this.validarReferencias(codEmpresa, dto.cod_cliente, dto.cod_meio_pagamento, dto.itens);
        const itens = await Promise.all(dto.itens.map(async (item) => ({ ...dadosItem(item), custo_unitario: await this.custoDoItem(item) })));
        const pedido = await this.prisma.pedido.create({
            data: {
                cod_empresa: codEmpresa,
                cod_cliente: dto.cod_cliente,
                cod_meio_pagamento: dto.cod_meio_pagamento ?? null,
                data_pedido: dataPedido,
                observacoes: dto.observacoes ?? null,
                observacoes_cliente: dto.observacoes_cliente ?? null,
                desconto_tipo: dto.desconto_tipo ?? enums_1.EDescontoTipo.Reais,
                desconto_valor: dto.desconto_valor ?? 0,
                status: enums_1.EStatusPedido.Aberto,
                itens: { create: itens },
            },
        });
        await this.recalcular(pedido.id);
        return { success: true, data: await this.completo(pedido.id) };
    }
    async atualizar(id, dto, codEmpresa) {
        const existente = await this.obter(id, codEmpresa);
        const dataPedido = validarCabecalho(dto);
        await this.validarReferencias(codEmpresa, dto.cod_cliente, dto.cod_meio_pagamento, dto.itens);
        if (STATUS_PRODUTIVOS.includes(dto.status))
            await this.exigirEstoque(id, codEmpresa, dto.itens, existente.estoque_baixado);
        await this.prisma.$transaction(async (tx) => {
            if (existente.estoque_baixado) {
                await tx.$executeRaw `
          UPDATE calhas.pedidos SET status = ${enums_1.EStatusPedido.Aberto}, estoque_baixado = FALSE, updated_at = NOW()
          WHERE id = ${id}`;
            }
            await tx.pedido.update({
                where: { id },
                data: {
                    cod_cliente: dto.cod_cliente,
                    cod_meio_pagamento: dto.cod_meio_pagamento ?? null,
                    data_pedido: dataPedido,
                    observacoes: dto.observacoes ?? null,
                    observacoes_cliente: dto.observacoes_cliente ?? null,
                    desconto_tipo: dto.desconto_tipo ?? enums_1.EDescontoTipo.Reais,
                    desconto_valor: dto.desconto_valor ?? 0,
                },
            });
            const idsMantidos = dto.itens.map((i) => i.id).filter((v) => !!v);
            await tx.pedidoItem.deleteMany({ where: { cod_pedido: id, id: { notIn: idsMantidos } } });
            for (const item of dto.itens) {
                if (item.id) {
                    const pertence = await tx.pedidoItem.findFirst({ where: { id: item.id, cod_pedido: id }, select: { id: true } });
                    if (!pertence)
                        throw (0, falha_1.falha)(common_1.HttpStatus.FORBIDDEN, 'Item não pertence a este pedido.');
                    await tx.pedidoItem.update({ where: { id: item.id }, data: dadosItem(item) });
                }
                else {
                    await tx.pedidoItem.create({
                        data: { ...dadosItem(item), cod_pedido: id, custo_unitario: await this.custoDoItem(item) },
                    });
                }
            }
            await tx.pedido.update({ where: { id }, data: { status: dto.status } });
        });
        await this.recalcular(id);
        return { success: true, data: await this.completo(id) };
    }
    async excluir(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.prisma.pedido.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Pedido excluído.' };
    }
    async alterarStatus(id, status, codEmpresa) {
        if (!STATUS_VALIDOS.includes(status))
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Status inválido.');
        const existente = await this.prisma.pedido.findFirst({
            where: { id, cod_empresa: codEmpresa, excluido: false },
            include: { itens: true },
        });
        if (!existente)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Pedido não encontrado.');
        if (STATUS_PRODUTIVOS.includes(status)) {
            const itens = existente.itens.map((i) => ({ cod_produto: i.cod_produto, quantidade: Number(i.quantidade) }));
            await this.exigirEstoque(id, codEmpresa, itens, existente.estoque_baixado);
        }
        await this.prisma.$transaction(async (tx) => {
            if (existente.estoque_baixado) {
                await tx.$executeRaw `
          UPDATE calhas.pedidos SET status = ${enums_1.EStatusPedido.Aberto}, estoque_baixado = FALSE, updated_at = NOW()
          WHERE id = ${id}`;
            }
            await tx.pedido.update({ where: { id }, data: { status } });
        });
        return { success: true, data: await this.completo(id) };
    }
    async adicionarItem(id, item, codEmpresa) {
        await this.obter(id, codEmpresa);
        validarItem(item);
        await this.validarReferencias(codEmpresa, null, null, [item]);
        await this.prisma.pedidoItem.create({
            data: { ...dadosItem(item), cod_pedido: id, custo_unitario: await this.custoDoItem(item) },
        });
        await this.recalcular(id);
        return { success: true, data: await this.completo(id) };
    }
    async atualizarItem(id, itemId, item, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.exigirItemDoPedido(itemId, id);
        validarItem(item);
        await this.validarReferencias(codEmpresa, null, null, [item]);
        await this.prisma.pedidoItem.update({ where: { id: itemId }, data: dadosItem(item) });
        await this.recalcular(id);
        return { success: true, data: await this.completo(id) };
    }
    async removerItem(id, itemId, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.exigirItemDoPedido(itemId, id);
        await this.prisma.pedidoItem.delete({ where: { id: itemId } });
        await this.recalcular(id);
        return { success: true, data: await this.completo(id) };
    }
    async gerarLink(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        const empresa = await this.prisma.empresa.findUnique({ where: { id: codEmpresa } });
        const expiracao = this.expiracaoLink(empresa?.link_validade_dias);
        const token = (0, node_crypto_1.randomUUID)();
        await this.prisma.pedido.update({ where: { id }, data: { token_acesso: token, token_expiracao: expiracao } });
        const mensagem_padrao = empresa?.whatsapp_mensagem_padrao ?? 'Segue o link com o seu orçamento: {link}';
        return { success: true, data: { token, expiracao, mensagem_padrao } };
    }
    async gerarLinkCorte(id, itens, codEmpresa) {
        await this.obter(id, codEmpresa);
        const empresa = await this.prisma.empresa.findUnique({ where: { id: codEmpresa } });
        const expiracao = this.expiracaoLink(empresa?.link_validade_dias);
        const token = (0, node_crypto_1.randomUUID)();
        await this.prisma.pedido.update({
            where: { id },
            data: {
                token_acesso_corte: token,
                token_expiracao_corte: expiracao,
                itens_corte_selecionados: itens?.length ? itens : client_1.Prisma.DbNull,
            },
        });
        return { success: true, data: { token, expiracao } };
    }
    expiracaoLink(dias) {
        const expiracao = new Date();
        expiracao.setDate(expiracao.getDate() + (dias ?? 7));
        return expiracao;
    }
    async exigirItemDoPedido(itemId, pedidoId) {
        const item = await this.prisma.pedidoItem.findFirst({ where: { id: itemId, cod_pedido: pedidoId }, select: { id: true } });
        if (!item)
            throw (0, falha_1.falha)(common_1.HttpStatus.FORBIDDEN, 'Item não pertence a este pedido.');
    }
    async custoDoItem(item) {
        if (!item.cod_produto)
            return new Decimal(0);
        const produto = await this.prisma.produto.findUnique({ where: { id: item.cod_produto }, select: { custo: true } });
        return produto ? new Decimal(produto.custo) : new Decimal(0);
    }
    async validarReferencias(codEmpresa, codCliente, codMeio, itens) {
        const unicos = (lista) => [...new Set(lista.filter((v) => !!v))];
        const produtos = unicos(itens.map((i) => i.cod_produto));
        const servicos = unicos(itens.map((i) => i.cod_servico));
        const cortes = unicos(itens.map((i) => i.cod_corte));
        const desenhos = unicos(itens.map((i) => i.cod_desenho));
        const daEmpresa = { cod_empresa: codEmpresa };
        const [cliente, meio, nProdutos, nServicos, nCortes, nDesenhos] = await Promise.all([
            codCliente ? this.prisma.cliente.count({ where: { id: codCliente, ...daEmpresa } }) : 1,
            codMeio ? this.prisma.meioPagamento.count({ where: { id: codMeio, ...daEmpresa } }) : 1,
            produtos.length ? this.prisma.produto.count({ where: { id: { in: produtos }, ...daEmpresa } }) : 0,
            servicos.length ? this.prisma.servico.count({ where: { id: { in: servicos }, ...daEmpresa } }) : 0,
            cortes.length ? this.prisma.corte.count({ where: { id: { in: cortes }, chapa: daEmpresa } }) : 0,
            desenhos.length ? this.prisma.desenho.count({ where: { id: { in: desenhos }, ...daEmpresa } }) : 0,
        ]);
        if (!cliente)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Cliente inválido.');
        if (!meio)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Meio de pagamento inválido.');
        if (nProdutos !== produtos.length || nServicos !== servicos.length || nCortes !== cortes.length || nDesenhos !== desenhos.length) {
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Item do pedido com cadastro inválido.');
        }
    }
    async exigirEstoque(pedidoId, codEmpresa, itens, estoqueBaixado) {
        const empresa = await this.prisma.empresa.findFirst({ where: { id: codEmpresa }, select: { validar_estoque: true } });
        if (!empresa?.validar_estoque)
            return;
        const erros = [];
        for (const item of itens) {
            if (!item.cod_produto)
                continue;
            const produto = await this.prisma.produto.findUnique({
                where: { id: item.cod_produto },
                select: { descricao: true, estoque_atual: true },
            });
            if (!produto)
                continue;
            let disponivel = Number(produto.estoque_atual);
            if (estoqueBaixado) {
                const atual = await this.prisma.pedidoItem.findFirst({
                    where: { cod_pedido: pedidoId, cod_produto: item.cod_produto },
                    select: { quantidade: true },
                });
                if (atual)
                    disponivel += Number(atual.quantidade);
            }
            if (disponivel < item.quantidade) {
                erros.push(`"${produto.descricao}": disponível ${disponivel.toFixed(4)}, necessário ${item.quantidade}`);
            }
        }
        if (erros.length) {
            throw (0, falha_1.falha)(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'Estoque insuficiente para um ou mais itens.', { erros });
        }
    }
    async recalcular(pedidoId) {
        const [itens, pedido] = await Promise.all([
            this.prisma.pedidoItem.findMany({ where: { cod_pedido: pedidoId } }),
            this.prisma.pedido.findUniqueOrThrow({ where: { id: pedidoId }, select: { desconto_tipo: true, desconto_valor: true } }),
        ]);
        let material = new Decimal(0);
        let servico = new Decimal(0);
        for (const item of itens) {
            if (item.cod_produto !== null || item.cod_corte !== null)
                material = material.add(item.valor_total);
            else if (item.cod_servico !== null)
                servico = servico.add(item.valor_total);
        }
        const servicoCalculado = material;
        const total = material.add(servicoCalculado).add(servico);
        const desconto = (0, desconto_functions_1.calcularValorDesconto)(total.toNumber(), pedido.desconto_tipo, pedido.desconto_valor.toNumber());
        const liquido = (0, desconto_functions_1.calcularValorLiquido)(total.toNumber(), desconto);
        await this.prisma.pedido.update({
            where: { id: pedidoId },
            data: {
                valor_material: material,
                valor_servico: servicoCalculado,
                valor_total: total,
                valor_desconto: new Decimal(desconto),
                valor_liquido: new Decimal(liquido),
            },
        });
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PedidosService);
//# sourceMappingURL=pedidos.service.js.map