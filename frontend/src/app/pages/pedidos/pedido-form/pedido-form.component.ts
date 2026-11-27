import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { CurrencyMaskDirective } from '#shared-frontend/directives/currency-mask.directive';
import { DesenhoMedida } from '../desenho-medida/desenho-medida.component';
import {
  DesenhoLivre,
  IDesenhoLivreResultado,
} from '../desenho-livre/desenho-livre.component';
import { PedidoService } from '#core/services/pedido.service';
import { ClienteService } from '#core/services/cliente.service';
import { ProdutoService } from '#core/services/produto.service';
import { ChapaService } from '#core/services/chapa.service';
import { ServicoService } from '#core/services/servico.service';
import { DesenhoService } from '#core/services/desenho.service';
import { MeioPagamentoService } from '#core/services/meio-pagamento.service';
import {
  ICliente,
  IProduto,
  IChapa,
  IServico,
  IPedidoItem,
  IDesenho,
  IMeioPagamento,
  IDiagonal,
} from '#shared/interfaces';
import { EStatusGeral, EStatusPedido, ETipoItemPedido, EDescontoTipo } from '#shared/enums';
import { EnterFocusNextDirective } from '#shared-frontend/directives/enter-focus-next.directive';
import { ThemeService } from '#core/services/theme.service';
import { TelaService } from '#core/services/tela.service';
import { IPonto } from '#shared/interfaces';
import { calcularValorDesconto, calcularValorLiquido } from '#shared/functions/desconto.functions';
import { ToastService } from '#shared-frontend/services/toast.service';
import { Botao, Dica, Select, CampoData, CampoNumero, SelecaoBotoes, Tabela } from '#ui';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyMaskDirective,
    EnterFocusNextDirective,
    DialogWrapper,
    DesenhoMedida,
    DesenhoLivre,
    Botao,
    Dica,
    Select,
    CampoData,
    CampoNumero,
    SelecaoBotoes,
    Tabela,
  ],
  templateUrl: './pedido-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./pedido-form.component.css'],
})
export class PedidoForm implements OnInit {
  @ViewChild('medidasDialog') medidasDialog!: DesenhoMedida;
  @ViewChild('desenhoLivreDialog') desenhoLivreDialog!: DesenhoLivre;
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  ETipoItemPedido = ETipoItemPedido;
  EStatusPedido = EStatusPedido;
  EDescontoTipo = EDescontoTipo;
  visible = false;
  isLoadingData = false;
  isSaving = false;
  pedidoId?: number;
  linhasItens: AbstractControl[] = [];
  readonly tela = inject(TelaService);
  editorVisivel = false;
  indiceEditado = -1;
  itemNovo = false;
  private copiaItem: Record<string, unknown> | null = null;

  clientes: ICliente[] = [];
  produtos: IProduto[] = [];
  chapas: IChapa[] = [];
  servicos: IServico[] = [];
  desenhos: IDesenho[] = [];
  meiosPagamento: IMeioPagamento[] = [];

