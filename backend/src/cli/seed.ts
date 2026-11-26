import '../carregar-env';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { EPerfilUsuario, EStatusGeral, EStatusPedido, ETipoItemPedido } from '#shared/enums';
import { criarPrismaClient } from '../prisma/criar-prisma-client';

/**
 * Seed idempotente: roda a cada início do app (discloud-start.mjs).
 * Cria os tipos de referência, a empresa do sistema e o super administrador,
 * sem nunca sobrescrever a senha de um usuário que já existe.
 */
const prisma = criarPrismaClient();

async function main(): Promise<void> {
  const tipos = [
    { id: EStatusGeral.Ativo, descricao: 'Ativo' },
    { id: EStatusGeral.Inativo, descricao: 'Inativo' },
    { id: EPerfilUsuario.SuperAdmin, descricao: 'Super Administrador' },
    { id: EPerfilUsuario.Admin, descricao: 'Administrador' },
    { id: EPerfilUsuario.Usuario, descricao: 'Usuário Comum' },
    { id: EStatusPedido.Aberto, descricao: 'Pedido Aberto' },
    { id: EStatusPedido.EmProducao, descricao: 'Pedido em Produção' },
    { id: EStatusPedido.Concluido, descricao: 'Pedido Concluído' },
    { id: EStatusPedido.Cancelado, descricao: 'Pedido Cancelado' },
    { id: ETipoItemPedido.Produto, descricao: 'Item: Produto' },
    { id: ETipoItemPedido.Corte, descricao: 'Item: Corte/Chapa' },
    { id: ETipoItemPedido.Servico, descricao: 'Item: Serviço' },
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
    const senha = senhaInformada || randomBytes(9).toString('base64url');
    await prisma.usuario.create({
      data: {
        nome: 'Super Administrador',
        email,
        senha: await bcrypt.hash(senha, 10),
        status: EStatusGeral.Ativo,
        admin: true,
        super_admin: true,
        cod_empresa: empresa.id,
      },
    });
    console.log(
      senhaInformada
        ? `[seed] Super administrador criado: ${email} (senha de SUPER_ADMIN_SENHA).`
        : `[seed] Super administrador criado: ${email} / senha provisória: ${senha} (troque no primeiro acesso).`,
    );
  }
  console.log('[seed] Concluído.');
}

main()
  .catch((erro) => {
    console.error('[seed] Falhou:', erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
