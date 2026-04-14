import { Injectable } from '@angular/core';
import { IPedido, IPedidoItem, IPonto } from '#shared/interfaces';
import { ETipoItemPedido } from '#shared/enums';
import { formatDate, formatCpfCnpj, formatPhone } from '#shared/functions/format.functions';

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
    if (!win) {
      alert('Permita pop-ups para imprimir o pedido.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  // ── SVG compacto — segmentos numerados ───────────────────────────────────────
  private gerarSvg(pontos: IPonto[]): string {
    if (!pontos || pontos.length < 2) return '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:#9ca3af">Sem desenho</span>';

    const PAD = 14;
    const VW  = 300;
    const VH  = 160;

    const xs = pontos.map(p => p.x);
    const ys = pontos.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const drawW = VW - PAD * 2;
    const drawH = VH - PAD * 2;
    const scale = Math.min(drawW / rangeX, drawH / rangeY);

    const offsetX = PAD + (drawW - rangeX * scale) / 2;
    const offsetY = PAD + (drawH - rangeY * scale) / 2;

    const norm = (p: IPonto) => ({
      sx: offsetX + (p.x - minX) * scale,
      sy: offsetY + (p.y - minY) * scale,
    });

    const pts = pontos.map(norm);
    const polyline = pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');

    const nums = pontos.slice(0, -1).map((_, i) => {
      const a = pts[i];
      const b = pts[i + 1];
      const mx = (a.sx + b.sx) / 2;
      const my = (a.sy + b.sy) / 2;
      const dx = b.sx - a.sx;
      const dy = b.sy - a.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * 11;
      const ny =  dx / len * 11;
      return `<text x="${(mx + nx).toFixed(1)}" y="${(my + ny).toFixed(1)}"
        font-size="9" fill="#3b82f6" font-weight="700"
        text-anchor="middle" dominant-baseline="middle">${i + 1}</text>`;
    }).join('');

    const dots = pts.map(p =>
      `<circle cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="2.5" fill="#ef4444"/>`
    ).join('');

    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style="position:absolute;top:0;left:0;width:100%;height:100%;background:#fafafa;border:1px solid #e5e7eb;border-radius:3px;">
      <polyline points="${polyline}" fill="none" stroke="#1a1a1a" stroke-width="1.8"
        stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${nums}
    </svg>`;
  }

  // ── Coluna direita: lista de medidas ─────────────────────────────────────────
  private gerarMedidasColuna(medidas: number[]): string {
    if (!medidas.length) return '<span style="color:#9ca3af;font-size:9px">—</span>';
    const total = medidas.reduce((s, m) => s + (Number(m) || 0), 0);
    const linhas = medidas.map((m, i) =>
      `<div class="med-row">
        <span class="med-num">${i + 1}</span>
        <span class="med-val">${m} cm</span>
      </div>`
    ).join('');
    return `${linhas}<div class="med-total">Total: <strong>${total} cm</strong></div>`;
  }

  // ── Slot preenchido com dados do item ─────────────────────────────────────────
  private gerarSlotItem(item: IPedidoItem, seq: number): string {
    const chapa   = item.corte?.chapa?.descricao ?? '-';
    const corte   = item.corte?.descricao ?? '-';
    const corteRef = item.corte?.corte != null ? `${item.corte.corte} cm` : '-';
    const desenho  = item.desenho?.descricao ?? '-';
    const medidas: number[] = item.medidas ?? [];
    const obs = item.observacoes
      ? `<div class="item-obs"><strong>Obs:</strong> ${item.observacoes}</div>` : '';

    const svgHtml      = this.gerarSvg(item.desenho?.pontos ?? []);
    const medidasHtml  = this.gerarMedidasColuna(medidas);

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
        </span>
      </div>
      <div class="item-body">
        <div class="item-svg">${svgHtml}</div>
        <div class="item-medidas">${medidasHtml}</div>
      </div>
      ${obs}
    </div>`;
  }

  // ── Slot vazio (mantém proporção da página) ───────────────────────────────────
  private gerarSlotVazio(): string {
    return `<div class="item-slot item-slot--vazio"></div>`;
  }

  // ── Cabeçalho da empresa ──────────────────────────────────────────────────────
  private gerarEmpresaHeader(pedido: IPedido): string {
    const emp = pedido.empresa;
    if (!emp) return '';

    const nomeDisplay = emp.nome_fantasia || emp.razao_social;
    const razaoSecundaria = emp.nome_fantasia
      ? `<div class="empresa-razao">${emp.razao_social}</div>` : '';
    const cnpj  = emp.cnpj    ? `<div class="empresa-detalhe">CNPJ: ${formatCpfCnpj(emp.cnpj)}</div>` : '';
    const tel   = emp.telefone ? `<div class="empresa-detalhe">Tel: ${formatPhone(emp.telefone)}</div>` : '';
    const email = emp.email    ? `<div class="empresa-detalhe">${emp.email}</div>` : '';

    const partes: string[] = [];
    if (emp.endereco) partes.push(emp.endereco + (emp.numero ? ', ' + emp.numero : ''));
    if (emp.bairro) partes.push(emp.bairro);
    const enderecoLinha = partes.length
      ? `<div class="empresa-detalhe">${partes.join(' — ')}</div>` : '';
    const cidadeLinha = emp.cidade
      ? `<div class="empresa-detalhe">${emp.cidade.descricao}/${emp.cidade.uf}</div>` : '';
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

  // ── Geração das páginas com slots fixos ───────────────────────────────────────
  private gerarPaginas(pedido: IPedido, itens: IPedidoItem[], qtdPorFolha: number): string {
    const cliente    = pedido.cliente?.razao_social ?? '-';
    const agora      = new Date();
    const dataGeracao = `${formatDate(agora)} ${agora.toTimeString().slice(0, 5)}`;
    const cnpjCpf    = pedido.cliente?.cpf_cnpj
      ? ` | CPF/CNPJ: ${formatCpfCnpj(pedido.cliente.cpf_cnpj)}` : '';
    const telefone   = pedido.cliente?.telefone
      ? ` | Tel: ${formatPhone(pedido.cliente.telefone)}` : '';
    const cidade     = pedido.cliente?.cidade
      ? ` | ${pedido.cliente.cidade.descricao}/${pedido.cliente.cidade.uf}` : '';

    // Divide itens em grupos de qtdPorFolha
    const paginas: IPedidoItem[][] = [];
    for (let i = 0; i < itens.length; i += qtdPorFolha) {
      paginas.push(itens.slice(i, i + qtdPorFolha));
    }
    // Garante pelo menos uma página
    if (paginas.length === 0) paginas.push([]);

    return paginas.map((grupo, pIdx) => {
      // Gera slots: itens preenchidos + slots vazios para completar qtdPorFolha
      const slots: string[] = [];
      grupo.forEach((item, i) => {
        const seq = pIdx * qtdPorFolha + i + 1;
        slots.push(this.gerarSlotItem(item, seq));
      });
      while (slots.length < qtdPorFolha) {
        slots.push(this.gerarSlotVazio());
      }

      const isFirstPage = pIdx === 0;

      const infoCliente = isFirstPage ? `
      <div class="section-cliente">
        <div class="cliente-nome">${cliente}</div>
        <div class="cliente-info">
          <span class="label">Data do Pedido:</span> ${formatDate(pedido.data_pedido)}${cnpjCpf}${telefone}${cidade}
        </div>
      </div>
      <div class="legenda">
        <strong>${itens.length} ${itens.length === 1 ? 'item' : 'itens'} de corte</strong>
        &nbsp;—&nbsp; Número azul = segmento do desenho
      </div>` : '';

      return `
      <div class="pagina-wrapper">
        ${this.gerarEmpresaHeader(pedido)}
        <div class="titulo-row">
          <h2 class="titulo">Ordem de Corte — Pedido Nº ${pedido.id}</h2>
          <span class="titulo-data">Gerado em: ${dataGeracao}${paginas.length > 1 ? ` &nbsp;|&nbsp; Pág. ${pIdx + 1}/${paginas.length}` : ''}</span>
        </div>
        ${infoCliente}
        <div class="slots-area">
          ${slots.join('')}
        </div>
      </div>`;
    }).join('\n');
  }

  // ── HTML completo ─────────────────────────────────────────────────────────────
  private gerarHtml(pedido: IPedido, itens: IPedidoItem[]): string {
    const qtdPorFolha = Math.max(1, Math.min(20, pedido.empresa?.quantidade_desenho_por_folha ?? 5));
    const paginas = this.gerarPaginas(pedido, itens, qtdPorFolha);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ordem de Corte — Pedido Nº ${pedido.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }

    /* ── Wrapper de página — altura exata A4 ── */
    .pagina-wrapper {
      display: flex;
      flex-direction: column;
      height: 277mm;
      overflow: hidden;
      page-break-after: always;
    }
    .pagina-wrapper:last-child { page-break-after: auto; }

    /* ── Cabeçalho da empresa ── */
    .empresa-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; padding-bottom: 6px; border-bottom: 2px solid #f97316; margin-bottom: 6px;
      flex-shrink: 0;
    }
    .empresa-nome { font-size: 12px; font-weight: 700; }
    .empresa-razao { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .empresa-detalhe { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .empresa-endereco-bloco { text-align: right; }

    /* ── Título ── */
    .titulo-row {
      display: flex; justify-content: space-between; align-items: baseline;
      padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 5px;
      flex-shrink: 0;
    }
    .titulo { font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; }
    .titulo-data { font-size: 9px; color: #6b7280; }

    /* ── Seção cliente (só na pág. 1) ── */
    .section-cliente {
      margin-bottom: 4px; padding: 4px 7px; background: #f9fafb;
      border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .cliente-nome { font-size: 11px; font-weight: 700; }
    .cliente-info { font-size: 9px; color: #6b7280; margin-top: 1px; }
    .label { font-weight: 600; color: #374151; }
    .legenda { font-size: 9px; color: #6b7280; margin-bottom: 4px; flex-shrink: 0; }

    /* ── Área de slots: ocupa todo espaço restante ── */
    .slots-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-height: 0;
    }

    /* ── Slot individual — cada um ocupa 1/N do espaço ── */
    .item-slot {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
    }

    /* Slot vazio */
    .item-slot--vazio {
      background: #f9fafb;
      border-style: dashed;
      border-color: #e5e7eb;
    }

    /* Cabeçalho do item */
    .item-hdr {
      display: flex; align-items: center; gap: 5px;
      margin-bottom: 3px; flex-wrap: wrap; flex-shrink: 0;
    }
    .item-seq {
      background: #1a1a1a; color: #fff; border-radius: 50%;
      width: 16px; height: 16px; display: flex; align-items: center;
      justify-content: center; font-size: 8px; font-weight: 700; flex-shrink: 0;
    }
    .item-corte { font-size: 10px; font-weight: 700; }
    .item-chips { display: flex; flex-wrap: wrap; gap: 3px; }
    .chip {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px;
      padding: 1px 4px; font-size: 9px; color: #374151;
    }

    /* Corpo: 2 colunas, ocupa o espaço restante do slot */
    .item-body {
      display: flex; gap: 6px; flex: 1; min-height: 0;
    }
    .item-svg {
      flex: 0 0 62%;
      min-height: 0;
      position: relative;
      overflow: hidden;
    }
    .item-medidas {
      flex: 1;
      border-left: 1px solid #e5e7eb;
      padding-left: 6px;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }
    .med-row {
      display: flex; gap: 5px; align-items: center;
      font-size: 9px; line-height: 1.3;
    }
    .med-num {
      background: #3b82f6; color: #fff; border-radius: 50%;
      width: 13px; height: 13px; display: flex; align-items: center;
      justify-content: center; font-size: 7px; font-weight: 700; flex-shrink: 0;
    }
    .med-val { color: #1a1a1a; }
    .med-total {
      margin-top: 2px; font-size: 9px; color: #374151;
      border-top: 1px solid #e5e7eb; padding-top: 1px;
    }
    .item-obs { font-size: 8px; color: #6b7280; margin-top: 2px; flex-shrink: 0; }

    /* ── Print ── */
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