  statusOpcoes = [
    { label: 'Aberto', value: EStatusPedido.Aberto },
    { label: 'Em Produção', value: EStatusPedido.EmProducao },
    { label: 'Finalizado', value: EStatusPedido.Concluido },
    { label: 'Cancelado', value: EStatusPedido.Cancelado },
  ];
  tiposItem = [
    { label: 'Produto', value: ETipoItemPedido.Produto },
    { label: 'Corte', value: ETipoItemPedido.Corte },
    { label: 'Serviço Direto', value: ETipoItemPedido.Servico },
  ];
  modoDesenhoOpcoes = [
    { label: 'Biblioteca', value: false, icon: 'ic ic-images' },
    { label: 'Desenhar', value: true, icon: 'ic ic-pencil' },
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
    private readonly toast: ToastService,
    public themeService: ThemeService,
  ) {
    this.form = this.fb.group({
      cod_cliente: [null, [Validators.required]],
      cod_meio_pagamento: [null, [Validators.required]],
      data_pedido: [new Date(), [Validators.required]],
      status: [EStatusPedido.Aberto, [Validators.required]],
      observacoes: [''],
      observacoes_cliente: [''],
      valor_material: [{ value: 0, disabled: true }],
      valor_servico: [{ value: 0, disabled: true }],
      valor_total: [{ value: 0, disabled: true }],
      desconto_tipo: [EDescontoTipo.Reais],
      desconto_valor: [0, [Validators.min(0)]],
      valor_desconto: [{ value: 0, disabled: true }],
      valor_liquido: [{ value: 0, disabled: true }],
      itens: this.fb.array([]),
    });

    this.form.get('desconto_tipo')?.valueChanges.subscribe((tipo) => {
      const ctrl = this.form.get('desconto_valor');
      ctrl?.setValidators(
        tipo === EDescontoTipo.Percentual
          ? [Validators.min(0), Validators.max(100)]
          : [Validators.min(0)],
      );
      ctrl?.updateValueAndValidity({ emitEvent: false });
      this.recalcularTotais();
    });
    this.form.get('desconto_valor')?.valueChanges.subscribe(() => this.recalcularTotais());
    this.itens.valueChanges.subscribe(() => this.sincronizarLinhas());
  }

  private sincronizarLinhas() {
    const atuais = this.itens.controls;
    const iguais =
      atuais.length === this.linhasItens.length && atuais.every((c, i) => c === this.linhasItens[i]);
    if (!iguais) this.linhasItens = [...atuais];
  }

  ngOnInit() {
    this.carregarAuxiliares();
  }

  get itens() {
    return this.form.get('itens') as FormArray;
  }

  carregarAuxiliares() {
    this.clienteService.listar().subscribe((res) => (this.clientes = res.data));
    this.produtoService
      .listar()
      .subscribe(
        (res) => (this.produtos = res.data.filter((p) => p.status === EStatusGeral.Ativo)),
      );
    this.chapaService
      .listar()
      .subscribe(
        (res) =>
          (this.chapas = res.data
            .filter((ch) => ch.status === EStatusGeral.Ativo)
            .map((ch) => ({
              ...ch,
              cortes: (ch.cortes ?? []).filter((c) => c.status === EStatusGeral.Ativo),
            }))),
      );
    this.servicoService
      .listar()
      .subscribe(
        (res) => (this.servicos = res.data.filter((s) => s.status === EStatusGeral.Ativo)),
      );
    this.desenhoService.listar().subscribe((res) => (this.desenhos = res.data));
    this.meioPagamentoService
      .listar()
      .subscribe((res) => (this.meiosPagamento = res.data.filter((m) => m.ativo === 1)));
  }

