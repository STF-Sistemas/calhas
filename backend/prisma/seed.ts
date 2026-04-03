import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { EStatusGeral, EPerfilUsuario, EStatusPedido, ETipoItemPedido } from '#shared/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Tipos (util schema) - Todos os Enums do sistema
  const tipos = [
    // EStatusGeral
    { id: EStatusGeral.Ativo, descricao: 'Ativo' },
    { id: EStatusGeral.Inativo, descricao: 'Inativo' },
    
    // EPerfilUsuario
    { id: EPerfilUsuario.SuperAdmin, descricao: 'Super Administrador' },
    { id: EPerfilUsuario.Admin, descricao: 'Administrador' },
    { id: EPerfilUsuario.Usuario, descricao: 'Usuário Comum' },
    
    // EStatusPedido
    { id: EStatusPedido.Aberto, descricao: 'Pedido Aberto' },
    { id: EStatusPedido.EmProducao, descricao: 'Pedido em Produção' },
    { id: EStatusPedido.Concluido, descricao: 'Pedido Concluído' },
    { id: EStatusPedido.Cancelado, descricao: 'Pedido Cancelado' },
    
    // ETipoItemPedido
    { id: ETipoItemPedido.Produto, descricao: 'Item: Produto' },
    { id: ETipoItemPedido.Corte, descricao: 'Item: Corte/Chapa' },
    { id: ETipoItemPedido.Servico, descricao: 'Item: Serviço' },
  ];

  for (const tipo of tipos) {
    await prisma.tipo.upsert({
      where: { id: tipo.id },
      update: { descricao: tipo.descricao },
      create: { id: tipo.id, descricao: tipo.descricao },
    });
  }
  
  console.log(`✅ ${tipos.length} tipos inseridos no schema util`);

  // Superusuário global
  const senhaHash = await bcrypt.hash('admin@2024', 10);
  await prisma.usuario.upsert({
    where: { email: 'super@calhas.com' },
    update: {},
    create: {
      nome: 'Super Administrador',
      email: 'super@calhas.com',
      senha: senhaHash,
      status: EStatusGeral.Ativo,
      admin: true,
      super_admin: true,
      cod_empresa: null,
    },
  });
  console.log('✅ Superusuário criado: super@calhas.com / admin@2024');

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
