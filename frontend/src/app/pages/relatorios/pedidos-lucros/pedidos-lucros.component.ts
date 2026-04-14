import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { RelatorioWrapperComponent } from 'src/app/shared/components/relatorio-wrapper/relatorio-wrapper.component';
import { RelatorioService } from 'src/app/core/services/relatorio.service';
import { ClienteService } from 'src/app/core/services/cliente.service';
import { ProdutoService } from 'src/app/core/services/produto.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { EmpresaService } from 'src/app/core/services/empresa.service';
import { IRelatorioPedidosLucros, IEmpresa, ICliente, IProduto } from '#shared/interfaces';

@Component({
  selector: 'app-pedidos-lucros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    AutoCompleteModule,
    TableModule,
    TooltipModule,
    MessageModule,
    RelatorioWrapperComponent,
  ],
  templateUrl: './pedidos-lucros.component.html',
  styleUrls: ['./pedidos-lucros.component.scss'],
})
export class PedidosLucrosComponent implements OnInit {
  form: FormGroup;
  empresa: IEmpresa | null = null;
  relatorio: IRelatorioPedidosLucros | null = null;
  isLoading = false;
  erro = '';

  // Autocomplete clientes
  clientesSugestoes: ICliente[] = [];
  clienteSelecionado: ICliente | null = null;

  // Autocomplete produtos
  produtosSugestoes: IProduto[] = [];
  produtoSelecionado: IProduto | null = null;

  constructor(
    private fb: FormBuilder,
    private relatorioService: RelatorioService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private empresaService: EmpresaService,
  ) {
    this.form = this.fb.group({
      data_inicio: [null],
      data_fim: [null],
      cliente: [null],
      produto: [null],
    });
  }

  ngOnInit() {
    const codEmpresa = this.authService.currentUser()?.cod_empresa;
    if (codEmpresa) {
      this.empresaService.buscarPorId(codEmpresa).subscribe({
        next: res => { if (res.success) this.empresa = res.data; },
      });
    }
  }

  buscarClientes(evento: { query: string }) {
    this.clienteService.listar().subscribe({
      next: res => {
        if (res.success) {
          const q = evento.query.toLowerCase();
          this.clientesSugestoes = res.data.filter(c =>
            c.razao_social.toLowerCase().includes(q) ||
            (c.nome_fantasia?.toLowerCase().includes(q) ?? false)
          );
        }
      },
    });
  }

  buscarProdutos(evento: { query: string }) {
    this.produtoService.listar().subscribe({
      next: res => {
        if (res.success) {
          const q = evento.query.toLowerCase();
          this.produtosSugestoes = (res.data as IProduto[]).filter(p =>
            p.descricao.toLowerCase().includes(q)
          );
        }
      },
    });
  }

  onClienteSelecionado(cliente: ICliente) {
    this.clienteSelecionado = cliente;
  }

  onClienteLimpo() {
    this.clienteSelecionado = null;
  }

  onProdutoSelecionado(produto: IProduto) {
    this.produtoSelecionado = produto;
  }

  onProdutoLimpo() {
    this.produtoSelecionado = null;
  }

  gerar() {
    this.erro = '';
    this.relatorio = null;
    this.isLoading = true;

    const { data_inicio, data_fim } = this.form.value;

    this.relatorioService.pedidosLucros({
      data_inicio: data_inicio ? this.toISODate(data_inicio) : undefined,
      data_fim:    data_fim    ? this.toISODate(data_fim)    : undefined,
      cod_cliente: this.clienteSelecionado?.id,
      cod_produto: this.produtoSelecionado?.id,
    }).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.success) this.relatorio = res.data;
        else this.erro = 'Não foi possível gerar o relatório.';
      },
      error: () => {
        this.isLoading = false;
        this.erro = 'Erro ao conectar ao servidor.';
      },
    });
  }

  limpar() {
    this.form.reset();
    this.clienteSelecionado = null;
    this.produtoSelecionado = null;
    this.relatorio = null;
    this.erro = '';
  }

  margem(lucro: number, valorTotal: number): number {
    if (!valorTotal) return 0;
    return (lucro / valorTotal) * 100;
  }

  private toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
