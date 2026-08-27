import { Injectable } from '@angular/core';
import { IDiagonal, IPedido, IPedidoItem, IPonto } from '#shared/interfaces';
import { ETipoItemPedido } from '#shared/enums';
import { formatDate, formatCpfCnpj, formatPhone } from '#shared/functions/format.functions';
import { calcularTotalCorte, gerarSvgCorte } from '#shared/functions/desenho-corte.functions';

@Injectable({ providedIn: 'root' })
export class PedidoImpressaoDesenhoService {

  imprimir(pedido: IPedido): void {
    const itensCorte = (pedido.itens ?? []).filter(
      i => i.tipo === ETipoItemPedido.Corte && i.cod_desenho
    );
    if (itensCorte.length === 0) {
      alert('Este pedido não possui itens de corte com desenho para imprimir.');
      return;
    }
    const html = this.gerarHtml(pedido, itensCorte);
    const win = window.open('', '_blank');
    if (!win) { alert('Permita pop-ups para imprimir o pedido.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  // ── Marca d'água por página ──────────────────────────────────────────────
  private gerarWatermarkHtml(texto: string): string {
    if (!texto) return '';
    const spans = Array.from({ length: 10 }).map(() => `<span>${texto}</span>`).join('');
    return `<div class="watermark" aria-hidden="true">${spans}</div>`;
  }

  // ── Slot preenchido ───────────────────────────────────────────────────────
  private gerarSlotItem(item: IPedidoItem, seq: number): string {
    const chapa    = item.corte?.chapa?.descricao ?? '-';
    const corte    = item.corte?.descricao ?? '-';
    const corteRef = item.corte?.corte != null ? `${item.corte.corte} cm` : '-';
    const desenho  = item.desenho?.descricao ?? '-';
    const pontos: IPonto[]     = (item.desenho?.pontos   as IPonto[])   ?? [];
    const diagonais: IDiagonal[] = (item.desenho?.diagonais as IDiagonal[]) ?? [];
    const medidas: number[]    = item.medidas ?? [];

    const total = calcularTotalCorte(pontos, diagonais, medidas);
    const totalChip = total > 0
      ? `<span class="chip chip--total">Total: ${total} cm</span>` : '';
    const obs = item.observacoes
      ? `<div class="item-obs"><strong>Obs:</strong> ${item.observacoes}</div>` : '';

    return `
    <div class="item-slot item-slot--filled">
      <div class="item-hdr">
        <span class="item-seq">${seq}</span>
        <span class="item-corte">${corte}</span>
        <span class="item-chips">
          <span class="chip">Chapa: ${chapa}</span>
          <span class="chip">Ref: ${corteRef}</span>
          <span class="chip">Desenho: ${desenho}</span>
          <span class="chip">Qtd: ${item.quantidade}</span>
          ${totalChip}
        </span>
      </div>
      <div class="item-body">
        <div class="item-svg">${gerarSvgCorte(pontos, diagonais, medidas)}</div>
      </div>
      ${obs}
    </div>`;
  }

  // ── Slot vazio ────────────────────────────────────────────────────────────
  private gerarSlotVazio(): string {
    return `<div class="item-slot item-slot--vazio"></div>`;
  }

  // ── Cabeçalho da empresa ──────────────────────────────────────────────────
  private gerarEmpresaHeader(pedido: IPedido): string {
    const emp = pedido.empresa;
    if (!emp) return '';
    const nomeDisplay = emp.nome_fantasia || emp.razao_social;
    const razaoSecundaria = emp.nome_fantasia
      ? `<div class="empresa-razao">${emp.razao_social}</div>` : '';
    const cnpj  = emp.cnpj     ? `<div class="empresa-detalhe">CNPJ: ${formatCpfCnpj(emp.cnpj)}</div>` : '';
    const tel   = emp.telefone ? `<div class="empresa-detalhe">Tel: ${formatPhone(emp.telefone)}</div>` : '';
    const email = emp.email    ? `<div class="empresa-detalhe">${emp.email}</div>` : '';
    const partes: string[] = [];
    if (emp.endereco) partes.push(emp.endereco + (emp.numero ? ', ' + emp.numero : ''));
    if (emp.bairro) partes.push(emp.bairro);
    const enderecoLinha = partes.length ? `<div class="empresa-detalhe">${partes.join(' — ')}</div>` : '';
    const cidadeLinha = emp.cidade ? `<div class="empresa-detalhe">${emp.cidade.descricao}/${emp.cidade.uf}</div>` : '';
    const cepLinha = emp.cep ? `<div class="empresa-detalhe">CEP: ${emp.cep}</div>` : '';
    return `
    <div class="empresa-header">
      <div class="empresa-info-bloco">
        <div class="empresa-nome">${nomeDisplay}</div>
        ${razaoSecundaria}${cnpj}${tel}${email}
      </div>
      <div class="empresa-endereco-bloco">
        ${enderecoLinha}${cidadeLinha}${cepLinha}
      </div>
    </div>`;
  }

  // ── Páginas com 2 desenhos por linha ─────────────────────────────────────
  private gerarPaginas(pedido: IPedido, itens: IPedidoItem[], qtdPorFolha: number): string {
    const cliente     = pedido.cliente?.razao_social ?? '-';
    const agora       = new Date();
    const dataGeracao = `${formatDate(agora)} ${agora.toTimeString().slice(0, 5)}`;
    const cnpjCpf     = pedido.cliente?.cpf_cnpj
      ? ` | CPF/CNPJ: ${formatCpfCnpj(pedido.cliente.cpf_cnpj)}` : '';
    const telefone    = pedido.cliente?.telefone
      ? ` | Tel: ${formatPhone(pedido.cliente.telefone)}` : '';
    const cidade      = pedido.cliente?.cidade
      ? ` | ${pedido.cliente.cidade.descricao}/${pedido.cliente.cidade.uf}` : '';
    const rowCount = Math.ceil(qtdPorFolha / 2);
    const paginas: IPedidoItem[][] = [];
    for (let i = 0; i < itens.length; i += qtdPorFolha) paginas.push(itens.slice(i, i + qtdPorFolha));
    if (paginas.length === 0) paginas.push([]);

    const textoWatermark = pedido.empresa?.marca_dagua || pedido.empresa?.nome_fantasia || pedido.empresa?.razao_social || '';
    const watermarkHtml = this.gerarWatermarkHtml(textoWatermark);

    return paginas.map((grupo, pIdx) => {
      const slots: string[] = [];
      grupo.forEach((item, i) => slots.push(this.gerarSlotItem(item, pIdx * qtdPorFolha + i + 1)));
      const alvo = rowCount * 2;
      while (slots.length < alvo) slots.push(this.gerarSlotVazio());

      const isFirstPage = pIdx === 0;
      const infoCliente = isFirstPage ? `
      <div class="section-cliente">
        <div class="cliente-nome">${cliente}</div>
        <div class="cliente-info">
          <span class="label">Data do Pedido:</span> ${formatDate(pedido.data_pedido)}${cnpjCpf}${telefone}${cidade}
        </div>
      </div>` : '';

      return `
      <div class="pagina-wrapper">
        ${watermarkHtml}
        ${this.gerarEmpresaHeader(pedido)}
        <div class="titulo-row">
          <h2 class="titulo">Ordem de Corte — Pedido Nº ${pedido.id}</h2>
          <span class="titulo-data">Gerado em: ${dataGeracao}${paginas.length > 1 ? ` &nbsp;|&nbsp; Pág. ${pIdx + 1}/${paginas.length}` : ''}</span>
        </div>
        ${infoCliente}
        <div class="slots-area" style="grid-template-rows: repeat(${rowCount}, 1fr);">
          ${slots.join('')}
        </div>
      </div>`;
    }).join('\n');
  }

  // ── HTML completo ─────────────────────────────────────────────────────────
  private gerarHtml(pedido: IPedido, itens: IPedidoItem[]): string {
    const qtdPorFolha = Math.max(2, Math.min(20, pedido.empresa?.quantidade_desenho_por_folha ?? 4));
    const paginas = this.gerarPaginas(pedido, itens, qtdPorFolha);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ordem de Corte — Pedido Nº ${pedido.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }
    .pagina-wrapper {
      position: relative;
      display: flex; flex-direction: column;
      height: 277mm; overflow: hidden; page-break-after: always;
    }
    .pagina-wrapper:last-child { page-break-after: auto; }
    .watermark {
      position: absolute; inset: 0; z-index: 0;
      display: flex; flex-wrap: wrap; align-content: space-around; justify-content: space-around;
      overflow: hidden; pointer-events: none;
    }
    .watermark span {
      display: inline-block; transform: rotate(-30deg);
      font-size: 1.6rem; font-weight: 900; color: rgba(0, 0, 0, 0.08);
      white-space: nowrap; text-transform: uppercase; letter-spacing: 0.05em;
      margin: 1rem 2rem;
    }
    .empresa-header, .titulo-row, .section-cliente, .slots-area {
      position: relative; z-index: 1;
    }
    .empresa-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; padding-bottom: 6px; border-bottom: 2px solid #f97316;
      margin-bottom: 6px; flex-shrink: 0;
    }
    .empresa-nome { font-size: 12px; font-weight: 700; }
    .empresa-razao { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .empresa-detalhe { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .empresa-endereco-bloco { text-align: right; }
    .titulo-row {
      display: flex; justify-content: space-between; align-items: baseline;
      padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;
      margin-bottom: 5px; flex-shrink: 0;
    }
    .titulo { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .titulo-data { font-size: 9px; color: #6b7280; }
    .section-cliente {
      margin-bottom: 4px; padding: 4px 7px; background: #f9fafb;
      border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .cliente-nome { font-size: 11px; font-weight: 700; }
    .cliente-info { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .label { font-weight: 600; color: #374151; }
    .slots-area {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 4px; flex: 1; min-height: 0;
    }
    .item-slot {
      min-height: 0; overflow: hidden; border: 1px solid #d1d5db;
      border-radius: 3px; padding: 4px 6px;
      display: flex; flex-direction: column;
    }
    .item-slot--vazio { background: #f9fafb; border-style: dashed; border-color: #e5e7eb; }
    .item-hdr {
      display: flex; align-items: center; gap: 4px;
      margin-bottom: 3px; flex-wrap: wrap; flex-shrink: 0;
    }
    .item-seq {
      background: #1a1a1a; color: #fff; border-radius: 50%;
      width: 15px; height: 15px; display: flex; align-items: center;
      justify-content: center; font-size: 8px; font-weight: 700; flex-shrink: 0;
    }
    .item-corte { font-size: 10px; font-weight: 700; }
    .item-chips { display: flex; flex-wrap: wrap; gap: 2px; }
    .chip {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px;
      padding: 1px 4px; font-size: 8px; color: #374151;
    }
    .chip--total { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; font-weight: 700; }
    .item-body { flex: 1; min-height: 0; display: flex; }
    .item-svg { flex: 1; min-height: 0; position: relative; overflow: hidden; }
    .item-obs { font-size: 8px; color: #6b7280; margin-top: 2px; flex-shrink: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
    }
  </style>
</head>
<body>
  ${paginas}
</body>
</html>`;
  }
}
