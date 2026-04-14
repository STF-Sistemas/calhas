import { Injectable } from '@angular/core';
import { CompraService } from './compra.service';
import { IDanfeData } from '#shared/interfaces';

@Injectable({ providedIn: 'root' })
export class DanfePrintService {
  constructor(private compraService: CompraService) {}

  imprimir(compraId: number): void {
    this.compraService.getDanfeData(compraId).subscribe({
      next: (res) => this.abrirJanelaDanfe(res.data),
      error: (err) => alert(err?.error?.message ?? 'Erro ao gerar DANFE.'),
    });
  }

  private abrirJanelaDanfe(data: IDanfeData): void {
    const html = this.gerarHtml(data);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Permita popups para imprimir.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  private gerarHtml(d: IDanfeData): string {
    const fmt = (v: number | undefined | null) =>
      (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmt4 = (v: number | undefined | null) =>
      (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const fmtDate = (s?: string) => {
      if (!s) return '';
      try { return new Date(s).toLocaleDateString('pt-BR'); } catch { return s; }
    };
    const fmtCnpj = (s?: string) => {
      const c = (s ?? '').replace(/\D/g, '');
      return c.length === 14
        ? c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
        : s ?? '';
    };
    const fmtCep = (s?: string) => {
      const c = (s ?? '').replace(/\D/g, '');
      return c.length === 8 ? c.replace(/(\d{5})(\d{3})/, '$1-$2') : s ?? '';
    };
    const fmtChave = (s?: string) => {
      if (!s || s.length !== 44) return s ?? '';
      return s.match(/.{1,4}/g)?.join(' ') ?? s;
    };
    const fmtNfe = (s?: string) => s ? s.padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3') : '';
    const fmtMod = (m: string) => {
      const map: Record<string, string> = {
        '0': '0 - Por conta do Emitente',
        '1': '1 - Por conta do Destinatário/Remetente',
        '2': '2 - Por conta de Terceiros',
        '3': '3 - Próprio por conta do Remetente',
        '4': '4 - Próprio por conta do Destinatário',
        '9': '9 - Sem Frete',
      };
      return map[m] ?? m;
    };

    // -- linhas dos itens --
    const linhasItens = d.itens.map(item => `
      <tr>
        <td class="c">${item.num}</td>
        <td>${item.codigo}</td>
        <td>${item.descricao}</td>
        <td class="c">${item.ncm ?? ''}</td>
        <td class="c">${item.cst ?? ''}</td>
        <td class="c">${item.cfop ?? ''}</td>
        <td class="c">${item.unidade}</td>
        <td class="r">${fmt4(item.quantidade)}</td>
        <td class="r">${fmt4(item.valor_unitario)}</td>
        <td class="r">${fmt(item.valor_total)}</td>
        <td class="r">${fmt(item.base_icms)}</td>
        <td class="r">${fmt(item.valor_icms)}</td>
        <td class="r">${fmt(item.valor_ipi)}</td>
        <td class="r">${item.aliq_icms != null ? item.aliq_icms + '%' : ''}</td>
        <td class="r">${item.aliq_ipi != null && item.aliq_ipi > 0 ? item.aliq_ipi + '%' : ''}</td>
      </tr>`).join('');

    // -- duplicatas --
    const linhasDup = d.faturas?.map(f => `
      <td class="dup-cell">
        <span class="lbl">Nº ${f.numero}</span><br>
        <b>${fmtDate(f.vencimento)}</b><br>
        R$ ${fmt(f.valor)}
      </td>`).join('') ?? '';

    // -- endereço emitente --
    const endEmit = [
      d.emitente.logradouro,
      d.emitente.numero ? 'Nº ' + d.emitente.numero : null,
      d.emitente.complemento,
    ].filter(Boolean).join(', ');

    // -- endereço destinatário --
    const endDest = d.destinatario ? [
      d.destinatario.logradouro,
      d.destinatario.numero ? 'Nº ' + d.destinatario.numero : null,
      d.destinatario.complemento,
    ].filter(Boolean).join(', ') : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>DANFE — NF-e ${fmtNfe(d.numero_nfe)}</title>
<style>
  @page { size: A4 portrait; margin: 5mm; }
  @media print { body { margin: 0; } .no-print { display: none; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #000; background: #fff; }
  .danfe { width: 200mm; margin: 0 auto; }
  .b { border: 0.4pt solid #000; }
  .flex { display: flex; }
  .lbl { font-size: 5.5pt; text-transform: uppercase; display: block; }
  .val { font-size: 7.5pt; font-weight: bold; }
  .c { text-align: center; }
  .r { text-align: right; }
  .cell { border: 0.4pt solid #000; padding: 0.8mm 1mm; overflow: hidden; }
  /* Header */
  .hd-emit { border: 0.4pt solid #000; padding: 1.5mm; flex: 0 0 44%; text-align: center; }
  .hd-danfe { border: 0.4pt solid #000; padding: 1mm; flex: 0 0 24%; text-align: center; display: flex; flex-direction: column; justify-content: space-around; align-items: center; }
  .hd-num { border: 0.4pt solid #000; padding: 1mm; flex: 0 0 32%; }
  .emit-name { font-size: 9pt; font-weight: bold; margin-bottom: 1mm; }
  .emit-addr { font-size: 6.5pt; line-height: 1.4; }
  .danfe-title { font-size: 9pt; font-weight: bold; letter-spacing: 1pt; }
  .danfe-sub { font-size: 5.5pt; line-height: 1.3; margin: 1mm 0; }
  .tio { border: 1pt solid #000; display: inline-block; width: 8mm; height: 8mm; line-height: 8mm; text-align: center; font-size: 14pt; font-weight: bold; }
  .nfe-num { font-size: 9pt; font-weight: bold; margin: 1mm 0; }
  /* Sections */
  .sec-title { background: #e5e5e5; font-size: 6pt; font-weight: bold; text-transform: uppercase; padding: 0.5mm 1mm; text-align: center; border: 0.4pt solid #000; }
  /* Chave */
  .chave-val { font-size: 7.5pt; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 0.3mm; text-align: center; padding: 1mm; }
  /* Emitente/Dest grid */
  .party-grid { display: flex; }
  .party-half { flex: 1; }
  /* Tax table */
  .tax-row { display: flex; }
  .tax-cell { border: 0.4pt solid #000; padding: 0.8mm 1mm; flex: 1; }
  /* Items table */
  table.itens { width: 100%; border-collapse: collapse; }
  table.itens th, table.itens td {
    border: 0.4pt solid #000; padding: 0.4mm 0.6mm; font-size: 6pt; vertical-align: top;
  }
  table.itens th { background: #ebebeb; font-size: 5.5pt; text-transform: uppercase; font-weight: bold; }
  table.itens td.r { text-align: right; }
  table.itens td.c { text-align: center; }
  /* Duplicatas */
  .dup-table { display: flex; flex-wrap: wrap; border: 0.4pt solid #000; }
  .dup-cell { border: 0.4pt solid #000; padding: 0.8mm 1mm; min-width: 25mm; flex: 1; font-size: 6.5pt; }
  /* Info adicional */
  .info-grid { display: flex; }
  .info-left { flex: 0 0 70%; border: 0.4pt solid #000; padding: 1mm; min-height: 16mm; }
  .info-right { flex: 1; border: 0.4pt solid #000; padding: 1mm; min-height: 16mm; }
  /* Print btn */
  .print-btn { position: fixed; top: 5mm; right: 5mm; padding: 4pt 8pt; background: #1d4ed8; color: #fff; border: none; border-radius: 3pt; cursor: pointer; font-size: 8pt; }
  .source-badge { font-size: 5.5pt; color: #666; }
  .mt1 { margin-top: 0.8mm; }
  .mt2 { margin-top: 1.5mm; }
  .inline-fields { display: flex; gap: 3mm; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Imprimir</button>
<div class="danfe">

<!-- ====== CABEÇALHO ====== -->
<div class="flex">
  <!-- Emitente -->
  <div class="hd-emit">
    <div class="emit-name">${d.emitente.razao_social}</div>
    ${d.emitente.nome_fantasia ? `<div style="font-size:7pt;font-style:italic;">${d.emitente.nome_fantasia}</div>` : ''}
    <div class="emit-addr mt1">
      ${endEmit ? endEmit + '<br>' : ''}
      ${[d.emitente.bairro, d.emitente.municipio].filter(Boolean).join(' - ')}${d.emitente.uf ? ' - ' + d.emitente.uf : ''}<br>
      ${fmtCep(d.emitente.cep) ? 'CEP: ' + fmtCep(d.emitente.cep) : ''}
      ${d.emitente.fone ? ' &nbsp; Fone: ' + d.emitente.fone : ''}
    </div>
    <div class="mt1 inline-fields" style="justify-content:center;">
      <span><span class="lbl">CNPJ</span><span class="val">${fmtCnpj(d.emitente.cnpj)}</span></span>
      ${d.emitente.ie ? `<span><span class="lbl">IE</span><span class="val">${d.emitente.ie}</span></span>` : ''}
    </div>
  </div>
  <!-- DANFE label -->
  <div class="hd-danfe">
    <div class="danfe-title">DANFE</div>
    <div class="danfe-sub">Documento Auxiliar da<br>Nota Fiscal Eletrônica</div>
    <div>
      <div class="lbl" style="margin-bottom:0.3mm">Entrada/Saída</div>
      <div class="tio">${d.tipo_operacao === 1 ? '2' : '1'}</div>
    </div>
    <div class="nfe-num">Nº ${fmtNfe(d.numero_nfe)}</div>
    <div class="lbl">Série ${d.serie ?? '1'}</div>
    ${d.source === 'db' ? '<div class="source-badge mt1">* Gerado sem XML</div>' : ''}
  </div>
  <!-- Número/Datas -->
  <div class="hd-num">
    <div class="cell"><span class="lbl">Data de Emissão</span><span class="val">${fmtDate(d.data_emissao)}</span></div>
    <div class="cell mt1"><span class="lbl">Data de Entrada/Saída</span><span class="val">${fmtDate(d.data_saida)}</span></div>
    <div class="cell mt1"><span class="lbl">Hora de Entrada/Saída</span><span class="val">&nbsp;</span></div>
  </div>
</div>

<!-- ====== NATUREZA / PROTOCOLO ====== -->
<div class="flex">
  <div class="cell" style="flex:0 0 60%">
    <span class="lbl">Natureza da Operação</span>
    <span class="val">${d.natureza_operacao ?? '—'}</span>
  </div>
  <div class="cell" style="flex:1">
    <span class="lbl">Protocolo de Autorização de Uso</span>
    <span class="val">${d.protocolo ? d.protocolo + (d.data_protocolo ? ' — ' + fmtDate(d.data_protocolo) : '') : '—'}</span>
  </div>
</div>

<!-- ====== CHAVE DE ACESSO ====== -->
<div class="cell">
  <span class="lbl">Chave de Acesso</span>
  <div class="chave-val">${fmtChave(d.chave_acesso) || '—'}</div>
</div>

<!-- ====== EMITENTE ====== -->
<div class="sec-title">Dados do Emitente</div>
<div class="flex">
  <div class="cell" style="flex:0 0 50%"><span class="lbl">Nome/Razão Social</span><span class="val">${d.emitente.razao_social}</span></div>
  <div class="cell" style="flex:0 0 22%"><span class="lbl">CNPJ</span><span class="val">${fmtCnpj(d.emitente.cnpj)}</span></div>
  <div class="cell" style="flex:1"><span class="lbl">Inscrição Estadual</span><span class="val">${d.emitente.ie ?? ''}</span></div>
</div>
<div class="flex">
  <div class="cell" style="flex:0 0 50%"><span class="lbl">Endereço</span><span class="val">${endEmit || '—'}</span></div>
  <div class="cell" style="flex:0 0 24%"><span class="lbl">Bairro/Distrito</span><span class="val">${d.emitente.bairro ?? ''}</span></div>
  <div class="cell" style="flex:0 0 10%"><span class="lbl">CEP</span><span class="val">${fmtCep(d.emitente.cep)}</span></div>
  <div class="cell" style="flex:1"><span class="lbl">Município</span><span class="val">${d.emitente.municipio ?? ''}</span></div>
  <div class="cell" style="flex:0 0 5%"><span class="lbl">UF</span><span class="val">${d.emitente.uf ?? ''}</span></div>
</div>

<!-- ====== DESTINATÁRIO ====== -->
<div class="sec-title">Dados do Destinatário/Remetente</div>
<div class="flex">
  <div class="cell" style="flex:0 0 50%"><span class="lbl">Nome/Razão Social</span><span class="val">${d.destinatario?.razao_social ?? '—'}</span></div>
  <div class="cell" style="flex:0 0 22%"><span class="lbl">CNPJ/CPF</span><span class="val">${fmtCnpj(d.destinatario?.cnpj ?? d.destinatario?.cpf)}</span></div>
  <div class="cell" style="flex:0 0 14%"><span class="lbl">Inscrição Estadual</span><span class="val">${d.destinatario?.ie ?? ''}</span></div>
  <div class="cell" style="flex:1"><span class="lbl">Data Emissão</span><span class="val">${fmtDate(d.data_emissao)}</span></div>
</div>
<div class="flex">
  <div class="cell" style="flex:0 0 50%"><span class="lbl">Endereço</span><span class="val">${endDest || '—'}</span></div>
  <div class="cell" style="flex:0 0 24%"><span class="lbl">Bairro/Distrito</span><span class="val">${d.destinatario?.bairro ?? ''}</span></div>
  <div class="cell" style="flex:0 0 10%"><span class="lbl">CEP</span><span class="val">${fmtCep(d.destinatario?.cep)}</span></div>
  <div class="cell" style="flex:1"><span class="lbl">Município</span><span class="val">${d.destinatario?.municipio ?? ''}</span></div>
  <div class="cell" style="flex:0 0 5%"><span class="lbl">UF</span><span class="val">${d.destinatario?.uf ?? ''}</span></div>
</div>

<!-- ====== DUPLICATAS ====== -->
${d.faturas && d.faturas.length > 0 ? `
<div class="sec-title">Fatura / Duplicatas</div>
<div class="dup-table">${linhasDup}</div>
` : ''}

<!-- ====== CÁLCULO DO IMPOSTO ====== -->
<div class="sec-title">Cálculo do Imposto</div>
<div class="tax-row">
  <div class="tax-cell"><span class="lbl">Base de Cálculo do ICMS</span><span class="val">${fmt(d.totais.base_icms)}</span></div>
  <div class="tax-cell"><span class="lbl">Valor do ICMS</span><span class="val">${fmt(d.totais.valor_icms)}</span></div>
  <div class="tax-cell"><span class="lbl">Base de Cálculo do ICMS ST</span><span class="val">${fmt(d.totais.base_icms_st)}</span></div>
  <div class="tax-cell"><span class="lbl">Valor do ICMS ST</span><span class="val">${fmt(d.totais.valor_icms_st)}</span></div>
  <div class="tax-cell"><span class="lbl">Valor Total dos Produtos</span><span class="val">${fmt(d.totais.valor_produtos)}</span></div>
</div>
<div class="tax-row">
  <div class="tax-cell"><span class="lbl">Valor do Frete</span><span class="val">${fmt(d.totais.valor_frete)}</span></div>
  <div class="tax-cell"><span class="lbl">Valor do Seguro</span><span class="val">${fmt(d.totais.valor_seguro)}</span></div>
  <div class="tax-cell"><span class="lbl">Desconto</span><span class="val">${fmt(d.totais.desconto)}</span></div>
  <div class="tax-cell"><span class="lbl">Outras Despesas Acessórias</span><span class="val">${fmt(d.totais.outros)}</span></div>
  <div class="tax-cell"><span class="lbl">Valor do IPI</span><span class="val">${fmt(d.totais.valor_ipi)}</span></div>
  <div class="tax-cell" style="flex:1.5"><span class="lbl">Valor Total da NF</span><span class="val" style="font-size:9pt;color:#000">${fmt(d.totais.valor_total)}</span></div>
</div>

<!-- ====== TRANSPORTE ====== -->
<div class="sec-title">Transportador/Volumes Transportados</div>
<div class="flex">
  <div class="cell" style="flex:0 0 35%"><span class="lbl">Razão Social</span><span class="val">${d.transporte?.transportadora ?? '—'}</span></div>
  <div class="cell" style="flex:0 0 20%"><span class="lbl">Frete por Conta</span><span class="val">${fmtMod(d.transporte?.modalidade_frete ?? '9')}</span></div>
  <div class="cell" style="flex:0 0 18%"><span class="lbl">CNPJ/CPF</span><span class="val">${fmtCnpj(d.transporte?.cnpj)}</span></div>
  <div class="cell" style="flex:0 0 10%"><span class="lbl">Inscrição Estadual</span><span class="val">${d.transporte?.ie ?? ''}</span></div>
  <div class="cell" style="flex:1"><span class="lbl">Placa do Veículo</span><span class="val">${d.transporte?.placa ?? ''}</span></div>
  <div class="cell" style="flex:0 0 5%"><span class="lbl">UF</span><span class="val">${d.transporte?.uf_veiculo ?? ''}</span></div>
</div>
<div class="flex">
  <div class="cell" style="flex:1"><span class="lbl">Endereço</span><span class="val">${d.transporte?.endereco ?? ''}</span></div>
  <div class="cell" style="flex:0 0 24%"><span class="lbl">Município</span><span class="val">${d.transporte?.municipio ?? ''}</span></div>
  <div class="cell" style="flex:0 0 5%"><span class="lbl">UF</span><span class="val">${d.transporte?.uf ?? ''}</span></div>
  <div class="cell" style="flex:0 0 8%"><span class="lbl">Qtde</span><span class="val">${d.transporte?.quantidade_volumes ?? ''}</span></div>
  <div class="cell" style="flex:0 0 10%"><span class="lbl">Espécie</span><span class="val">${d.transporte?.especie ?? ''}</span></div>
  <div class="cell" style="flex:0 0 10%"><span class="lbl">Peso Bruto</span><span class="val">${d.transporte?.peso_bruto ?? ''}</span></div>
  <div class="cell" style="flex:0 0 10%"><span class="lbl">Peso Líquido</span><span class="val">${d.transporte?.peso_liquido ?? ''}</span></div>
</div>

<!-- ====== DADOS DOS PRODUTOS ====== -->
<div class="sec-title">Dados dos Produtos / Serviços</div>
<table class="itens">
  <thead>
    <tr>
      <th style="width:3%">Nº</th>
      <th style="width:7%">Código</th>
      <th style="width:27%">Descrição do Produto/Serviço</th>
      <th style="width:6%">NCM/SH</th>
      <th style="width:4%">CST</th>
      <th style="width:4%">CFOP</th>
      <th style="width:4%">Un</th>
      <th style="width:6%">Qtde</th>
      <th style="width:7%">Vl Unit</th>
      <th style="width:7%">Vl Total</th>
      <th style="width:6%">BC ICMS</th>
      <th style="width:5%">Vl ICMS</th>
      <th style="width:5%">Vl IPI</th>
      <th style="width:4%">% ICMS</th>
      <th style="width:4%">% IPI</th>
    </tr>
  </thead>
  <tbody>${linhasItens}</tbody>
</table>

<!-- ====== INFORMAÇÕES ADICIONAIS ====== -->
<div class="sec-title">Dados Adicionais</div>
<div class="info-grid">
  <div class="info-left">
    <span class="lbl">Informações Complementares</span>
    <div style="margin-top:0.5mm;font-size:6.5pt;line-height:1.4;">${d.info_complementar ?? ''}</div>
  </div>
  <div class="info-right">
    <span class="lbl">Reservado ao Fisco</span>
  </div>
</div>

</div><!-- end .danfe -->
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); }</script>
</body>
</html>`;
  }
}
