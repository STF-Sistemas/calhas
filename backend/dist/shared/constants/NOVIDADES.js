"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSAO_ATUAL = exports.NOVIDADES = void 0;
exports.NOVIDADES = [
    {
        versao: '2.3.1',
        data: '27/11/2026',
        itens: [
            'Empresas › Nova empresa: o cadastro voltou a salvar. Antes o botão Salvar não fazia nada. Agora o formulário já vem com valores padrão e, se faltar algum campo, aparece um aviso dizendo qual é e a tela vai direto para a aba certa.',
            'Empresas e Minha Empresa › abas: cada aba mostra só o seu conteúdo. Antes a aba Configurações aparecia junto com os Dados da Empresa.',
            'Empresas: ao informar um CNPJ que já está cadastrado, aparece um aviso claro em vez de "Erro interno do servidor".',
        ],
    },
    {
        versao: '2.3.0',
        data: '27/11/2026',
        itens: [
            'Pedido: novo campo "Observações para o Cliente". Só ele aparece no link do orçamento enviado ao cliente. As "Observações Internas" agora ficam visíveis apenas para a sua equipe.',
            'Atenção: pedidos antigos que usavam as Observações Internas para recados ao cliente precisam ter o texto copiado para o novo campo, se quiser que o cliente continue vendo.',
            'Meu Perfil: para trocar o e-mail, agora é preciso confirmar a senha atual. Ao trocar, as sessões abertas em outros aparelhos são encerradas.',
            'Acesso: depois de 10 senhas erradas seguidas no mesmo e-mail, o login fica bloqueado por 15 minutos. Use "Esqueci minha senha" se precisar entrar antes.',
            'Escritórios com várias pessoas na mesma internet não recebem mais erros por "excesso de acessos": o limite agora é contado por usuário, e não pela conexão.',
            'Atualização automática dos pedidos: a conexão se encerra sozinha quando o usuário é desativado ou a senha é trocada.',
        ],
    },
    {
        versao: '2.2.0',
        data: '27/11/2026',
        itens: [
            'Pedidos e Início: quando o cliente autoriza ou recusa o orçamento pelo link, a tela se atualiza sozinha na hora e aparece um aviso. Não precisa mais recarregar a página para ver a resposta.',
            'Pedido › Itens: o botão "Adicionar Item" voltou a funcionar. Antes o item novo não aparecia na lista. O mesmo foi corrigido na tela de Compras.',
            'Pedido › Itens: ao remover um item de um pedido já salvo, ele só sai de vez quando você salva o pedido. Se fechar sem salvar, o item continua lá.',
            'Pedido: o Status e o Tipo do item não aparecem mais como "[object Object]".',
            'Pedido › Desenho livre: a leitura das medidas escritas à mão ficou mais precisa. Vírgulas grandes, como "2,25", e números com estilos diferentes de escrita agora são reconhecidos corretamente.',
            'Todas as listas de seleção agora têm campo de pesquisa, igual à escolha de cliente. É só digitar parte do nome para encontrar.',
            'Celular: os filtros de CPF/CNPJ e telefone em Clientes e Fornecedores, e os campos Número, Série e Chave de acesso da nota em Compras, abrem o teclado numérico.',
            'Clientes e Fornecedores › consulta de CNPJ: voltou a funcionar. Antes, CNPJs que existem apareciam como "não encontrado". O endereço também vem completo, com o tipo da rua (ex.: "RUA 12").',
            'Relatórios › Imprimir Relatório: a impressão sai limpa, só com o relatório, em fundo branco e com todas as páginas, sem o menu do sistema e sem cortar no meio.',
        ],
    },
    {
        versao: '2.1.1',
        data: '26/11/2026',
        itens: [
            'Listas (clientes, pedidos, produtos e as demais): os vários botões de cada linha viraram um só, o de três pontinhos, logo no começo da linha. Ao tocar nele aparecem todas as opções, como Editar, Imprimir, Ativar/Inativar e Excluir.',
            'No celular, o botão de opções fica no canto esquerdo de cada cartão, ao lado do nome.',
        ],
    },
    {
        versao: '2.1.0',
        data: '26/11/2026',
        itens: [
            'O sistema ficou mais leve: baixa cerca de 17% menos dados ao abrir, então a primeira tela aparece mais rápido, principalmente no celular.',
            'Campos de data agora usam o calendário do próprio aparelho. No celular, abre o seletor de data do Android ou do iPhone.',
            'Janelas, menus e listas de opções foram refeitos: abrem mais rápido, fecham com a tecla Esc e as mensagens de aviso aparecem por cima de qualquer janela aberta.',
            'Ícones redesenhados, mais nítidos em qualquer tamanho de tela, no modo claro e no escuro.',
        ],
    },
    {
        versao: '2.0.1',
        data: '26/11/2026',
        itens: [
            'Cadastro de Clientes, Fornecedores, Empresas e Minha Empresa: os campos de CNPJ e CEP voltaram a funcionar. Antes a tela dava erro e esses campos não aceitavam digitação.',
            'Compras › busca de fornecedor e de produto: a pesquisa agora ignora acentos e maiúsculas. Quem digita "joao" encontra "João".',
            'Pesquisa de clientes e fornecedores por telefone: encontra o número mesmo que ele tenha sido cadastrado com parênteses, espaços ou traços.',
            'Impressão da DANFE: o botão Imprimir e a impressão automática voltaram a funcionar.',
            'Segurança: ao trocar a senha, desativar ou excluir um usuário, ou mudar o perfil dele, as sessões abertas em outros aparelhos são encerradas na hora. Quem troca a própria senha continua conectado no aparelho atual.',
            'Segurança: o administrador de uma empresa não vê nem altera mais o usuário do suporte do sistema.',
            'Segurança: textos digitados em pedidos, clientes e notas fiscais não conseguem mais executar nada nas telas de impressão.',
            'Segurança: o link de "esqueci minha senha" enviado por e-mail antigo deixou de valer. Se precisar, peça um novo.',
        ],
    },
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
exports.VERSAO_ATUAL = exports.NOVIDADES[0].versao;
//# sourceMappingURL=NOVIDADES.js.map