import { Component, EventEmitter, Output, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
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
import { ICliente, IProduto, IChapa, IServico, IPedidoItem, IDesenho, IMeioPagamento } from '#shared/interfaces';
import { EStatusPedido, ETipoItemPedido } from '#shared/enums';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    TableModule,
    DatePickerModule,
    TooltipModule,
    CurrencyMaskDirective,
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

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private chapaService: ChapaService,
    private servicoService: ServicoService,
    private desenhoService: DesenhoService,
    private meioPagamentoService: MeioPagamentoService,
    private messageService: MessageService
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
      itens: this.fb.array([])
    });
  }

  ngOnInit() {
    this.carregarAuxiliares();
  }

  get itens() {
    return this.form.get('itens') as FormArray;
  }

  carregarAuxiliares() {
    this.clienteService.listar().subscribe(res => this.clientes = res.data);
    this.produtoService.listar().subscribe(res => this.produtos = res.data);
    this.chapaService.listar().subscribe(res => this.chapas = res.data);
    this.servicoService.listar().subscribe(res => this.servicos = res.data);
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

    const itemForm = this.fb.group({
      id: [data?.id],
      tipo: [data?.tipo || ETipoItemPedido.Produto, [Validators.required]],
      cod_produto: [data?.cod_produto],
      // cod_chapa é apenas UI — não é salvo no backend diretamente
      cod_chapa: [codChapa],
      cod_corte: [data?.cod_corte ?? null],
      cod_servico: [data?.cod_servico],
      cod_desenho: [data?.cod_desenho ?? null],
      medidas: [data?.medidas ?? []],
      quantidade: [data?.quantidade || 1, [Validators.required, Validators.min(0.01)]],
      valor_unitario: [data?.valor_unitario || 0, [Validators.required, Validators.min(0)]],
      subtotal: [{ value: (data?.quantidade || 1) * (data?.valor_unitario || 0), disabled: true }]
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
    const valor = this.produtos.find(p => p.id === event.value)?.valor_unitario || 0;
    this.itens.at(index).patchValue({ valor_unitario: valor });
    this.recalcularTotais();
  }

  onSelecaoServico(index: number, event: { value: number }) {
    const valor = this.servicos.find(s => s.id === event.value)?.valor || 0;
    this.itens.at(index).patchValue({ valor_unitario: valor });
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

  private calcularCorteAutomatico(index: number) {
    const control = this.itens.at(index);
    const codChapa = control.get('cod_chapa')?.value;
    const medidas: number[] = control.get('medidas')?.value || [];

    const totalMedida = medidas.reduce((sum, m) => sum + (Number(m) || 0), 0);

    if (!codChapa || totalMedida === 0) {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      this.recalcularTotais();
      return;
    }

    const chapa = this.chapas.find(ch => ch.id === codChapa);
    if (!chapa?.cortes?.length) return;

    // Ordena por diferença absoluta e filtra dentro de ±1cm
    const candidatos = chapa.cortes
      .filter(c => Math.abs(Number(c.corte) - totalMedida) <= 1)
      .sort((a, b) => Math.abs(Number(a.corte) - totalMedida) - Math.abs(Number(b.corte) - totalMedida));

    if (candidatos.length > 0) {
      const corte = candidatos[0];
      const valor = Number(corte.valor_venda ?? corte.valor ?? 0);
      control.patchValue({ cod_corte: corte.id, quantidade: totalMedida, valor_unitario: valor }, { emitEvent: false });
      this.atualizarSubtotal(control as FormGroup);
      this.recalcularTotais();
      this.messageService.add({
        severity: 'success',
        summary: 'Corte detectado',
        detail: `"${corte.descricao}" (${corte.corte}cm) selecionado automaticamente`
      });
    } else {
      control.patchValue({ cod_corte: null, valor_unitario: 0 }, { emitEvent: false });
      this.recalcularTotais();
      this.messageService.add({
        severity: 'warn',
        summary: 'Corte não encontrado',
        detail: `Total de ${totalMedida}cm não corresponde a nenhum corte desta chapa (tolerância ±1cm)`
      });
    }
  }

  getMedidasLabel(control: any): string {
    const codDesenho = control.get('cod_desenho')?.value;
    const desenho = this.desenhos.find(d => d.id === codDesenho);
    if (!desenho) return 'Informar Medidas';
    const medidas: number[] = control.get('medidas')?.value || [];
    const segCount = Math.max(0, desenho.pontos.length - 1);
    const preenchidas = medidas.filter((m: number) => m > 0).length;
    const total = medidas.reduce((s, m) => s + (Number(m) || 0), 0);
    if (preenchidas === 0) return 'Informar Medidas';
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
      const totalMedida = medidas.reduce((sum, m) => sum + (Number(m) || 0), 0);
      control.patchValue(
        { quantidade: totalMedida || 1, valor_unitario: Number(corte.valor_venda ?? corte.valor ?? 0) },
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

  atualizarSubtotal(item: FormGroup) {
    const qtd = item.get('quantidade')?.value || 0;
    const val = item.get('valor_unitario')?.value || 0;
    item.get('subtotal')?.setValue(qtd * val, { emitEvent: false });
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
    this.form.patchValue({
      valor_material: material,
      valor_servico: servicoCalculado,
      valor_total: (material + servicoCalculado + servicosDiretos)
    }, { emitEvent: false });
  }

  onSave() {
    if (this.form.invalid) return;

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
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar pedido' });
        this.isSaving = false;
      }
    });
  }
}
