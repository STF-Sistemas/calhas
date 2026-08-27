import { Component, EventEmitter, Output, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { DesenhoMedidaComponent } from '../desenho-medida/desenho-medida.component';
import { PedidoService } from '#core/services/pedido.service';
import { ClienteService } from '#core/services/cliente.service';
import { ProdutoService } from '#core/services/produto.service';
import { ChapaService } from '#core/services/chapa.service';
import { ServicoService } from '#core/services/servico.service';
import { DesenhoService } from '#core/services/desenho.service';
import { MeioPagamentoService } from '#core/services/meio-pagamento.service';
import { ICliente, IProduto, IChapa, IServico, IPedidoItem, IDesenho, IMeioPagamento, IDiagonal } from '#shared/interfaces';
import { EStatusGeral, EStatusPedido, ETipoItemPedido, EDescontoTipo } from '#shared/enums';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ThemeService } from '#core/services/theme.service';
import { IPonto } from '#shared/interfaces';
import { calcularValorDesconto, calcularValorLiquido } from '#shared/functions/desconto.functions';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    InputNumberModule,
    ButtonModule,
    TableModule,
    DatePickerModule,
    TooltipModule,
    CurrencyMaskDirective,
    EnterFocusNextDirective,
    DialogWrapperComponent,
    DesenhoMedidaComponent
  ],
  templateUrl: './pedido-form.component.html',
  styleUrls: ['./pedido-form.component.scss']
})
export class PedidoFormComponent implements OnInit {
  @ViewChild('medidasDialog') medidasDialog!: DesenhoMedidaComponent;
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  ETipoItemPedido = ETipoItemPedido;
  EStatusPedido = EStatusPedido;
  EDescontoTipo = EDescontoTipo;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  pedidoId?: number;

  clientes: ICliente[] = [];
  produtos: IProduto[] = [];
  chapas: IChapa[] = [];
  servicos: IServico[] = [];
  desenhos: IDesenho[] = [];
  meiosPagamento: IMeioPagamento[] = [];

