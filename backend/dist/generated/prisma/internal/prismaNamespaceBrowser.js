"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.NullableJsonNullValueInput = exports.SortOrder = exports.PedidoItemScalarFieldEnum = exports.CompraItemScalarFieldEnum = exports.CompraXmlScalarFieldEnum = exports.CompraScalarFieldEnum = exports.FornecedorScalarFieldEnum = exports.DesenhoScalarFieldEnum = exports.MeioPagamentoScalarFieldEnum = exports.NotificacaoScalarFieldEnum = exports.PedidoScalarFieldEnum = exports.ServicoScalarFieldEnum = exports.CorteScalarFieldEnum = exports.ChapaScalarFieldEnum = exports.ProdutoFornecedorScalarFieldEnum = exports.ProdutoScalarFieldEnum = exports.ClienteScalarFieldEnum = exports.PagamentoPixScalarFieldEnum = exports.EmpresaScalarFieldEnum = exports.CidadeScalarFieldEnum = exports.PushSubscriptionScalarFieldEnum = exports.UsuarioScalarFieldEnum = exports.TipoScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.Decimal = void 0;
const runtime = __importStar(require("@prisma/client/runtime/index-browser"));
exports.Decimal = runtime.Decimal;
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    Tipo: 'Tipo',
    Usuario: 'Usuario',
    PushSubscription: 'PushSubscription',
    Cidade: 'Cidade',
    Empresa: 'Empresa',
    PagamentoPix: 'PagamentoPix',
    Cliente: 'Cliente',
    Produto: 'Produto',
    ProdutoFornecedor: 'ProdutoFornecedor',
    Chapa: 'Chapa',
    Corte: 'Corte',
    Servico: 'Servico',
    Pedido: 'Pedido',
    Notificacao: 'Notificacao',
    MeioPagamento: 'MeioPagamento',
    Desenho: 'Desenho',
    Fornecedor: 'Fornecedor',
    Compra: 'Compra',
    CompraXml: 'CompraXml',
    CompraItem: 'CompraItem',
    PedidoItem: 'PedidoItem'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.TipoScalarFieldEnum = {
    id: 'id',
    descricao: 'descricao'
};
exports.UsuarioScalarFieldEnum = {
    id: 'id',
    nome: 'nome',
    email: 'email',
    senha: 'senha',
    status: 'status',
    data_criacao: 'data_criacao',
    admin: 'admin',
    super_admin: 'super_admin',
    cod_empresa: 'cod_empresa',
    excluido: 'excluido',
    reset_token: 'reset_token',
    reset_token_expiracao: 'reset_token_expiracao',
    token_versao: 'token_versao'
};
exports.PushSubscriptionScalarFieldEnum = {
    id: 'id',
    cod_usuario: 'cod_usuario',
    endpoint: 'endpoint',
    p256dh: 'p256dh',
    auth: 'auth',
    user_agent: 'user_agent',
    created_at: 'created_at'
};
exports.CidadeScalarFieldEnum = {
    id: 'id',
    descricao: 'descricao',
    uf: 'uf',
    codigo_ibge: 'codigo_ibge'
};
exports.EmpresaScalarFieldEnum = {
    id: 'id',
    razao_social: 'razao_social',
    nome_fantasia: 'nome_fantasia',
    cnpj: 'cnpj',
    email: 'email',
    telefone: 'telefone',
    data_expiracao: 'data_expiracao',
    valor_mensalidade: 'valor_mensalidade',
    validar_estoque: 'validar_estoque',
    quantidade_desenho_por_folha: 'quantidade_desenho_por_folha',
    ativo: 'ativo',
    excluido: 'excluido',
    created_at: 'created_at',
    updated_at: 'updated_at',
    cep: 'cep',
    endereco: 'endereco',
    numero: 'numero',
    bairro: 'bairro',
    complemento: 'complemento',
    marca_dagua: 'marca_dagua',
    logo_url: 'logo_url',
    whatsapp_mensagem_padrao: 'whatsapp_mensagem_padrao',
    link_validade_dias: 'link_validade_dias',
    cod_cidade: 'cod_cidade'
};
exports.PagamentoPixScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    mp_payment_id: 'mp_payment_id',
    valor: 'valor',
    status: 'status',
    qr_code: 'qr_code',
    qr_code_base64: 'qr_code_base64',
    created_at: 'created_at',
    pago_em: 'pago_em'
};
exports.ClienteScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    razao_social: 'razao_social',
    nome_fantasia: 'nome_fantasia',
    cpf_cnpj: 'cpf_cnpj',
    email: 'email',
    telefone: 'telefone',
    ativo: 'ativo',
    excluido: 'excluido',
    created_at: 'created_at',
    updated_at: 'updated_at',
    cep: 'cep',
    endereco: 'endereco',
    numero: 'numero',
    bairro: 'bairro',
    complemento: 'complemento',
    cod_cidade: 'cod_cidade',
    observacoes: 'observacoes'
};
exports.ProdutoScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    descricao: 'descricao',
    unidade_medida: 'unidade_medida',
    valor_unitario: 'valor_unitario',
    custo: 'custo',
    markup: 'markup',
    estoque_atual: 'estoque_atual',
    ncm: 'ncm',
    cest: 'cest',
    gtin: 'gtin',
    cfop_padrao: 'cfop_padrao',
    origem: 'origem',
    status: 'status',
    excluido: 'excluido'
};
exports.ProdutoFornecedorScalarFieldEnum = {
    id: 'id',
    cod_produto: 'cod_produto',
    cod_fornecedor: 'cod_fornecedor',
    codigo_produto_fornecedor: 'codigo_produto_fornecedor'
};
exports.ChapaScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    descricao: 'descricao',
    status: 'status',
    excluido: 'excluido'
};
exports.CorteScalarFieldEnum = {
    id: 'id',
    cod_chapa: 'cod_chapa',
    descricao: 'descricao',
    corte: 'corte',
    valor: 'valor',
    status: 'status',
    excluido: 'excluido'
};
exports.ServicoScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    descricao: 'descricao',
    valor: 'valor',
    status: 'status',
    excluido: 'excluido'
};
exports.PedidoScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    cod_cliente: 'cod_cliente',
    cod_meio_pagamento: 'cod_meio_pagamento',
    data_pedido: 'data_pedido',
    status: 'status',
    valor_material: 'valor_material',
    valor_servico: 'valor_servico',
    valor_total: 'valor_total',
    desconto_tipo: 'desconto_tipo',
    desconto_valor: 'desconto_valor',
    valor_desconto: 'valor_desconto',
    valor_liquido: 'valor_liquido',
    observacoes: 'observacoes',
    observacoes_cliente: 'observacoes_cliente',
    excluido: 'excluido',
    estoque_baixado: 'estoque_baixado',
    token_acesso: 'token_acesso',
    token_expiracao: 'token_expiracao',
    token_acesso_corte: 'token_acesso_corte',
    token_expiracao_corte: 'token_expiracao_corte',
    itens_corte_selecionados: 'itens_corte_selecionados',
    aprovacao_status: 'aprovacao_status',
    aprovacao_data: 'aprovacao_data',
    aprovacao_assinatura: 'aprovacao_assinatura',
    aprovacao_ip: 'aprovacao_ip',
    recusa_motivo: 'recusa_motivo',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.NotificacaoScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    cod_pedido: 'cod_pedido',
    tipo: 'tipo',
    titulo: 'titulo',
    mensagem: 'mensagem',
    lida: 'lida',
    lida_em: 'lida_em',
    created_at: 'created_at'
};
exports.MeioPagamentoScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    descricao: 'descricao',
    ativo: 'ativo',
    excluido: 'excluido'
};
exports.DesenhoScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    descricao: 'descricao',
    pontos: 'pontos',
    diagonais: 'diagonais',
    status: 'status',
    excluido: 'excluido',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.FornecedorScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    razao_social: 'razao_social',
    nome_fantasia: 'nome_fantasia',
    cnpj: 'cnpj',
    ie: 'ie',
    iest: 'iest',
    im: 'im',
    crt: 'crt',
    email: 'email',
    fone: 'fone',
    nome_vendedor: 'nome_vendedor',
    fone_vendedor: 'fone_vendedor',
    cep: 'cep',
    logradouro: 'logradouro',
    numero: 'numero',
    complemento: 'complemento',
    bairro: 'bairro',
    cod_cidade: 'cod_cidade',
    status: 'status',
    excluido: 'excluido'
};
exports.CompraScalarFieldEnum = {
    id: 'id',
    cod_empresa: 'cod_empresa',
    cod_fornecedor: 'cod_fornecedor',
    numero_nfe: 'numero_nfe',
    serie: 'serie',
    chave_acesso: 'chave_acesso',
    data_emissao: 'data_emissao',
    data_entrada: 'data_entrada',
    valor_produtos: 'valor_produtos',
    valor_frete: 'valor_frete',
    valor_seguro: 'valor_seguro',
    valor_desconto: 'valor_desconto',
    valor_outros: 'valor_outros',
    valor_ipi: 'valor_ipi',
    valor_total: 'valor_total',
    status: 'status',
    observacao: 'observacao',
    motivo_cancelamento: 'motivo_cancelamento',
    excluido: 'excluido'
};
exports.CompraXmlScalarFieldEnum = {
    id: 'id',
    cod_compra: 'cod_compra',
    xml_content: 'xml_content',
    created_at: 'created_at'
};
exports.CompraItemScalarFieldEnum = {
    id: 'id',
    cod_compra: 'cod_compra',
    cod_produto: 'cod_produto',
    descricao_xml: 'descricao_xml',
    descricao: 'descricao',
    ncm: 'ncm',
    cfop: 'cfop',
    unidade: 'unidade',
    quantidade: 'quantidade',
    valor_unitario: 'valor_unitario',
    valor_total: 'valor_total',
    desconto: 'desconto',
    base_icms: 'base_icms',
    aliq_icms: 'aliq_icms',
    valor_icms: 'valor_icms',
    base_icms_st: 'base_icms_st',
    valor_icms_st: 'valor_icms_st',
    valor_ipi: 'valor_ipi',
    aliq_pis: 'aliq_pis',
    valor_pis: 'valor_pis',
    aliq_cofins: 'aliq_cofins',
    valor_cofins: 'valor_cofins',
    rateio_frete: 'rateio_frete',
    rateio_seguro: 'rateio_seguro',
    rateio_outros: 'rateio_outros',
    rateio_desconto: 'rateio_desconto',
    custo_unitario: 'custo_unitario',
    excluido: 'excluido'
};
exports.PedidoItemScalarFieldEnum = {
    id: 'id',
    cod_pedido: 'cod_pedido',
    cod_produto: 'cod_produto',
    cod_servico: 'cod_servico',
    cod_corte: 'cod_corte',
    cod_desenho: 'cod_desenho',
    tipo: 'tipo',
    quantidade: 'quantidade',
    valor_unitario: 'valor_unitario',
    valor_total: 'valor_total',
    custo_unitario: 'custo_unitario',
    observacoes: 'observacoes',
    medidas: 'medidas',
    desenho_pontos: 'desenho_pontos',
    desenho_diagonais: 'desenho_diagonais'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullableJsonNullValueInput = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull
};
exports.JsonNullValueInput = {
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map