import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CompraService } from '#core/services/compra.service';
import { FornecedorService } from '#core/services/fornecedor.service';
import { ProdutoService } from '#core/services/produto.service';
import { FornecedorLookupDialogComponent } from '../dialogs/fornecedor-lookup-dialog/fornecedor-lookup-dialog.component';
import { ProdutoLookupDialogComponent } from '../dialogs/produto-lookup-dialog/produto-lookup-dialog.component';
import { ProdutoFormComponent } from '../../produtos/produto-form/produto-form.component';
import { ICompra, IFornecedor, IProduto } from '#shared/interfaces';
import { EStatusCompra } from '#shared/enums';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CurrencyMaskDirective,
    TableModule,
    DatePickerModule,
    TooltipModule,
    SelectModule,
    DialogModule,
    NgxMaskDirective,
    EnterFocusNextDirective,
    DialogWrapperComponent,
    FornecedorLookupDialogComponent,
    ProdutoLookupDialogComponent,
    ProdutoFormComponent,
  ],
  providers: [provideNgxMask()],
  templateUrl: './compra-form.component.html',
  styleUrls: ['./compra-form.component.scss'],
})
export class CompraFormComponent implements OnInit {
  @ViewChild('fornecedorLookup') fornecedorLookup!: FornecedorLookupDialogComponent;
  @ViewChild('produtoLookup') produtoLookup!: ProdutoLookupDialogComponent;
  @ViewChild('produtoForm') produtoFormRef!: ProdutoFormComponent;
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  compraId?: number;
  EStatusCompra = EStatusCompra;

  statusAtual = EStatusCompra.Rascunho;

  statusOpcoes = [
    { label: 'Rascunho', value: EStatusCompra.Rascunho },
    { label: 'Confirmada', value: EStatusCompra.Confirmada },
    { label: 'Cancelada', value: EStatusCompra.Cancelada },
  ];

  // ── Fila de confirmação de produtos não encontrados via GTIN ─────────────────
  filaProdutosPendentes: Record<string, unknown>[] = [];
  filaProdutoIndex = 0;
  showProdutoConfirma = false;
  produtoConfirmaAtual: Record<string, unknown> | null = null;

  // ── Diálogos pós-save ────────────────────────────────────────────────────────
  showHelp = false;
  showConfirmaAtualizacaoCusto = false;
  isAtualizandoCusto = false;
  private compraIdSalva?: number;
  private xmlContent: string | null = null;

