"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../carregar-env");
const node_crypto_1 = require("node:crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
const enums_1 = require("../shared/enums");
const criar_prisma_client_1 = require("../prisma/criar-prisma-client");
const prisma = (0, criar_prisma_client_1.criarPrismaClient)();
async function main() {
    const tipos = [
        { id: enums_1.EStatusGeral.Ativo, descricao: 'Ativo' },
        { id: enums_1.EStatusGeral.Inativo, descricao: 'Inativo' },
        { id: enums_1.EPerfilUsuario.SuperAdmin, descricao: 'Super Administrador' },
        { id: enums_1.EPerfilUsuario.Admin, descricao: 'Administrador' },
        { id: enums_1.EPerfilUsuario.Usuario, descricao: 'Usuário Comum' },
        { id: enums_1.EStatusPedido.Aberto, descricao: 'Pedido Aberto' },
        { id: enums_1.EStatusPedido.EmProducao, descricao: 'Pedido em Produção' },
        { id: enums_1.EStatusPedido.Concluido, descricao: 'Pedido Concluído' },
        { id: enums_1.EStatusPedido.Cancelado, descricao: 'Pedido Cancelado' },
        { id: enums_1.ETipoItemPedido.Produto, descricao: 'Item: Produto' },
        { id: enums_1.ETipoItemPedido.Corte, descricao: 'Item: Corte/Chapa' },
        { id: enums_1.ETipoItemPedido.Servico, descricao: 'Item: Serviço' },
    ];
    for (const tipo of tipos) {
        await prisma.tipo.upsert({ where: { id: tipo.id }, update: { descricao: tipo.descricao }, create: tipo });
    }
    const empresa = await prisma.empresa.upsert({
        where: { cnpj: '00000000000000' },
        update: {},
        create: { razao_social: 'Sistema Calhas', nome_fantasia: 'Sistema', cnpj: '00000000000000', ativo: 1, data_expiracao: null },
    });
    const email = process.env['SUPER_ADMIN_EMAIL'] || 'super@calhas.com';
    const existente = await prisma.usuario.findFirst({ where: { email } });
    if (!existente) {
        const senhaInformada = process.env['SUPER_ADMIN_SENHA'];
        const senha = senhaInformada || (0, node_crypto_1.randomBytes)(9).toString('base64url');
        await prisma.usuario.create({
            data: {
                nome: 'Super Administrador',
                email,
                senha: await bcrypt_1.default.hash(senha, 10),
                status: enums_1.EStatusGeral.Ativo,
                admin: true,
                super_admin: true,
                cod_empresa: empresa.id,
            },
        });
        console.log(senhaInformada
            ? `[seed] Super administrador criado: ${email} (senha de SUPER_ADMIN_SENHA).`
            : `[seed] Super administrador criado: ${email} / senha provisória: ${senha} (troque no primeiro acesso).`);
    }
    console.log('[seed] Concluído.');
}
main()
    .catch((erro) => {
    console.error('[seed] Falhou:', erro);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map