import { Injectable } from '@angular/core';
import { IPedido, IPedidoItem } from '#shared/interfaces';
import { ETipoItemPedido, EStatusPedido, EDescontoTipo } from '#shared/enums';
import { formatCurrency, formatNumber, formatCpfCnpj, formatPhone, formatDate } from '#shared/functions/format.functions';

@Injectable({ providedIn: 'root' })
export class PedidoImpressaoService {

  imprimir(pedido: IPedido): void {
    const html = this.gerarHtml(pedido);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Permita pop-ups para imprimir o pedido.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  private statusLabel(status: number): string {
    const map: Record<number, string> = {
      [EStatusPedido.Aberto]: 'Aberto',
      [EStatusPedido.EmProducao]: 'Em Produção',
      [EStatusPedido.Concluido]: 'Finalizado',
      [EStatusPedido.Cancelado]: 'Cancelado',
    };
    return map[status] ?? 'Desconhecido';
  }

  private tipoLabel(tipo: number): string {
    if (tipo === ETipoItemPedido.Produto) return 'Produto';
    if (tipo === ETipoItemPedido.Corte) return 'Corte';
    if (tipo === ETipoItemPedido.Servico) return 'Serviço';
    return '-';
  }

  private itemDescricao(item: IPedidoItem): string {
    if (item.tipo === ETipoItemPedido.Produto) return item.produto?.descricao ?? '-';
    if (item.tipo === ETipoItemPedido.Corte) return item.corte?.descricao ?? '-';
    if (item.tipo === ETipoItemPedido.Servico) return item.servico?.descricao ?? '-';
    return '-';
  }

  private gerarLinhasItens(itens: IPedidoItem[]): string {
    return itens.map((item, i) => {
      const subtotal = (item.quantidade ?? 0) * (item.valor_unitario ?? 0);
      return `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="center">${i + 1}</td>
          <td>${this.tipoLabel(item.tipo)}</td>
          <td>${this.itemDescricao(item)}</td>
          <td class="center">${formatNumber(item.quantidade)}</td>
          <td class="right">${formatCurrency(item.valor_unitario)}</td>
          <td class="right"><strong>${formatCurrency(subtotal)}</strong></td>
        </tr>`;
    }).join('');
  }

  private gerarEmpresaHeader(pedido: IPedido): string {
    const emp = pedido.empresa;
    if (!emp) return '';

    const nomeDisplay = emp.nome_fantasia || emp.razao_social;
    const razaoSecundaria = emp.nome_fantasia
      ? `<div class="empresa-razao">${emp.razao_social}</div>` : '';
    const cnpj = emp.cnpj ? `<div class="empresa-detalhe">CNPJ: ${formatCpfCnpj(emp.cnpj)}</div>` : '';
    const tel = emp.telefone ? `<div class="empresa-detalhe">Tel: ${formatPhone(emp.telefone)}</div>` : '';
    const email = emp.email ? `<div class="empresa-detalhe">${emp.email}</div>` : '';

    const partes: string[] = [];
    if (emp.endereco) partes.push(emp.endereco + (emp.numero ? ', ' + emp.numero : ''));
    if (emp.bairro) partes.push(emp.bairro);
    const enderecoLinha = partes.length ? `<div class="empresa-detalhe">${partes.join(' — ')}</div>` : '';
    const cidadeLinha = emp.cidade
      ? `<div class="empresa-detalhe">${emp.cidade.descricao}/${emp.cidade.uf}</div>` : '';
    const cepLinha = emp.cep ? `<div class="empresa-detalhe">CEP: ${emp.cep}</div>` : '';

    const logo = emp.logo_url
      ? `<img class="empresa-logo" src="${emp.logo_url}" alt="Logo de ${nomeDisplay}" width="120" height="60">`
      : '';

    return `
    <div class="empresa-header">
      <div class="empresa-header-principal">
        ${logo}
        <div class="empresa-info-bloco">
          <div class="empresa-nome">${nomeDisplay}</div>
          ${razaoSecundaria}
          ${cnpj}${tel}${email}
        </div>
      </div>
      <div class="empresa-endereco-bloco">
        ${enderecoLinha}${cidadeLinha}${cepLinha}
      </div>
    </div>`;
  }

  private gerarHtml(pedido: IPedido): string {
    const itens = pedido.itens ?? [];
    const status = this.statusLabel(pedido.status);
    const marcaDagua = pedido.empresa?.marca_dagua?.trim() ?? '';
    const meioPagamento = pedido.meio_pagamento?.descricao ?? '-';
    const cliente = pedido.cliente?.razao_social ?? '-';
    const agora = new Date();
    const dataGeracao = `${formatDate(agora)} ${agora.toTimeString().slice(0, 5)}`;
    const cnpjCpf = pedido.cliente?.cpf_cnpj
      ? `<span class="label">CPF/CNPJ:</span> ${formatCpfCnpj(pedido.cliente.cpf_cnpj)}`
      : '';
    const telefone = pedido.cliente?.telefone
      ? ` &nbsp;|&nbsp; <span class="label">Telefone:</span> ${formatPhone(pedido.cliente.telefone)}`
      : '';
    const cidade = pedido.cliente?.cidade
      ? ` &nbsp;|&nbsp; <span class="label">Cidade:</span> ${pedido.cliente.cidade.descricao} / ${pedido.cliente.cidade.uf}`
      : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Pedido Nº ${pedido.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 24px 28px; }

    /* Cabeçalho da empresa — idêntico ao relatorio-wrapper */
    .empresa-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 12px; border-bottom: 2px solid #f97316; margin-bottom: 14px; }
    .empresa-header-principal { display: flex; align-items: center; gap: 12px; }
    .empresa-logo { max-width: 120px; max-height: 60px; width: auto; height: auto; object-fit: contain; flex-shrink: 0; }
    .empresa-nome { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .empresa-razao { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .empresa-detalhe { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .empresa-endereco-bloco { text-align: right; }

    /* Título do relatório */
    .titulo-row { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 14px; }
    .titulo { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #1a1a1a; margin: 0; }
    .titulo-data { font-size: 10px; color: #6b7280; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: #e5e7eb; color: #374151; }

    /* Seção de info */
    .section { margin-bottom: 14px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; }
    .info-item { }
    .label { font-weight: 600; color: #374151; }
    .info-row { margin-bottom: 3px; font-size: 11px; }
    .cliente-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }

    /* Tabela de itens */
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    thead tr { background: #1a1a1a; color: #fff; }
    thead th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    thead th.center { text-align: center; }
    thead th.right { text-align: right; }
    tbody td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; font-size: 11px; vertical-align: middle; }
    tbody td.center { text-align: center; }
    tbody td.right { text-align: right; }
    .row-even { background: #fff; }
    .row-odd { background: #f9fafb; }

    /* Totais */
    .totais-wrapper { display: flex; justify-content: flex-end; }
    .totais-box { width: 280px; }
    .totais-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
    .totais-row.total { border-top: 2px solid #1a1a1a; border-bottom: none; padding-top: 8px; margin-top: 4px; }
    .totais-row.total .val { font-size: 16px; font-weight: 800; }

    /* Observações */
    .obs-box { background: #f9fafb; border-left: 3px solid #6b7280; padding: 8px 12px; border-radius: 4px; margin-bottom: 14px; font-size: 11px; color: #374151; }

    /* Rodapé */
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }

    /* Marca d'água */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.08);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      user-select: none;
    }
    .page { position: relative; z-index: 1; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
      @page { margin: 15mm 15mm 15mm 15mm; }
      .watermark { position: fixed; top: 50%; left: 50%; }
    }
  </style>
</head>
<body>
${marcaDagua ? `<div class="watermark" aria-hidden="true">${marcaDagua}</div>` : ''}
<div class="page">

  ${this.gerarEmpresaHeader(pedido)}

  <div class="titulo-row">
    <h2 class="titulo">Pedido de Fabricação — Nº ${pedido.id} &nbsp;<span class="status-badge">${status}</span></h2>
    <span class="titulo-data">Gerado em: ${dataGeracao}</span>
  </div>

  <!-- Dados do Pedido -->
  <div class="section">
    <div class="section-title">Dados do Pedido</div>
    <div class="info-grid">
      <div class="info-item"><span class="label">Data:</span> ${formatDate(pedido.data_pedido)}</div>
      <div class="info-item"><span class="label">Status:</span> ${status}</div>
      <div class="info-item"><span class="label">Nº Pedido:</span> ${pedido.id}</div>
      <div class="info-item"><span class="label">Meio de Pagamento:</span> ${meioPagamento}</div>
    </div>
  </div>

  <!-- Cliente -->
  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="cliente-name">${cliente}</div>
    <div class="info-row">${cnpjCpf}${telefone}${cidade}</div>
  </div>

  <!-- Itens -->
  <div class="section">
    <div class="section-title">Itens do Pedido</div>
    <table>
      <thead>
        <tr>
          <th class="center" style="width:3%">#</th>
          <th style="width:10%">Tipo</th>
          <th>Descrição</th>
          <th class="center" style="width:14%">Qtd.</th>
          <th class="right" style="width:14%">Vl. Unit.</th>
          <th class="right" style="width:14%">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${this.gerarLinhasItens(itens)}
        ${itens.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:12px;color:#9ca3af;">Nenhum item</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <!-- Totais -->
  <div class="totais-wrapper">
    <div class="totais-box">
      <div class="totais-row">
        <span>Material / Cortes:</span>
        <span class="val">${formatCurrency(pedido.valor_material)}</span>
      </div>
      <div class="totais-row">
        <span>Serviço:</span>
        <span class="val">${formatCurrency(pedido.valor_servico)}</span>
      </div>
      ${pedido.valor_desconto > 0 ? `
      <div class="totais-row">
        <span>Total do Pedido:</span>
        <span class="val">${formatCurrency(pedido.valor_total)}</span>
      </div>
      <div class="totais-row">
        <span>Desconto (${pedido.desconto_tipo === EDescontoTipo.Percentual ? `${formatNumber(pedido.desconto_valor)}%` : 'R$'}):</span>
        <span class="val">- ${formatCurrency(pedido.valor_desconto)}</span>
      </div>
      <div class="totais-row total">
        <span><strong>Total Líquido:</strong></span>
        <span class="val">${formatCurrency(pedido.valor_liquido)}</span>
      </div>` : `
      <div class="totais-row total">
        <span><strong>Total do Pedido:</strong></span>
        <span class="val">${formatCurrency(pedido.valor_total)}</span>
      </div>`}
    </div>
  </div>

  ${pedido.observacoes ? `
  <!-- Observações -->
  <div class="section" style="margin-top:14px;">
    <div class="section-title">Observações</div>
    <div class="obs-box">${pedido.observacoes}</div>
  </div>` : ''}

  <!-- Rodapé -->
  <div class="footer">
    <span>Gerado em ${dataGeracao}</span>
    <span>Pedido Nº ${pedido.id} — ${cliente}</span>
  </div>

</div>
</body>
</html>`;
  }
}