  constructor(
    private fb: FormBuilder,
    private compraService: CompraService,
    private fornecedorService: FornecedorService,
    private produtoService: ProdutoService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      cnpj_lookup: [''],
      cod_fornecedor: [null as number | null, [Validators.required]],
      razao_social_fornecedor: [{ value: '', disabled: true }],
      numero_nfe: [''],
      serie: [''],
      chave_acesso: [''],
      data_emissao: [null as Date | null],
      data_entrada: [null as Date | null],
      valor_frete: [0],
      valor_seguro: [0],
      valor_desconto: [0],
      valor_outros: [0],
      observacao: [''],
      itens: this.fb.array([]),
    });

    // Recalcular custos ao alterar valores do cabeçalho
    ['valor_frete', 'valor_seguro', 'valor_desconto', 'valor_outros'].forEach((campo) => {
      this.form.get(campo)?.valueChanges.subscribe(() => {
        for (let i = 0; i < this.itens.length; i++) {
          this.calcularCustoItem(i);
        }
      });
    });
  }

  get itens() {
    return this.form.get('itens') as FormArray;
  }

  abrir(id?: number) {
    this.compraId = id;
    this.visible = true;
    this.statusAtual = EStatusCompra.Rascunho;
    this.xmlContent = null;
    this.form.reset({ valor_frete: 0, valor_seguro: 0, valor_desconto: 0, valor_outros: 0 });
    this.itens.clear();

    if (id) {
      this.isLoadingData = true;
      this.compraService.buscarPorId(id).subscribe({
        next: (res) => {
          const compra: ICompra = res.data;
          this.statusAtual = compra.status;
          this.form.patchValue({
            cod_fornecedor: compra.cod_fornecedor,
            razao_social_fornecedor: compra.fornecedor?.razao_social ?? '',
            numero_nfe: compra.numero_nfe ?? '',
            serie: compra.serie ?? '',
            chave_acesso: compra.chave_acesso ?? '',
            data_emissao: compra.data_emissao ? new Date(compra.data_emissao) : null,
            data_entrada: compra.data_entrada ? new Date(compra.data_entrada) : null,
            valor_frete: Number(compra.valor_frete),
            valor_seguro: Number(compra.valor_seguro),
            valor_desconto: Number(compra.valor_desconto),
            valor_outros: Number(compra.valor_outros),
            observacao: compra.observacao ?? '',
          });
          compra.itens?.forEach((item) => this.adicionarItem(item as unknown as Partial<Record<string, unknown>>));
          this.isLoadingData = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar compra' });
          this.visible = false;
        },
      });
    } else {
      this.adicionarItem();
    }
  }

  // ── Fornecedor lookup ────────────────────────────────────────────────────────

  onCnpjBlur() {
    const cnpj = (this.form.get('cnpj_lookup')?.value ?? '').replace(/\D/g, '');
    if (cnpj.length !== 14) return;

    this.fornecedorService.buscarPorCnpj(cnpj).subscribe({
      next: (res) => {
        this.preencherFornecedor(res.data);
      },
      error: (err) => {
        if (err.status === 404) {
          this.fornecedorLookup.abrir(cnpj);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao buscar fornecedor' });
        }
      },
    });
  }

  preencherFornecedor(fornecedor: IFornecedor) {
    this.form.patchValue({
      cod_fornecedor: fornecedor.id,
      razao_social_fornecedor: fornecedor.razao_social,
      cnpj_lookup: fornecedor.cnpj,
    });
  }

  onFornecedorSelecionado(fornecedor: IFornecedor) {
    this.preencherFornecedor(fornecedor);
  }

  onFornecedorCancelado() {
    this.form.patchValue({ cnpj_lookup: '', cod_fornecedor: null, razao_social_fornecedor: '' });
  }

  onBuscarFornecedor() {
    this.fornecedorLookup.abrirListagem();
  }

  onBuscarProduto(index: number) {
    this.produtoLookup.abrirListagem(index);
  }

  // ── Itens ────────────────────────────────────────────────────────────────────

  adicionarItem(data?: Partial<Record<string, unknown>>) {
    const itemGroup = this.fb.group({
      cod_produto: [data?.['cod_produto'] as number | null, [Validators.required]],
      descricao_xml: [String(data?.['descricao_xml'] ?? data?.['descricao'] ?? '')],
      descricao: [String(data?.['descricao'] ?? ''), [Validators.required]],
      ncm: [String(data?.['ncm'] ?? '')],
      cfop: [String(data?.['cfop'] ?? '')],
      unidade: [String(data?.['unidade'] ?? 'UN'), [Validators.required]],
      quantidade: [Number(data?.['quantidade'] ?? 0), [Validators.required, Validators.min(0.0001)]],
      valor_unitario: [Number(data?.['valor_unitario'] ?? 0)],
      valor_total: [{ value: Number(data?.['valor_total'] ?? 0), disabled: true }],
      desconto: [Number(data?.['desconto'] ?? 0)],
      base_icms: [Number(data?.['base_icms'] ?? 0)],
      aliq_icms: [Number(data?.['aliq_icms'] ?? 0)],
      valor_icms: [Number(data?.['valor_icms'] ?? 0)],
      base_icms_st: [Number(data?.['base_icms_st'] ?? 0)],
      valor_icms_st: [Number(data?.['valor_icms_st'] ?? 0)],
      valor_ipi: [Number(data?.['valor_ipi'] ?? 0)],
      aliq_pis: [Number(data?.['aliq_pis'] ?? 0)],
      valor_pis: [Number(data?.['valor_pis'] ?? 0)],
      aliq_cofins: [Number(data?.['aliq_cofins'] ?? 0)],
      valor_cofins: [Number(data?.['valor_cofins'] ?? 0)],
      custo_unitario: [{ value: Number(data?.['custo_unitario'] ?? 0), disabled: true }],
    });

    const idx = this.itens.length;

    // Recalcular valor_total automaticamente (qtd × vlr_unit) e depois custo
    const recalcTotal = () => {
      const qty = Number(itemGroup.get('quantidade')?.value || 0);
      const vu  = Number(itemGroup.get('valor_unitario')?.value || 0);
      itemGroup.get('valor_total')?.setValue(qty * vu, { emitEvent: true });
      this.calcularCustoItem(idx);
    };
    ['quantidade', 'valor_unitario'].forEach((c) => {
      itemGroup.get(c)?.valueChanges.subscribe(() => recalcTotal());
    });

    // Recalcular custo ao alterar impostos/desconto
    ['desconto', 'valor_ipi', 'valor_icms_st'].forEach((c) => {
      itemGroup.get(c)?.valueChanges.subscribe(() => this.calcularCustoItem(idx));
    });

    this.itens.push(itemGroup);
  }

  removerItem(index: number) {
    this.itens.removeAt(index);
    // Recalcular todos os custos após remoção
    for (let i = 0; i < this.itens.length; i++) {
      this.calcularCustoItem(i);
    }
  }

  preencherProdutoNoItem(index: number, produto: IProduto) {
    this.itens.at(index).patchValue({
      cod_produto: produto.id,
      descricao: produto.descricao,
      unidade: produto.unidade_medida,
      ncm: produto.ncm ?? '',
      cfop: produto.cfop_padrao ?? '',
    }, { emitEvent: false });
    this.calcularCustoItem(index);
  }

  onProdutoSelecionado(event: { produto: IProduto; itemIndex: number }) {
    if (event.itemIndex === -1) {
      // Contexto de fila: relaciona o item pendente ao produto selecionado
      const item = this.produtoConfirmaAtual!;
      this.adicionarItem({ ...item, cod_produto: event.produto.id, descricao: event.produto.descricao, unidade: event.produto.unidade_medida });
      this.salvarVinculoFornecedorSeNecessario(event.produto.id, item, true);
      this.filaProdutoIndex++;
      setTimeout(() => this.processarProximoPendente(), 100);
    } else {
      this.preencherProdutoNoItem(event.itemIndex, event.produto);
    }
  }

  // ── Cálculo de custo ─────────────────────────────────────────────────────────

  calcularCustoItem(itemIndex: number) {
    const item = (this.itens.at(itemIndex) as FormGroup).getRawValue() as Record<string, number>;
    const somaItens = this.itens.controls.reduce((s, c) => s + (Number((c as FormGroup).getRawValue()['valor_total']) || 0), 0);
    const cab = this.form.value as Record<string, number>;
    const totalAdicional =
      (Number(cab['valor_frete']) || 0) +
      (Number(cab['valor_seguro']) || 0) +
      (Number(cab['valor_outros']) || 0) -
      (Number(cab['valor_desconto']) || 0);
    const proporcao = somaItens > 0 ? (Number(item['valor_total']) || 0) / somaItens : 0;
    const rateio = totalAdicional * proporcao;
    const custo =
      item['quantidade'] > 0
        ? ((Number(item['valor_total']) || 0) -
           (Number(item['desconto']) || 0) +
           (Number(item['valor_ipi']) || 0) +
           (Number(item['valor_icms_st']) || 0) +
           rateio) /
          item['quantidade']
        : 0;
    this.itens.at(itemIndex).patchValue({ custo_unitario: custo }, { emitEvent: false });
  }

  calcularTotalProdutos(): number {
    return this.itens.controls.reduce((s, c) => s + (Number((c as FormGroup).getRawValue()['valor_total']) || 0), 0);
  }

  calcularTotalGeral(): number {
    const cab = this.form.value as Record<string, number>;
    const ipiTotal = this.itens.controls.reduce((s, c) => s + (Number(c.value['valor_ipi']) || 0), 0);
    return (
      this.calcularTotalProdutos() +
      (Number(cab['valor_frete']) || 0) +
      (Number(cab['valor_seguro']) || 0) +
      (Number(cab['valor_outros']) || 0) +
      ipiTotal -
      (Number(cab['valor_desconto']) || 0)
    );
  }

  // ── Import XML ───────────────────────────────────────────────────────────────

  onImportarXml(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    arquivo.text().then(text => { this.xmlContent = text; });

    this.compraService.importarXml(arquivo).subscribe({
      next: (res) => {
        if (!res.success) {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: String((res as unknown as Record<string, unknown>)['message'] ?? 'Erro ao importar XML') });
          input.value = '';
          return;
        }
        const dados = res.data as Record<string, unknown>;
        this.itens.clear();

        // Preenche cabeçalho
        this.form.patchValue({
          chave_acesso: dados['chave_acesso'] ?? '',
          numero_nfe: dados['numero_nfe'] ?? '',
          serie: dados['serie'] ?? '',
          data_emissao: dados['data_emissao'] ? new Date(String(dados['data_emissao'])) : null,
          valor_frete: Number(dados['valor_frete'] ?? 0),
          valor_seguro: Number(dados['valor_seguro'] ?? 0),
          valor_desconto: Number(dados['valor_desconto'] ?? 0),
          valor_outros: Number(dados['valor_outros'] ?? 0),
        });

        // Preenche fornecedor se já existir
        const fornecedor = dados['fornecedor'] as IFornecedor | null;
        if (fornecedor) {
          this.preencherFornecedor(fornecedor);
        } else {
          const emitente = dados['emitente'] as Record<string, string>;
          this.form.patchValue({
            cnpj_lookup: emitente?.['cnpj'] ?? '',
            razao_social_fornecedor: emitente?.['razao_social'] ?? '',
            cod_fornecedor: null,
          });
          if (emitente?.['cnpj']) {
            this.fornecedorLookup.abrir(emitente['cnpj'], emitente);
          }
        }

        // Processa itens: busca por GTIN, fila de confirmação para não encontrados
        const itens = dados['itens'] as Record<string, unknown>[];
        this.processarItensXml(itens);
        input.value = '';
      },
      error: (err) => {
        const msg = (err as { error?: { message?: string } })?.error?.message ?? 'Falha ao importar XML';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        input.value = '';
      },
    });
  }

  // Processa cada item do XML: tenta casar por GTIN, empilha os não encontrados
  private processarItensXml(itens: Record<string, unknown>[]) {
    this.filaProdutosPendentes = [];
    this.filaProdutoIndex = 0;

    const buscarProximo = (idx: number) => {
      if (idx >= itens.length) {
        // Todos consultados — agora processa a fila de não encontrados
        this.processarProximoPendente();
        return;
      }

      const item = itens[idx];
      const gtin = String(item['gtin'] ?? '').trim();

      if (!gtin) {
        // Sem GTIN: tenta casar pelo código do produto no fornecedor (cProd)
        const cProd = String(item['cProd'] ?? '').trim();
        const codFornecedor = this.form.get('cod_fornecedor')?.value as number | null;
        if (cProd && codFornecedor) {
          this.produtoService.buscarPorCodigoFornecedor(codFornecedor, cProd).subscribe({
            next: (res) => {
              this.adicionarItem({
                ...item,
                cod_produto: res.data.id,
                descricao_xml: String(item['descricao'] ?? ''),
                descricao: res.data.descricao,
                unidade: res.data.unidade_medida,
              });
              this.messageService.add({
                severity: 'info',
                summary: 'Produto relacionado',
                detail: `"${res.data.descricao}" identificado pelo código do fornecedor`,
                life: 2500,
              });
              buscarProximo(idx + 1);
            },
            error: () => {
              this.filaProdutosPendentes.push(item);
              buscarProximo(idx + 1);
            },
          });
        } else {
          this.filaProdutosPendentes.push(item);
          buscarProximo(idx + 1);
        }
        return;
      }

      this.produtoService.buscarPorGtin(gtin).subscribe({
        next: (res) => {
          // Produto encontrado pelo GTIN → relaciona automaticamente
          // descricao_xml = original do NF-e; descricao = nome no sistema
          this.adicionarItem({
            ...item,
            cod_produto: res.data.id,
            descricao_xml: String(item['descricao'] ?? ''),
            descricao: res.data.descricao,
          });
          this.messageService.add({
            severity: 'info',
            summary: 'Produto relacionado',
            detail: `"${res.data.descricao}" identificado pelo código de barras`,
            life: 2500,
          });
          buscarProximo(idx + 1);
        },
        error: (err) => {
          if ((err as { status: number }).status === 404) {
            // Não encontrado → entra na fila de confirmação
            this.filaProdutosPendentes.push(item);
          } else {
            this.filaProdutosPendentes.push(item);
          }
          buscarProximo(idx + 1);
        },
      });
    };

    buscarProximo(0);
  }

  // Exibe a confirmação para o próximo item pendente na fila
  private processarProximoPendente() {
    if (this.filaProdutoIndex >= this.filaProdutosPendentes.length) {
      const total = this.itens.length;
      const pulados = this.filaProdutosPendentes.length - (this.filaProdutosPendentes.length - this.filaProdutoIndex);
      this.messageService.add({
        severity: 'success',
        summary: 'XML Processado',
        detail: `${total} ${total === 1 ? 'item adicionado' : 'itens adicionados'} à compra.`,
      });
      return;
    }

    this.produtoConfirmaAtual = this.filaProdutosPendentes[this.filaProdutoIndex];
    this.showProdutoConfirma = true;
  }

  // Usuário confirmou: abre o form de produto com dados pré-preenchidos do XML
  onConfirmarCadastrarProduto() {
    this.showProdutoConfirma = false;
    setTimeout(() => this.produtoFormRef?.abrir(undefined, this.produtoConfirmaAtual!), 0);
  }

  // Usuário optou por relacionar a produto já existente
  onRelacionarProdutoExistente() {
    this.showProdutoConfirma = false;
    setTimeout(() => this.produtoLookup.abrirListagem(-1), 0);
  }

  // Produto salvo pelo form: adiciona o item à compra e continua a fila
  onProdutoSalvoDoXml(produto: IProduto) {
    const item = this.produtoConfirmaAtual!;
    this.adicionarItem({ ...item, cod_produto: produto.id });
    this.salvarVinculoFornecedorSeNecessario(produto.id, item);
    this.filaProdutoIndex++;
    setTimeout(() => this.processarProximoPendente(), 100);
  }

  private salvarVinculoFornecedorSeNecessario(codProduto: number, item: Record<string, unknown>, forcar = false) {
    const gtin = String(item['gtin'] ?? '').trim();
    const cProd = String(item['cProd'] ?? '').trim();
    const codFornecedor = this.form.get('cod_fornecedor')?.value as number | null;
    if (cProd && codFornecedor && (forcar || !gtin)) {
      this.produtoService.salvarCodigoFornecedor(codProduto, codFornecedor, cProd).subscribe();
    }
  }

  // Usuário pulou: não adiciona o item, vai para o próximo
  onPularProduto() {
    this.showProdutoConfirma = false;
    this.filaProdutoIndex++;
    setTimeout(() => this.processarProximoPendente(), 100);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios e vincule os produtos.' });
      return;
    }

    if (this.itens.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione pelo menos um item antes de gravar a compra.' });
      return;
    }

    this.isSaving = true;
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const dados = {
      cod_fornecedor: raw['cod_fornecedor'] as number,
      numero_nfe: raw['numero_nfe'] as string,
      serie: raw['serie'] as string,
      chave_acesso: raw['chave_acesso'] as string,
      data_emissao: raw['data_emissao'] ? (raw['data_emissao'] as Date).toISOString() : undefined,
      data_entrada: raw['data_entrada'] ? (raw['data_entrada'] as Date).toISOString() : undefined,
      valor_frete: Number(raw['valor_frete']),
      valor_seguro: Number(raw['valor_seguro']),
      valor_desconto: Number(raw['valor_desconto']),
      valor_outros: Number(raw['valor_outros']),
      observacao: raw['observacao'] as string,
      xml_content: this.xmlContent ?? undefined,
      itens: (raw['itens'] as Record<string, unknown>[]).map((item) => ({
        cod_produto: Number(item['cod_produto']),
        descricao_xml: item['descricao_xml'] ? String(item['descricao_xml']) : undefined,
        descricao: String(item['descricao']),
        ncm: String(item['ncm'] ?? ''),
        cfop: String(item['cfop'] ?? ''),
        unidade: String(item['unidade']),
        quantidade: Number(item['quantidade']),
        valor_unitario: Number(item['valor_unitario']),
        valor_total: Number(item['valor_total']),
        desconto: Number(item['desconto'] ?? 0),
        base_icms: Number(item['base_icms'] ?? 0),
        aliq_icms: Number(item['aliq_icms'] ?? 0),
        valor_icms: Number(item['valor_icms'] ?? 0),
        base_icms_st: Number(item['base_icms_st'] ?? 0),
        valor_icms_st: Number(item['valor_icms_st'] ?? 0),
        valor_ipi: Number(item['valor_ipi'] ?? 0),
        aliq_pis: Number(item['aliq_pis'] ?? 0),
        valor_pis: Number(item['valor_pis'] ?? 0),
        aliq_cofins: Number(item['aliq_cofins'] ?? 0),
        valor_cofins: Number(item['valor_cofins'] ?? 0),
      })),
      id: this.compraId,
    };

    this.compraService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.compraId = res.data.id;
          this.compraIdSalva = res.data.id;
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Compra ${dados.id ? 'atualizada' : 'criada'} com sucesso` });
          // Pergunta se deseja atualizar custo dos produtos
          this.showConfirmaAtualizacaoCusto = true;
        }
        this.isSaving = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Falha ao salvar compra';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        this.isSaving = false;
      },
    });
  }

  // ── Atualização de custo pós-save ────────────────────────────────────────────

  onConfirmarAtualizacaoCusto() {
    this.isAtualizandoCusto = true;
    this.compraService.atualizarCusto(this.compraIdSalva!).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Custo Atualizado', detail: 'Custo dos produtos atualizado com sucesso.' });
        this.isAtualizandoCusto = false;
        this.showConfirmaAtualizacaoCusto = false;
        this.saved.emit();
        this.visible = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao atualizar custo.' });
        this.isAtualizandoCusto = false;
      },
    });
  }

  onNaoAtualizarCusto() {
    this.showConfirmaAtualizacaoCusto = false;
    this.saved.emit();
    this.visible = false;
  }

  onConfirmar() {
    if (!this.compraId) return;
    this.compraService.alterarStatus(this.compraId, EStatusCompra.Confirmada).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Compra Confirmada', detail: 'Estoque e custos dos produtos foram atualizados.' });
        this.statusAtual = EStatusCompra.Confirmada;
        this.saved.emit();
        this.visible = false;
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message ?? 'Falha ao confirmar compra' }),
    });
  }

  isRascunho(): boolean {
    return this.statusAtual === EStatusCompra.Rascunho;
  }

  trackByIndex(index: number) {
    return index;
  }
}