  statusOpcoes = [
    { label: 'Aberto',      value: EStatusPedido.Aberto },
    { label: 'Em Produção', value: EStatusPedido.EmProducao },
    { label: 'Finalizado',  value: EStatusPedido.Concluido },
    { label: 'Cancelado',   value: EStatusPedido.Cancelado },
  ];
  tiposItem = [
    { label: 'Produto', value: ETipoItemPedido.Produto },
    { label: 'Corte', value: ETipoItemPedido.Corte },
    { label: 'Serviço Direto', value: ETipoItemPedido.Servico }
  ];
  descontoTipoOpcoes = [
    { label: 'R$', value: EDescontoTipo.Reais },
    { label: '%', value: EDescontoTipo.Percentual },
  ];

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private chapaService: ChapaService,
    private servicoService: ServicoService,
    private desenhoService: DesenhoService,
    private meioPagamentoService: MeioPagamentoService,
    private messageService: MessageService,
    public themeService: ThemeService
  ) {
    this.form = this.fb.group({
      cod_cliente: [null, [Validators.required]],
      cod_meio_pagamento: [null, [Validators.required]],
      data_pedido: [new Date(), [Validators.required]],
      status: [EStatusPedido.Aberto, [Validators.required]],
      observacoes: [''],
      valor_material: [{ value: 0, disabled: true }],
      valor_servico: [{ value: 0, disabled: true }],
      valor_total: [{ value: 0, disabled: true }],
      desconto_tipo: [EDescontoTipo.Reais],
      desconto_valor: [0, [Validators.min(0)]],
      valor_desconto: [{ value: 0, disabled: true }],
      valor_liquido: [{ value: 0, disabled: true }],
      itens: this.fb.array([])
    });

    this.form.get('desconto_tipo')?.valueChanges.subscribe((tipo) => {
      const ctrl = this.form.get('desconto_valor');
      ctrl?.setValidators(
        tipo === EDescontoTipo.Percentual ? [Validators.min(0), Validators.max(100)] : [Validators.min(0)]
      );
      ctrl?.updateValueAndValidity({ emitEvent: false });
      this.recalcularTotais();
    });
    this.form.get('desconto_valor')?.valueChanges.subscribe(() => this.recalcularTotais());
  }

  ngOnInit() {
    this.carregarAuxiliares();
  }

  get itens() {
    return this.form.get('itens') as FormArray;
  }

  carregarAuxiliares() {
    this.clienteService.listar().subscribe(res => this.clientes = res.data);
    this.produtoService.listar().subscribe(res =>
      this.produtos = res.data.filter(p => p.status === EStatusGeral.Ativo)
    );
    this.chapaService.listar().subscribe(res =>
      this.chapas = res.data
        .filter(ch => ch.status === EStatusGeral.Ativo)
        .map(ch => ({ ...ch, cortes: (ch.cortes ?? []).filter(c => c.status === EStatusGeral.Ativo) }))
    );
    this.servicoService.listar().subscribe(res =>
      this.servicos = res.data.filter(s => s.status === EStatusGeral.Ativo)
    );
    this.desenhoService.listar().subscribe(res => this.desenhos = res.data);
    this.meioPagamentoService.listar().subscribe(res => this.meiosPagamento = res.data.filter(m => m.ativo === 1));
  }

  abrir(id?: number) {
    this.pedidoId = id;
    this.visible = true;
    this.form.reset({ data_pedido: new Date(), status: EStatusPedido.Aberto, cod_meio_pagamento: null });
    this.itens.clear();

    if (id) {
      this.isLoadingData = true;
      this.pedidoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res.data,
            data_pedido: new Date(res.data.data_pedido)
          });
          res.data.itens?.forEach((item: IPedidoItem) => this.adicionarItem(item));
          this.recalcularTotais();
          this.isLoadingData = false;
        }
      });
    } else {
      this.adicionarItem();
    }
  }

  private getChapaIdDoCorteid(corteId: number | null | undefined): number | null {
    if (!corteId) return null;
    return this.chapas.find(ch => ch.cortes?.some(c => c.id === corteId))?.id ?? null;
  }

  adicionarItem(data?: Partial<IPedidoItem>) {
    const codChapa = this.getChapaIdDoCorteid(data?.cod_corte);

    const qtd   = Number(data?.quantidade)    || 1;
    const vUnit = Number(data?.valor_unitario) || 0;
    const custo = Number(data?.custo_unitario) || 0;

    const itemForm = this.fb.group({
      id: [data?.id ?? null],
      tipo: [data?.tipo || ETipoItemPedido.Produto, [Validators.required]],
      cod_produto: [data?.cod_produto ?? null],
      // cod_chapa é apenas UI — não é salvo no backend diretamente
      cod_chapa: [codChapa],
      cod_corte: [data?.cod_corte ?? null],
      cod_servico: [data?.cod_servico ?? null],
      cod_desenho: [data?.cod_desenho ?? null],
      medidas: [data?.medidas ?? []],
      quantidade: [qtd, [Validators.required, Validators.min(0.01)]],
      valor_unitario: [vUnit, [Validators.required, Validators.min(0)]],
      custo_unitario: [custo],
      subtotal: [{ value: qtd * vUnit, disabled: true }]
    });

    itemForm.valueChanges.subscribe(() => {
      this.atualizarSubtotal(itemForm);
      this.recalcularTotais();
    });

    this.itens.push(itemForm);
  }

  removerItem(index: number) {
    const item = this.itens.at(index).value;
    if (item.id && this.pedidoId) {
      this.pedidoService.removerItem(this.pedidoId, item.id).subscribe();
    }
    this.itens.removeAt(index);
    this.recalcularTotais();
  }

  onTipoChange(index: number) {
    this.itens.at(index).patchValue({
      cod_produto: null, cod_chapa: null, cod_corte: null,
      cod_servico: null, cod_desenho: null, medidas: [], valor_unitario: 0
    });
  }

  onChapaChange(index: number) {
    this.itens.at(index).patchValue(
      { cod_corte: null, cod_desenho: null, medidas: [], valor_unitario: 0 },
      { emitEvent: false }
    );
  }

  onSelecaoProduto(index: number, event: { value: number }) {
    const produto = this.produtos.find(p => p.id === event.value);
    this.itens.at(index).patchValue({ valor_unitario: Number(produto?.valor_unitario) || 0, custo_unitario: Number(produto?.custo) || 0 });
    this.recalcularTotais();
  }

  onSelecaoServico(index: number, event: { value: number }) {
    const servico = this.servicos.find(s => s.id === event.value);
    this.itens.at(index).patchValue({ valor_unitario: Number(servico?.valor) || 0, custo_unitario: 0 });
    this.recalcularTotais();
  }

  abrirMedidas(index: number) {
    const control = this.itens.at(index);
    const codDesenho = control.get('cod_desenho')?.value;
    const medidas: number[] = control.get('medidas')?.value || [];
    const desenho = this.desenhos.find(d => d.id === codDesenho);
    if (desenho) {
      this.medidasDialog.abrir(index, desenho, medidas);
    }
  }

  onMedidasConfirmadas(event: { index: number; medidas: number[] }) {
    this.itens.at(event.index).patchValue({ medidas: event.medidas }, { emitEvent: false });
    this.calcularCorteAutomatico(event.index);
  }

  /**
   * Soma correta das medidas:
   * - Segmentos base não cobertos por diagonal somam normalmente.
   * - Para cada diagonal: soma apenas o MAIOR valor entre Ponta 1 e Ponta 2.
   */
  private calcularTotalMedidas(desenho: IDesenho | undefined, medidas: number[]): number {
    if (!desenho) return medidas.reduce((s, m) => s + (Number(m) || 0), 0);
    const baseSeg = Math.max(0, desenho.pontos.length - 1);
    const diagonais: IDiagonal[] = (desenho.diagonais as IDiagonal[]) ?? [];

    // Detecta quais segmentos base estão cobertos por alguma diagonal
    const cobertos = new Set<number>();
    diagonais.forEach(d => {
      const idx = this.segmentoCobertoPorDiagonal(desenho, d);
      if (idx >= 0) cobertos.add(idx);
    });

    let total = 0;
    for (let i = 0; i < baseSeg; i++) {
      if (!cobertos.has(i)) total += Number(medidas[i]) || 0;
    }
    for (let i = 0; i < diagonais.length; i++) {
      const m1 = Number(medidas[baseSeg + i * 2]) || 0;
      const m2 = Number(medidas[baseSeg + i * 2 + 1]) || 0;
      total += Math.max(m1, m2);
    }
    return Math.round(total * 100) / 100;
  }

  private segmentoCobertoPorDiagonal(desenho: IDesenho, d: IDiagonal): number {
    const pontos = desenho.pontos as IPonto[];
    const mid: IPonto = { x: (d.p1.x + d.p2.x) / 2, y: (d.p1.y + d.p2.y) / 2 };
    let minDist = Infinity, idx = -1;
    for (let i = 0; i < pontos.length - 1; i++) {
      const dx = pontos[i + 1].x - pontos[i].x, dy = pontos[i + 1].y - pontos[i].y;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((mid.x - pontos[i].x) * dx + (mid.y - pontos[i].y) * dy) / lenSq));
      const dist = Math.hypot(mid.x - (pontos[i].x + t * dx), mid.y - (pontos[i].y + t * dy));
      if (dist < minDist) { minDist = dist; idx = i; }
    }
    return idx;
  }

  private calcularCorteAutomatico(index: number) {
    const control = this.itens.at(index);
    const codChapa = control.get('cod_chapa')?.value;
    const codDesenho = control.get('cod_desenho')?.value;
    const medidas: number[] = control.get('medidas')?.value || [];
    const desenho = this.desenhos.find(d => d.id === codDesenho);

    const totalMedida = this.calcularTotalMedidas(desenho, medidas);

    if (!codChapa || totalMedida === 0) {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      this.recalcularTotais();
      return;
    }

    const chapa = this.chapas.find(ch => ch.id === codChapa);
    if (!chapa?.cortes?.length) return;

    // Próximo corte maior ou igual à soma das medidas
    const candidatos = chapa.cortes
      .filter(c => Number(c.corte) >= totalMedida)
      .sort((a, b) => Number(a.corte) - Number(b.corte));

    if (candidatos.length > 0) {
      const corte = candidatos[0];
      const valor = Number(corte.valor_venda ?? corte.valor ?? 0);
      control.patchValue(
        { cod_corte: corte.id, valor_unitario: valor, custo_unitario: 0 },
        { emitEvent: false }
      );
      this.atualizarSubtotal(control as FormGroup);
      this.recalcularTotais();
      this.messageService.add({
        severity: 'success',
        summary: 'Corte selecionado',
        detail: `"${corte.descricao}" (${corte.corte}cm) para ${totalMedida}cm de perfil`
      });
    } else {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      this.recalcularTotais();
      this.messageService.add({
        severity: 'warn',
        summary: 'Corte não encontrado',
        detail: `Nenhum corte ≥ ${totalMedida}cm disponível nesta chapa. Selecione manualmente.`
      });
    }
  }

  getMedidasLabel(control: any): string {
    const codDesenho = control.get('cod_desenho')?.value;
    const desenho = this.desenhos.find(d => d.id === codDesenho);
    if (!desenho) return 'Informar Medidas';
    const medidas: number[] = control.get('medidas')?.value || [];
    const preenchidas = medidas.filter((m: number) => m > 0).length;
    if (preenchidas === 0) return 'Informar Medidas';
    const total = this.calcularTotalMedidas(desenho, medidas);
    const segCount = Math.max(0, desenho.pontos.length - 1) + (desenho.diagonais?.length ?? 0) * 2;
    return `Medidas (${preenchidas}/${segCount}) — Total: ${total}cm`;
  }

  getCortesDeChapa(codChapa: number) {
    return this.chapas.find(ch => ch.id === codChapa)?.cortes || [];
  }

  onCorteManualChange(index: number, event: { value: number }) {
    const control = this.itens.at(index);
    const codChapa = control.get('cod_chapa')?.value;
    const corte = this.chapas.find(ch => ch.id === codChapa)?.cortes?.find(c => c.id === event.value);
    if (corte) {
      const medidas: number[] = control.get('medidas')?.value || [];
      const codDesenho = control.get('cod_desenho')?.value;
      const desenho = this.desenhos.find(d => d.id === codDesenho);
      const totalMedida = this.calcularTotalMedidas(desenho, medidas);
      control.patchValue(
        { valor_unitario: Number(corte.valor_venda ?? corte.valor ?? 0), custo_unitario: 0 },
        { emitEvent: false }
      );
      this.atualizarSubtotal(control as FormGroup);
      this.recalcularTotais();
    }
  }

  getNomeCorteDetectado(control: any): string {
    const codCorte = control.get('cod_corte')?.value;
    if (!codCorte) return '';
    for (const ch of this.chapas) {
      const c = ch.cortes?.find(ct => ct.id === codCorte);
      if (c) return `${c.descricao} — ${c.corte}cm`;
    }
    return '';
  }

  getDesenhoPoints(pontos: IPonto[], w = 64, h = 30): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map(p => p.x), ys = pontos.map(p => p.y);
    const minX = Math.min(...xs), rangeX = (Math.max(...xs) - minX) || 1;
    const minY = Math.min(...ys), rangeY = (Math.max(...ys) - minY) || 1;
    const pad = 3;
    return pontos.map(p =>
      `${pad + ((p.x - minX) / rangeX) * (w - pad * 2)},${pad + ((p.y - minY) / rangeY) * (h - pad * 2)}`
    ).join(' ');
  }

  getDesenhoDiagonalPoints(diagonal: IDiagonal, pontos: IPonto[], w = 64, h = 30): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map(p => p.x), ys = pontos.map(p => p.y);
    const minX = Math.min(...xs), rangeX = (Math.max(...xs) - minX) || 1;
    const minY = Math.min(...ys), rangeY = (Math.max(...ys) - minY) || 1;
    const pad = 3;
    const nx = (x: number) => pad + ((x - minX) / rangeX) * (w - pad * 2);
    const ny = (y: number) => pad + ((y - minY) / rangeY) * (h - pad * 2);
    return `${nx(diagonal.p1.x)},${ny(diagonal.p1.y)} ${nx(diagonal.p2.x)},${ny(diagonal.p2.y)}`;
  }

  atualizarSubtotal(item: FormGroup) {
    const qtd = item.get('quantidade')?.value || 0;
    const val = item.get('valor_unitario')?.value || 0;
    item.get('subtotal')?.setValue(qtd * val, { emitEvent: false });
  }

  onDescontoTipoChange(): void {
    // Zera o valor ao trocar o tipo (interação do usuário) — evita reaproveitar
    // um número em reais como se fosse percentual (ou vice-versa).
    this.form.get('desconto_valor')?.setValue(0);
  }

  recalcularTotais() {
    let material = 0;
    let servicosDiretos = 0;

    this.itens.controls.forEach((control) => {
      const item = control.value as IPedidoItem;
      const sub = (item.quantidade || 0) * (item.valor_unitario || 0);
      if (item.tipo === ETipoItemPedido.Servico) {
        servicosDiretos += sub;
      } else {
        material += sub;
      }
    });

    const servicoCalculado = material;
    const total = material + servicoCalculado + servicosDiretos;

    const descontoTipo = this.form.get('desconto_tipo')?.value ?? EDescontoTipo.Reais;
    const descontoValor = this.form.get('desconto_valor')?.value ?? 0;
    const valorDesconto = calcularValorDesconto(total, descontoTipo, descontoValor);
    const valorLiquido = calcularValorLiquido(total, valorDesconto);

    this.form.patchValue({
      valor_material: material,
      valor_servico: servicoCalculado,
      valor_total: total,
      valor_desconto: valorDesconto,
      valor_liquido: valorLiquido,
    }, { emitEvent: false });
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // Valida itens antes de enviar
    const itemInvalido = this.itens.controls.findIndex(c => {
      const tipo = c.get('tipo')?.value;
      if (tipo === ETipoItemPedido.Produto) return !c.get('cod_produto')?.value;
      if (tipo === ETipoItemPedido.Corte)   return !c.get('cod_corte')?.value;
      if (tipo === ETipoItemPedido.Servico) return !c.get('cod_servico')?.value;
      return true;
    });

    if (this.itens.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione pelo menos um item ao pedido.' });
      return;
    }

    if (itemInvalido !== -1) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: `Item ${itemInvalido + 1}: selecione o produto, corte ou serviço.` });
      return;
    }

    this.isSaving = true;
    const dados = {
      ...this.form.getRawValue(),
      id: this.pedidoId,
      itens: this.itens.getRawValue()
    };

    this.pedidoService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Pedido ${this.pedidoId ? 'atualizado' : 'criado'} com sucesso` });
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: (err) => {
        const erros: string[] = err.error?.erros ?? [];
        const summary = err.error?.message || 'Falha ao salvar pedido';
        this.messageService.add({ severity: 'error', summary, life: 6000 });
        erros.forEach(e =>
          this.messageService.add({ severity: 'warn', summary: 'Estoque insuficiente', detail: e, life: 8000 })
        );
        this.isSaving = false;
      }
    });
  }
}
