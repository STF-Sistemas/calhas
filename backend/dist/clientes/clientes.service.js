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
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const falha_1 = require("../common/falha");
const client_1 = require("../generated/prisma/client");
const busca_sem_acento_1 = require("../prisma/busca-sem-acento");
const prisma_service_1 = require("../prisma/prisma.service");
const texto = (valor, max) => (typeof valor === 'string' ? valor.slice(0, max) : '');
const FONTES_CNPJ = ['https://brasilapi.com.br/api/cnpj/v1/', 'https://minhareceita.org/'];
async function consultarCnpjExterno(doc) {
    let naoEncontrado = false;
    for (const base of FONTES_CNPJ) {
        try {
            const resposta = await fetch(`${base}${doc}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; consulta-cnpj/1.0)', Accept: 'application/json' },
                signal: AbortSignal.timeout(10000),
            });
            if (resposta.ok)
                return (await resposta.json());
            if (resposta.status === 404)
                naoEncontrado = true;
        }
        catch {
            continue;
        }
    }
    if (naoEncontrado)
        throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'CNPJ não encontrado na Receita Federal.');
    throw (0, falha_1.falha)(common_1.HttpStatus.BAD_GATEWAY, 'O serviço de consulta da Receita está indisponível no momento. Tente novamente em instantes ou preencha manualmente.');
}
function montarEndereco(d) {
    const logradouro = texto(d.logradouro, 200).trim();
    const tipo = texto(d.descricao_tipo_de_logradouro, 30).trim();
    if (!tipo || logradouro.toUpperCase().startsWith(tipo.toUpperCase()))
        return logradouro;
    return `${tipo} ${logradouro}`.slice(0, 200);
}
let ClientesService = class ClientesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async obter(id, codEmpresa) {
        const cliente = await this.prisma.cliente.findFirst({
            where: { id, cod_empresa: codEmpresa, excluido: false },
            include: { cidade: true },
        });
        if (!cliente)
            throw (0, falha_1.falha)(common_1.HttpStatus.NOT_FOUND, 'Cliente não encontrado.');
        return cliente;
    }
    async listar(codEmpresa, q) {
        const nome = (0, busca_sem_acento_1.termoBusca)(q['nome']);
        const endereco = (0, busca_sem_acento_1.termoBusca)(q['endereco']);
        const cpfCnpj = (0, busca_sem_acento_1.termoBusca)(q['cpfCnpj'], 20);
        const telefone = (0, busca_sem_acento_1.termoBusca)(q['telefone'], 20).replace(/\D/g, '');
        const where = { cod_empresa: codEmpresa, excluido: false };
        const condicoes = [];
        const textos = [];
        if (nome)
            textos.push((0, busca_sem_acento_1.algumaContem)([client_1.Prisma.sql `c.razao_social`, client_1.Prisma.sql `c.nome_fantasia`], nome));
        if (endereco) {
            textos.push((0, busca_sem_acento_1.algumaContem)([client_1.Prisma.sql `c.endereco`, client_1.Prisma.sql `c.bairro`, client_1.Prisma.sql `ci.descricao`], endereco));
        }
        if (telefone)
            textos.push(client_1.Prisma.sql `regexp_replace(coalesce(c.telefone, ''), '[^0-9]', '', 'g') LIKE ${`%${telefone}%`}`);
        if (textos.length) {
            const linhas = await this.prisma.$queryRaw `
        SELECT c.id FROM calhas.clientes c
        LEFT JOIN calhas.cidades ci ON ci.id = c.cod_cidade
        WHERE c.cod_empresa = ${codEmpresa} AND c.excluido = false AND ${client_1.Prisma.join(textos, ' AND ')}
        ORDER BY c.razao_social LIMIT 1000`;
            condicoes.push({ id: { in: linhas.map((l) => l.id) } });
        }
        if (cpfCnpj)
            condicoes.push({ cpf_cnpj: { contains: cpfCnpj, mode: 'insensitive' } });
        if (q['ativo'])
            condicoes.push({ ativo: Number(q['ativo']) || 0 });
        if (condicoes.length)
            where.AND = condicoes;
        const pagina = Math.max(1, parseInt(q['pagina'] ?? '1', 10) || 1);
        const limite = Math.min(100, Math.max(1, parseInt(q['limite'] ?? '10', 10) || 10));
        const [total, data] = await Promise.all([
            this.prisma.cliente.count({ where }),
            this.prisma.cliente.findMany({
                where,
                include: { cidade: true },
                orderBy: { razao_social: 'asc' },
                skip: (pagina - 1) * limite,
                take: limite,
            }),
        ]);
        return { success: true, data, total, pagina, totalPaginas: Math.ceil(total / limite) };
    }
    async consultarReceita(bruto) {
        const doc = String(bruto).replace(/\D/g, '');
        if (doc.length === 11) {
            throw (0, falha_1.falha)(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'A consulta de CPF não está disponível em APIs públicas gratuitas. Preencha os dados manualmente.');
        }
        if (doc.length !== 14)
            throw (0, falha_1.falha)(common_1.HttpStatus.BAD_REQUEST, 'Informe um CNPJ completo (14 dígitos).');
        const d = await consultarCnpjExterno(doc);
        let cidade = null;
        const ibge = String(d.codigo_municipio_ibge ?? '');
        if (/^\d{7}$/.test(ibge)) {
            cidade = await this.prisma.cidade.findFirst({ where: { codigo_ibge: ibge } });
            const municipio = texto(d.municipio, 100).trim();
            const uf = texto(d.uf, 2).toUpperCase();
            if (!cidade && municipio && /^[A-Z]{2}$/.test(uf)) {
                cidade = await this.prisma.cidade.create({ data: { descricao: municipio, uf, codigo_ibge: ibge } });
            }
        }
        return {
            success: true,
            data: {
                razao_social: texto(d.razao_social, 200),
                nome_fantasia: texto(d.nome_fantasia, 200),
                email: texto(d.email, 200),
                telefone: texto(d.ddd_telefone_1, 30).replace(/\D/g, ''),
                cep: texto(d.cep, 20).replace(/\D/g, ''),
                endereco: montarEndereco(d),
                numero: texto(d.numero, 10),
                bairro: texto(d.bairro, 100),
                complemento: texto(d.complemento, 100),
                cod_cidade: cidade?.id ?? null,
                cidade_nome: cidade?.descricao ?? texto(d.municipio, 100),
                uf: texto(d.uf, 2),
            },
        };
    }
    async buscar(id, codEmpresa) {
        return { success: true, data: await this.obter(id, codEmpresa) };
    }
    async criar(dto, codEmpresa) {
        const data = await this.prisma.cliente.create({ data: { ...dto, email: dto.email || null, cod_empresa: codEmpresa } });
        return { success: true, data };
    }
    async atualizar(id, dto, codEmpresa) {
        await this.obter(id, codEmpresa);
        const data = await this.prisma.cliente.update({ where: { id }, data: { ...dto, email: dto.email || null } });
        return { success: true, data };
    }
    async excluir(id, codEmpresa) {
        await this.obter(id, codEmpresa);
        await this.prisma.cliente.update({ where: { id }, data: { excluido: true } });
        return { success: true, message: 'Cliente excluído.' };
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map