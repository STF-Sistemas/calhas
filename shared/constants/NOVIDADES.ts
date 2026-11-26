import { INovidade } from '../interfaces/INovidade';

/**
 * Histórico de novidades exibido na tela "Novidades do Calhas Pro".
 *
 * ⚠️ ATUALIZAR ANTES DE CADA COMMIT (rule `.agents/rules/novidades-antes-do-commit.md`):
 * - Adicione uma nova entrada NO TOPO da lista.
 * - Nova funcionalidade → sobe o número do meio (1.7.0 → 1.8.0).
 *   Correção/ajuste pequeno → sobe o último número (1.7.0 → 1.7.1).
 * - Escreva para o usuário final: o que mudou, onde fica e por que ajuda.
 *
 * A primeira entrada é a versão atual do sistema.
 */
export const NOVIDADES: INovidade[] = [
  {
    versao: '1.8.0',
    data: '26/11/2026',
    itens: [
      'Celular: os campos de número agora abrem o teclado numérico. Valores, medidas e quantidades mostram o teclado com vírgula; CPF, CNPJ, CEP e telefone mostram só os números.',
      'Campos de valor e medida aceitam vírgula ou ponto: digite 1,33 direto. Continua valendo digitar só os números (133 vira 1,33). Antes, em alguns celulares Android, os números digitados não entravam no campo.',
    ],
  },
  {
    versao: '1.7.0',
    data: '26/11/2026',
    itens: [
      'Nova tela de Novidades: sempre que o sistema for atualizado ela aparece mostrando o que mudou em cada versão. Para ver de novo depois, use o botão de presente no topo da tela.',
    ],
  },
  {
    versao: '1.6.0',
    data: '26/11/2026',
    itens: [
      'Pedido › item de Corte: nova opção "Desenhar". Desenhe o perfil com o dedo ou o mouse, mesmo torto — ao soltar, as linhas ficam retas sozinhas. Não precisa mais cadastrar o desenho antes.',
      'Linha transversal: depois do desenho pronto, um traço feito por cima vira uma transversal com duas medidas (P1 e P2). Na soma entra só a maior, e a linha que ela cobre deixa de contar.',
      'Medidas escritas à mão: no modo "Escrever medida", escreva o número em cima do desenho (ex.: 1,33) e ele vai sozinho para a próxima medida livre. Para corrigir, toque no número da linha e escreva de novo, ou digite no campo ao lado.',
      'O corte é escolhido automaticamente pelo total das medidas, e o desenho aparece na impressão e no link enviado ao fornecedor.',
    ],
  },
  {
    versao: '1.5.0',
    data: '01/09/2026',
    itens: [
      'Fornecedores: agora dá para cadastrar o vendedor de cada fornecedor.',
      'Envio da ordem de corte ao fornecedor: escolha o fornecedor e quais itens enviar; ele recebe um link com os produtos e os cortes com desenho e medidas.',
    ],
  },
  {
    versao: '1.4.0',
    data: '27/08/2026',
    itens: [
      'Desconto no pedido em R$ ou em %, com o total líquido calculado na hora.',
      'Orçamento pelo link: o cliente vê o orçamento e aprova com assinatura na tela.',
      'Notificações no sino do topo, inclusive no celular (push), por exemplo quando um orçamento é aprovado.',
      'Logo da empresa nos orçamentos e impressões.',
    ],
  },
  {
    versao: '1.3.0',
    data: '18/05/2026',
    itens: [
      'O Calhas Pro pode ser instalado como aplicativo no celular e no computador.',
    ],
  },
  {
    versao: '1.2.1',
    data: '17/05/2026',
    itens: [
      'Cadastro de desenhos mais fácil de usar no celular.',
    ],
  },
  {
    versao: '1.2.0',
    data: '04/05/2026',
    itens: [
      'Ajustes no desenho dos cortes e na impressão dos desenhos do pedido.',
    ],
  },
  {
    versao: '1.1.0',
    data: '22/04/2026',
    itens: [
      'Medidas do desenho com diagonais (duas pontas, vale a maior) e escolha automática do corte pelo total.',
      'Relatório de Pedidos / Lucros revisado.',
      'Tecla Enter passa para o próximo campo nos formulários.',
    ],
  },
  {
    versao: '1.0.0',
    data: '14/04/2026',
    itens: [
      'Primeira versão liberada: pedidos, clientes, produtos, chapas e cortes, desenhos, serviços, entrada de estoque e relatórios.',
    ],
  },
];

/** Versão atual do sistema (a mais recente das novidades). */
export const VERSAO_ATUAL: string = NOVIDADES[0].versao;