  abrir(id?: number) {
    this.pedidoId = id;
    this.visible = true;
    this.form.reset({
      data_pedido: new Date(),
      status: EStatusPedido.Aberto,
      cod_meio_pagamento: null,
      desconto_tipo: EDescontoTipo.Reais,
      desconto_valor: 0,
    });
    this.itens.clear();

    if (id) {
      this.isLoadingData = true;
      this.pedidoService.buscarPorId(id).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res.data,
            data_pedido: new Date(res.data.data_pedido),
          });
          res.data.itens?.forEach((item: IPedidoItem) => this.adicionarItem(item));
          this.recalcularTotais();
          this.isLoadingData = false;
        },
      });
    } else if (!this.tela.celular()) {
      this.adicionarItem();
    }
  }

  get itemEditado(): FormGroup | null {
    if (this.indiceEditado < 0 || this.indiceEditado >= this.itens.length) return null;
    return this.itens.at(this.indiceEditado) as FormGroup;
  }

  novoItemCelular() {
    this.adicionarItem();
    this.abrirEditor(this.itens.length - 1, true);
  }

  editarItem(index: number) {
    this.abrirEditor(index, false);
  }

  private abrirEditor(index: number, novo: boolean) {
    this.indiceEditado = index;
    this.itemNovo = novo;
    this.copiaItem = novo ? null : (this.itens.at(index) as FormGroup).getRawValue();
    this.editorVisivel = true;
  }

  escolherTipo(tipo: ETipoItemPedido) {
    const control = this.itemEditado;
    if (!control || control.get('tipo')?.value === tipo) return;
    control.patchValue({ tipo });
    this.onTipoChange(this.indiceEditado);
  }

  alterarQuantidade(delta: number) {
    const ctrl = this.itemEditado?.get('quantidade');
    if (!ctrl) return;
    const atual = Number(ctrl.value) || 0;
    const novo = Math.round((atual + delta) * 100) / 100;
    if (novo < 1) return;
    ctrl.setValue(novo);
  }

  concluirItem(continuar = false) {
    const control = this.itemEditado;
    if (!control) return;
    if (!this.itemCompleto(control)) {
      this.toast.warn(this.rotuloEscolha(control.get('tipo')?.value) + ' antes de concluir.');
      return;
    }
    if (control.get('quantidade')?.invalid) {
      this.toast.warn('Informe uma quantidade maior que zero.');
      return;
    }
    if (continuar) {
      this.adicionarItem();
      this.indiceEditado = this.itens.length - 1;
      this.itemNovo = true;
      this.copiaItem = null;
      return;
    }
    this.fecharEditor();
  }

  cancelarItem() {
    const index = this.indiceEditado;
    if (index >= 0 && index < this.itens.length) {
      if (this.itemNovo) this.itens.removeAt(index);
      else if (this.copiaItem) this.itens.at(index).patchValue(this.copiaItem);
    }
    this.fecharEditor();
    this.recalcularTotais();
  }

  private fecharEditor() {
    this.editorVisivel = false;
    this.indiceEditado = -1;
    this.itemNovo = false;
    this.copiaItem = null;
  }

  itemCompleto(control: AbstractControl): boolean {
    const tipo = control.get('tipo')?.value;
    if (tipo === ETipoItemPedido.Produto) return !!control.get('cod_produto')?.value;
    if (tipo === ETipoItemPedido.Corte) return !!control.get('cod_corte')?.value;
    if (tipo === ETipoItemPedido.Servico) return !!control.get('cod_servico')?.value;
    return false;
  }

  iconeTipo(tipo: ETipoItemPedido): string {
    if (tipo === ETipoItemPedido.Corte) return 'ic ic-ruler';
    if (tipo === ETipoItemPedido.Servico) return 'ic ic-wrench';
    return 'ic ic-box';
  }

  rotuloEscolha(tipo: ETipoItemPedido): string {
    if (tipo === ETipoItemPedido.Corte) return 'Escolha a chapa, o desenho e o corte';
    if (tipo === ETipoItemPedido.Servico) return 'Escolha o serviço';
    return 'Escolha o produto';
  }

  descricaoItem(control: AbstractControl): string {
    const tipo = control.get('tipo')?.value;
    if (tipo === ETipoItemPedido.Produto) {
      return this.produtos.find((p) => p.id === control.get('cod_produto')?.value)?.descricao ?? 'Escolha o produto';
    }
    if (tipo === ETipoItemPedido.Servico) {
      return this.servicos.find((s) => s.id === control.get('cod_servico')?.value)?.descricao ?? 'Escolha o serviço';
    }
    const chapa = this.chapas.find((ch) => ch.id === control.get('cod_chapa')?.value);
    if (!chapa) return 'Escolha a chapa do corte';
    const corte = this.getNomeCorteDetectado(control);
    return corte ? `${chapa.descricao} · ${corte}` : `${chapa.descricao} · escolha o corte`;
  }

  private getChapaIdDoCorteid(corteId: number | null | undefined): number | null {
    if (!corteId) return null;
    return this.chapas.find((ch) => ch.cortes?.some((c) => c.id === corteId))?.id ?? null;
  }

  adicionarItem(data?: Partial<IPedidoItem>) {
    const codChapa = this.getChapaIdDoCorteid(data?.cod_corte);

    const qtd = Number(data?.quantidade) || 1;
    const vUnit = Number(data?.valor_unitario) || 0;
    const custo = Number(data?.custo_unitario) || 0;

    const itemForm = this.fb.group({
      id: [data?.id ?? null],
      tipo: [data?.tipo || ETipoItemPedido.Produto, [Validators.required]],
      cod_produto: [data?.cod_produto ?? null],
      cod_chapa: [codChapa],
      cod_corte: [data?.cod_corte ?? null],
      cod_servico: [data?.cod_servico ?? null],
      cod_desenho: [data?.cod_desenho ?? null],
      medidas: [data?.medidas ?? []],
      desenho_livre: [!data?.cod_desenho && (data?.desenho_pontos?.length ?? 0) >= 2],
      desenho_pontos: [data?.desenho_pontos ?? null],
      desenho_diagonais: [data?.desenho_diagonais ?? null],
      quantidade: [qtd, [Validators.required, Validators.min(0.01)]],
      valor_unitario: [vUnit, [Validators.required, Validators.min(0)]],
      custo_unitario: [custo],
      subtotal: [{ value: qtd * vUnit, disabled: true }],
    });

    itemForm.valueChanges.subscribe(() => {
      this.atualizarSubtotal(itemForm);
      this.recalcularTotais();
    });

    this.itens.push(itemForm);
  }

  removerItem(index: number) {
    this.itens.removeAt(index);
    this.recalcularTotais();
  }

  onTipoChange(index: number) {
    this.itens.at(index).patchValue({
      cod_produto: null,
      cod_chapa: null,
      cod_corte: null,
      cod_servico: null,
      cod_desenho: null,
      medidas: [],
      valor_unitario: 0,
      desenho_livre: false,
      desenho_pontos: null,
      desenho_diagonais: null,
    });
  }

  onChapaChange(index: number) {
    const control = this.itens.at(index);
    if (control.get('desenho_livre')?.value) {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      if ((control.get('desenho_pontos')?.value?.length ?? 0) >= 2)
        this.calcularCorteAutomatico(index);
      return;
    }
    control.patchValue(
      { cod_corte: null, cod_desenho: null, medidas: [], valor_unitario: 0 },
      { emitEvent: false },
    );
  }

  onSelecaoProduto(index: number, event: { value: number }) {
    const produto = this.produtos.find((p) => p.id === event.value);
    this.itens
      .at(index)
      .patchValue({
        valor_unitario: Number(produto?.valor_unitario) || 0,
        custo_unitario: Number(produto?.custo) || 0,
      });
    this.recalcularTotais();
  }

  onSelecaoServico(index: number, event: { value: number }) {
    const servico = this.servicos.find((s) => s.id === event.value);
    this.itens
      .at(index)
      .patchValue({ valor_unitario: Number(servico?.valor) || 0, custo_unitario: 0 });
    this.recalcularTotais();
  }

  onModoDesenhoChange(index: number) {
    this.itens
      .at(index)
      .patchValue(
        {
          cod_desenho: null,
          desenho_pontos: null,
          desenho_diagonais: null,
          medidas: [],
          cod_corte: null,
          valor_unitario: 0,
        },
        { emitEvent: false },
      );
    this.recalcularTotais();
  }

  abrirDesenhoLivre(index: number) {
    const control = this.itens.at(index);
    this.desenhoLivreDialog.abrir(
      index,
      control.get('desenho_pontos')?.value,
      control.get('desenho_diagonais')?.value,
      control.get('medidas')?.value,
    );
  }

  onDesenhoLivreConfirmado(event: IDesenhoLivreResultado) {
    this.itens
      .at(event.index)
      .patchValue(
        {
          desenho_pontos: event.pontos,
          desenho_diagonais: event.diagonais,
          medidas: event.medidas,
          cod_desenho: null,
        },
        { emitEvent: false },
      );
    this.calcularCorteAutomatico(event.index);
  }

  getDesenhoDoItem(control: any): IDesenho | undefined {
    if (control.get('desenho_livre')?.value) {
      const pontos: IPonto[] = control.get('desenho_pontos')?.value ?? [];
      if (pontos.length < 2) return undefined;
      const diagonais: IDiagonal[] = control.get('desenho_diagonais')?.value ?? [];
      return {
        id: 0,
        cod_empresa: 0,
        descricao: 'Desenho livre',
        pontos,
        diagonais,
        status: 1,
        excluido: false,
      };
    }
    const codDesenho = control.get('cod_desenho')?.value;
    return this.desenhos.find((d) => d.id === codDesenho);
  }

  abrirMedidas(index: number) {
    const control = this.itens.at(index);
    const codDesenho = control.get('cod_desenho')?.value;
    const medidas: number[] = control.get('medidas')?.value || [];
    const desenho = this.desenhos.find((d) => d.id === codDesenho);
    if (desenho) {
      this.medidasDialog.abrir(index, desenho, medidas);
    }
  }

  onMedidasConfirmadas(event: { index: number; medidas: number[] }) {
    this.itens.at(event.index).patchValue({ medidas: event.medidas }, { emitEvent: false });
    this.calcularCorteAutomatico(event.index);
  }

  private calcularTotalMedidas(desenho: IDesenho | undefined, medidas: number[]): number {
    if (!desenho) return medidas.reduce((s, m) => s + (Number(m) || 0), 0);
    const baseSeg = Math.max(0, desenho.pontos.length - 1);
    const diagonais: IDiagonal[] = (desenho.diagonais as IDiagonal[]) ?? [];

    const cobertos = new Set<number>();
    diagonais.forEach((d) => {
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
    let minDist = Infinity,
      idx = -1;
    for (let i = 0; i < pontos.length - 1; i++) {
      const dx = pontos[i + 1].x - pontos[i].x,
        dy = pontos[i + 1].y - pontos[i].y;
      const lenSq = dx * dx + dy * dy;
      const t =
        lenSq === 0
          ? 0
          : Math.max(
              0,
              Math.min(1, ((mid.x - pontos[i].x) * dx + (mid.y - pontos[i].y) * dy) / lenSq),
            );
      const dist = Math.hypot(mid.x - (pontos[i].x + t * dx), mid.y - (pontos[i].y + t * dy));
      if (dist < minDist) {
        minDist = dist;
        idx = i;
      }
    }
    return idx;
  }

  private calcularCorteAutomatico(index: number) {
    const control = this.itens.at(index);
    const codChapa = control.get('cod_chapa')?.value;
    const medidas: number[] = control.get('medidas')?.value || [];
    const desenho = this.getDesenhoDoItem(control);

    const totalMedida = this.calcularTotalMedidas(desenho, medidas);

    if (!codChapa || totalMedida === 0) {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      this.recalcularTotais();
      return;
    }

    const chapa = this.chapas.find((ch) => ch.id === codChapa);
    if (!chapa?.cortes?.length) return;

    const candidatos = chapa.cortes
      .filter((c) => Number(c.corte) >= totalMedida)
      .sort((a, b) => Number(a.corte) - Number(b.corte));

    if (candidatos.length > 0) {
      const corte = candidatos[0];
      const valor = Number(corte.valor_venda ?? corte.valor ?? 0);
      control.patchValue(
        { cod_corte: corte.id, valor_unitario: valor, custo_unitario: 0 },
        { emitEvent: false },
      );
      this.atualizarSubtotal(control as FormGroup);
      this.recalcularTotais();
      this.toast.success(`"${corte.descricao}" (${corte.corte}cm) para ${totalMedida}cm de perfil`, 'Corte selecionado');
    } else {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      this.recalcularTotais();
      this.toast.warn(`Nenhum corte ≥ ${totalMedida}cm disponível nesta chapa. Selecione manualmente.`, 'Corte não encontrado');
    }
  }

  getMedidasLabel(control: any): string {
    const desenho = this.getDesenhoDoItem(control);
    if (!desenho) return control.get('desenho_livre')?.value ? 'Desenhar' : 'Informar Medidas';
    const medidas: number[] = control.get('medidas')?.value || [];
    const preenchidas = medidas.filter((m: number) => m > 0).length;
    if (preenchidas === 0) return 'Informar Medidas';
    const total = this.calcularTotalMedidas(desenho, medidas);
    const segCount = Math.max(0, desenho.pontos.length - 1) + (desenho.diagonais?.length ?? 0) * 2;
    return `Medidas (${preenchidas}/${segCount}) , total: ${total}cm`;
  }

  getCortesDeChapa(codChapa: number) {
    return this.chapas.find((ch) => ch.id === codChapa)?.cortes || [];
  }

  onCorteManualChange(index: number, event: { value: number }) {
    const control = this.itens.at(index);
    const codChapa = control.get('cod_chapa')?.value;
    const corte = this.chapas
      .find((ch) => ch.id === codChapa)
      ?.cortes?.find((c) => c.id === event.value);
    if (corte) {
      control.patchValue(
        { valor_unitario: Number(corte.valor_venda ?? corte.valor ?? 0), custo_unitario: 0 },
        { emitEvent: false },
      );
      this.atualizarSubtotal(control as FormGroup);
      this.recalcularTotais();
    }
  }

  getNomeCorteDetectado(control: any): string {
    const codCorte = control.get('cod_corte')?.value;
    if (!codCorte) return '';
    for (const ch of this.chapas) {
      const c = ch.cortes?.find((ct) => ct.id === codCorte);
      if (c) return `${c.descricao}, ${c.corte}cm`;
    }
    return '';
  }

  getDesenhoPoints(pontos: IPonto[], w = 64, h = 30): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map((p) => p.x),
      ys = pontos.map((p) => p.y);
    const minX = Math.min(...xs),
      rangeX = Math.max(...xs) - minX || 1;
    const minY = Math.min(...ys),
      rangeY = Math.max(...ys) - minY || 1;
    const pad = 3;
    return pontos
      .map(
        (p) =>
          `${pad + ((p.x - minX) / rangeX) * (w - pad * 2)},${pad + ((p.y - minY) / rangeY) * (h - pad * 2)}`,
      )
      .join(' ');
  }

  getDesenhoDiagonalPoints(diagonal: IDiagonal, pontos: IPonto[], w = 64, h = 30): string {
    if (!pontos || pontos.length < 2) return '';
    const xs = pontos.map((p) => p.x),
      ys = pontos.map((p) => p.y);
    const minX = Math.min(...xs),
      rangeX = Math.max(...xs) - minX || 1;
    const minY = Math.min(...ys),
      rangeY = Math.max(...ys) - minY || 1;
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

    this.form.patchValue(
      {
        valor_material: material,
        valor_servico: servicoCalculado,
        valor_total: total,
        valor_desconto: valorDesconto,
        valor_liquido: valorLiquido,
      },
      { emitEvent: false },
    );
  }

  onSave() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const itemInvalido = this.itens.controls.findIndex((c) => !this.itemCompleto(c));

    if (this.itens.length === 0) {
      this.toast.warn('Adicione pelo menos um item ao pedido.');
      return;
    }

    if (itemInvalido !== -1) {
      this.toast.warn(`Item ${itemInvalido + 1}: selecione o produto, corte ou serviço.`);
      return;
    }

    this.isSaving = true;
    const dados = {
      ...this.form.getRawValue(),
      id: this.pedidoId,
      itens: this.itens.getRawValue().map((item: any) => {
        const { desenho_livre, ...resto } = item;
        return desenho_livre
          ? { ...resto, cod_desenho: null }
          : { ...resto, desenho_pontos: null, desenho_diagonais: null };
      }),
    };

    this.pedidoService.salvar(dados).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Pedido ${this.pedidoId ? 'atualizado' : 'criado'} com sucesso`);
          this.saved.emit();
          this.visible = false;
        }
        this.isSaving = false;
      },
      error: (err) => {
        const erros: string[] = err.error?.erros ?? [];
        const summary = err.error?.message || 'Falha ao salvar pedido';
        this.toast.error(summary);
        erros.forEach((e) =>
          this.toast.warn(e, 'Estoque insuficiente'),
        );
        this.isSaving = false;
      },
    });
  }
}
