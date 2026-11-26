import { INovidade } from '../interfaces/INovidade';

export const NOVIDADES: INovidade[] = [
  {
    versao: '2.0.0',
    data: '26/11/2026',
    itens: [
      'Celular: novo menu fixo na parte de baixo da tela com Início, Pedidos, Clientes e Menu. No meio fica o botão grande "Novo pedido", que já abre o formulário.',
      'Celular: o botão Menu abre todas as telas do sistema com seu nome no topo, e lá embaixo dá para trocar entre modo claro e escuro e escolher a cor.',
      'Celular: as listas (clientes, pedidos, produtos e outras) agora aparecem em cartões, um embaixo do outro, com o nome do campo ao lado de cada informação. Não precisa mais arrastar a tabela para o lado.',
      'Celular: os formulários abrem em tela cheia, com os botões Salvar e Cancelar grandes no rodapé. Os campos ficaram maiores e o iPhone não dá mais zoom ao tocar num campo.',
      'Computador: menu lateral mais limpo, fixo à esquerda, e o botão de menu no topo esconde ou mostra o menu.',
      'Painel inicial mais enxuto no celular: os indicadores aparecem lado a lado. O botão "Novo Pedido" do painel agora já abre o formulário.',
      'App instalado: o ícone ficou certinho no Android, e ao segurar o ícone aparecem atalhos para Novo pedido, Pedidos e Clientes. O convite para instalar o app aparece no celular.',
      'Segurança: os dados de clientes e pedidos não ficam mais guardados no aparelho depois de sair do sistema.',
    ],
  },
  {
    versao: '1.9.2',
    data: '26/11/2026',
    itens: [
      'A tela de entrada abre mais rápido: ela já chega pronta do servidor, sem esperar o sistema carregar inteiro.',
      'A fonte das letras agora vem junto com o sistema, sem depender de serviços de fora: as telas aparecem com a letra certa desde o primeiro instante.',
    ],
  },
  {
    versao: '1.9.1',
    data: '26/11/2026',
    itens: [
      'Avisos de "salvo", "excluído" e de erro com visual novo: aparecem no topo, cabem na tela do celular e somem sozinhos. Dá para fechar no X.',
      'Perguntas de confirmação (excluir, confirmar compra, mudar status do pedido) com janela nova, botões grandes para o dedo e destaque em vermelho quando a ação apaga algo.',
      'Impressão: quando o navegador bloqueia a janela de impressão, o sistema agora avisa na própria tela como liberar, em vez de uma caixa de alerta.',
    ],
  },
  {
    versao: '1.9.0',
    data: '26/11/2026',
    itens: [
      'Servidor do sistema reescrito: respostas mais rápidas e compactadas, menos memória e proteção reforçada contra acessos indevidos entre empresas.',
      'Pesquisa de clientes e fornecedores agora ignora acentos: buscar "Joao" encontra "João".',
      'Pagamento da licença por Pix ficou à prova de confirmação dupla: cada pagamento prorroga a licença uma única vez.',
    ],
  },
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
      'Pedido › item de Corte: nova opção "Desenhar". Desenhe o perfil com o dedo ou o mouse, mesmo torto: ao soltar, as linhas ficam retas sozinhas. Não precisa mais cadastrar o desenho antes.',
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

export const VERSAO_ATUAL: string = NOVIDADES[0].versao;
