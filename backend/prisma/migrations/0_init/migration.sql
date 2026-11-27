-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "calhas";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "conf";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "util";

-- CreateTable
CREATE TABLE "util"."tipos" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(50) NOT NULL,

    CONSTRAINT "tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conf"."usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "super_admin" BOOLEAN NOT NULL DEFAULT false,
    "cod_empresa" INTEGER,
    "excluido" BOOLEAN NOT NULL DEFAULT false,
    "reset_token" VARCHAR(255),
    "reset_token_expiracao" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conf"."push_subscriptions" (
    "id" SERIAL NOT NULL,
    "cod_usuario" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."cidades" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(150) NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "codigo_ibge" VARCHAR(10) NOT NULL,

    CONSTRAINT "cidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."empresas" (
    "id" SERIAL NOT NULL,
    "razao_social" VARCHAR(200) NOT NULL,
    "nome_fantasia" VARCHAR(200),
    "cnpj" VARCHAR(20) NOT NULL,
    "email" VARCHAR(200),
    "telefone" VARCHAR(20),
    "data_expiracao" TIMESTAMP(3),
    "valor_mensalidade" DECIMAL(10,2) NOT NULL DEFAULT 150,
    "validar_estoque" BOOLEAN NOT NULL DEFAULT false,
    "quantidade_desenho_por_folha" INTEGER NOT NULL DEFAULT 5,
    "ativo" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cep" VARCHAR(10),
    "endereco" VARCHAR(200),
    "numero" VARCHAR(10),
    "bairro" VARCHAR(100),
    "complemento" VARCHAR(100),
    "marca_dagua" VARCHAR(250),
    "logo_url" TEXT,
    "whatsapp_mensagem_padrao" TEXT,
    "link_validade_dias" INTEGER NOT NULL DEFAULT 7,
    "cod_cidade" INTEGER,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."pagamentos_pix" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "mp_payment_id" VARCHAR(100),
    "valor" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pendente',
    "qr_code" TEXT,
    "qr_code_base64" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pago_em" TIMESTAMP(3),

    CONSTRAINT "pagamentos_pix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."clientes" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "razao_social" VARCHAR(200) NOT NULL,
    "nome_fantasia" VARCHAR(200),
    "cpf_cnpj" VARCHAR(20),
    "email" VARCHAR(200),
    "telefone" VARCHAR(20),
    "ativo" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cep" VARCHAR(10),
    "endereco" VARCHAR(200),
    "numero" VARCHAR(10),
    "bairro" VARCHAR(100),
    "complemento" VARCHAR(100),
    "cod_cidade" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."produtos" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "unidade_medida" VARCHAR(10) NOT NULL,
    "valor_unitario" DECIMAL(10,4) NOT NULL,
    "custo" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "markup" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "estoque_atual" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "ncm" VARCHAR(10),
    "cest" VARCHAR(7),
    "gtin" VARCHAR(14),
    "cfop_padrao" VARCHAR(5),
    "origem" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."produtos_fornecedor" (
    "id" SERIAL NOT NULL,
    "cod_produto" INTEGER NOT NULL,
    "cod_fornecedor" INTEGER NOT NULL,
    "codigo_produto_fornecedor" VARCHAR(60) NOT NULL,

    CONSTRAINT "produtos_fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."chapas" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."cortes" (
    "id" SERIAL NOT NULL,
    "cod_chapa" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "corte" DECIMAL(10,4) NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cortes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."servicos" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."pedidos" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "cod_cliente" INTEGER NOT NULL,
    "cod_meio_pagamento" INTEGER,
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 6,
    "valor_material" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "valor_servico" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "desconto_tipo" INTEGER NOT NULL DEFAULT 1,
    "desconto_valor" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "valor_desconto" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "valor_liquido" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "excluido" BOOLEAN NOT NULL DEFAULT false,
    "estoque_baixado" BOOLEAN NOT NULL DEFAULT false,
    "token_acesso" VARCHAR(100),
    "token_expiracao" TIMESTAMP(3),
    "token_acesso_corte" VARCHAR(100),
    "token_expiracao_corte" TIMESTAMP(3),
    "itens_corte_selecionados" JSONB,
    "aprovacao_status" INTEGER NOT NULL DEFAULT 0,
    "aprovacao_data" TIMESTAMP(3),
    "aprovacao_assinatura" TEXT,
    "aprovacao_ip" VARCHAR(45),
    "recusa_motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."notificacoes" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "cod_pedido" INTEGER,
    "tipo" VARCHAR(40) NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "lida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."meios_pagamento" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "ativo" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "meios_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."desenhos" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "pontos" JSONB NOT NULL DEFAULT '[]',
    "diagonais" JSONB NOT NULL DEFAULT '[]',
    "status" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desenhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."fornecedores" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "razao_social" VARCHAR(200) NOT NULL,
    "nome_fantasia" VARCHAR(200),
    "cnpj" VARCHAR(14) NOT NULL,
    "ie" VARCHAR(20),
    "iest" VARCHAR(20),
    "im" VARCHAR(20),
    "crt" INTEGER NOT NULL DEFAULT 1,
    "email" VARCHAR(200),
    "fone" VARCHAR(20),
    "nome_vendedor" VARCHAR(200),
    "fone_vendedor" VARCHAR(20),
    "cep" VARCHAR(8),
    "logradouro" VARCHAR(200),
    "numero" VARCHAR(20),
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100),
    "cod_cidade" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 1,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."compras" (
    "id" SERIAL NOT NULL,
    "cod_empresa" INTEGER NOT NULL,
    "cod_fornecedor" INTEGER NOT NULL,
    "numero_nfe" VARCHAR(20),
    "serie" VARCHAR(5),
    "chave_acesso" VARCHAR(44),
    "data_emissao" TIMESTAMP(3),
    "data_entrada" TIMESTAMP(3),
    "valor_produtos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_frete" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_seguro" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_outros" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_ipi" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "observacao" VARCHAR(500),
    "motivo_cancelamento" VARCHAR(500),
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."compras_xml" (
    "id" SERIAL NOT NULL,
    "cod_compra" INTEGER NOT NULL,
    "xml_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_xml_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."compras_itens" (
    "id" SERIAL NOT NULL,
    "cod_compra" INTEGER NOT NULL,
    "cod_produto" INTEGER NOT NULL,
    "descricao_xml" VARCHAR(200),
    "descricao" VARCHAR(200) NOT NULL,
    "ncm" VARCHAR(10),
    "cfop" VARCHAR(5),
    "unidade" VARCHAR(10) NOT NULL,
    "quantidade" DECIMAL(10,4) NOT NULL,
    "valor_unitario" DECIMAL(10,4) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "base_icms" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "aliq_icms" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valor_icms" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "base_icms_st" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_icms_st" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_ipi" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "aliq_pis" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "valor_pis" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "aliq_cofins" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "valor_cofins" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rateio_frete" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "rateio_seguro" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "rateio_outros" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "rateio_desconto" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "custo_unitario" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "excluido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "compras_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calhas"."pedidos_itens" (
    "id" SERIAL NOT NULL,
    "cod_pedido" INTEGER NOT NULL,
    "cod_produto" INTEGER,
    "cod_servico" INTEGER,
    "cod_corte" INTEGER,
    "cod_desenho" INTEGER,
    "tipo" INTEGER NOT NULL DEFAULT 1,
    "quantidade" DECIMAL(10,4) NOT NULL,
    "valor_unitario" DECIMAL(10,4) NOT NULL,
    "valor_total" DECIMAL(10,4) NOT NULL,
    "custo_unitario" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "medidas" JSONB,
    "desenho_pontos" JSONB,
    "desenho_diagonais" JSONB,

    CONSTRAINT "pedidos_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "conf"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_cod_usuario_endpoint_key" ON "conf"."push_subscriptions"("cod_usuario", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "calhas"."empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_fornecedor_cod_fornecedor_codigo_produto_fornecedo_key" ON "calhas"."produtos_fornecedor"("cod_fornecedor", "codigo_produto_fornecedor");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_token_acesso_key" ON "calhas"."pedidos"("token_acesso");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_token_acesso_corte_key" ON "calhas"."pedidos"("token_acesso_corte");

-- CreateIndex
CREATE INDEX "notificacoes_cod_empresa_lida_idx" ON "calhas"."notificacoes"("cod_empresa", "lida");

-- CreateIndex
CREATE UNIQUE INDEX "compras_xml_cod_compra_key" ON "calhas"."compras_xml"("cod_compra");

-- AddForeignKey
ALTER TABLE "conf"."usuarios" ADD CONSTRAINT "usuarios_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conf"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_cod_usuario_fkey" FOREIGN KEY ("cod_usuario") REFERENCES "conf"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."empresas" ADD CONSTRAINT "empresas_cod_cidade_fkey" FOREIGN KEY ("cod_cidade") REFERENCES "calhas"."cidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pagamentos_pix" ADD CONSTRAINT "pagamentos_pix_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."clientes" ADD CONSTRAINT "clientes_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."clientes" ADD CONSTRAINT "clientes_cod_cidade_fkey" FOREIGN KEY ("cod_cidade") REFERENCES "calhas"."cidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."produtos" ADD CONSTRAINT "produtos_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."produtos_fornecedor" ADD CONSTRAINT "produtos_fornecedor_cod_produto_fkey" FOREIGN KEY ("cod_produto") REFERENCES "calhas"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."produtos_fornecedor" ADD CONSTRAINT "produtos_fornecedor_cod_fornecedor_fkey" FOREIGN KEY ("cod_fornecedor") REFERENCES "calhas"."fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."chapas" ADD CONSTRAINT "chapas_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."cortes" ADD CONSTRAINT "cortes_cod_chapa_fkey" FOREIGN KEY ("cod_chapa") REFERENCES "calhas"."chapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."servicos" ADD CONSTRAINT "servicos_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos" ADD CONSTRAINT "pedidos_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos" ADD CONSTRAINT "pedidos_cod_cliente_fkey" FOREIGN KEY ("cod_cliente") REFERENCES "calhas"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos" ADD CONSTRAINT "pedidos_cod_meio_pagamento_fkey" FOREIGN KEY ("cod_meio_pagamento") REFERENCES "calhas"."meios_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."notificacoes" ADD CONSTRAINT "notificacoes_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."notificacoes" ADD CONSTRAINT "notificacoes_cod_pedido_fkey" FOREIGN KEY ("cod_pedido") REFERENCES "calhas"."pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."meios_pagamento" ADD CONSTRAINT "meios_pagamento_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."desenhos" ADD CONSTRAINT "desenhos_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."fornecedores" ADD CONSTRAINT "fornecedores_cod_empresa_fkey" FOREIGN KEY ("cod_empresa") REFERENCES "calhas"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."fornecedores" ADD CONSTRAINT "fornecedores_cod_cidade_fkey" FOREIGN KEY ("cod_cidade") REFERENCES "calhas"."cidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."compras" ADD CONSTRAINT "compras_cod_fornecedor_fkey" FOREIGN KEY ("cod_fornecedor") REFERENCES "calhas"."fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."compras_xml" ADD CONSTRAINT "compras_xml_cod_compra_fkey" FOREIGN KEY ("cod_compra") REFERENCES "calhas"."compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."compras_itens" ADD CONSTRAINT "compras_itens_cod_compra_fkey" FOREIGN KEY ("cod_compra") REFERENCES "calhas"."compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."compras_itens" ADD CONSTRAINT "compras_itens_cod_produto_fkey" FOREIGN KEY ("cod_produto") REFERENCES "calhas"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos_itens" ADD CONSTRAINT "pedidos_itens_cod_pedido_fkey" FOREIGN KEY ("cod_pedido") REFERENCES "calhas"."pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos_itens" ADD CONSTRAINT "pedidos_itens_cod_produto_fkey" FOREIGN KEY ("cod_produto") REFERENCES "calhas"."produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos_itens" ADD CONSTRAINT "pedidos_itens_cod_servico_fkey" FOREIGN KEY ("cod_servico") REFERENCES "calhas"."servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos_itens" ADD CONSTRAINT "pedidos_itens_cod_corte_fkey" FOREIGN KEY ("cod_corte") REFERENCES "calhas"."cortes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calhas"."pedidos_itens" ADD CONSTRAINT "pedidos_itens_cod_desenho_fkey" FOREIGN KEY ("cod_desenho") REFERENCES "calhas"."desenhos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

