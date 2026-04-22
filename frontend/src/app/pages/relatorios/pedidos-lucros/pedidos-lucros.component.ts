import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { RelatorioWrapperComponent } from 'src/app/shared/components/relatorio-wrapper/relatorio-wrapper.component';
import { RelatorioService } from 'src/app/core/services/relatorio.service';
import { ClienteService } from 'src/app/core/services/cliente.service';
import { ProdutoService } from 'src/app/core/services/produto.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { EmpresaService } from 'src/app/core/services/empresa.service';
import { IRelatorioPedidosLucros, IEmpresa } from '#shared/interfaces';

@Component({
  selector: 'app-pedidos-lucros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    TooltipModule,
    MessageModule,
    PanelModule,
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

  clienteOptions: { label: string; value: number }[] = [];
  produtoOptions: { label: string; value: number }[] = [];

  constructor(
    private fb: FormBuilder,
    private relatorioService: RelatorioService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private empresaService: EmpresaService,
  ) {
    this.form = this.fb.group({
      data_inicio: [null, Validators.required],
      data_fim: [null, Validators.required],
      cod_cliente: [null],
      cod_produto: [null],
    });
  }

  ngOnInit() {
    const codEmpresa = this.authService.currentUser()?.cod_empresa;
    if (codEmpresa) {
      this.empresaService.buscarPorId(codEmpresa).subscribe({
        next: res => { if (res.success) this.empresa = res.data; },
      });
    }

    this.clienteService.listar({ limite: 1000 }).subscribe({
      next: res => {
        this.clienteOptions = res.data.map(c => ({ label: c.razao_social, value: c.id }));
      },
    });

    this.produtoService.listar().subscribe({
      next: res => {
        this.produtoOptions = (res.data as any[]).map(p => ({ label: p.descricao, value: p.id }));
      },
    });
  }

  gerar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.erro = 'Informe a Data Início e a Data Fim para gerar o relatório.';
      return;
    }
    this.erro = '';
    this.relatorio = null;
    this.isLoading = true;

    const { data_inicio, data_fim, cod_cliente, cod_produto } = this.form.value;

    this.relatorioService.pedidosLucros({
      data_inicio: data_inicio ? this.toISODate(data_inicio) : undefined,
      data_fim:    data_fim    ? this.toISODate(data_fim)    : undefined,
      cod_cliente: cod_cliente ?? undefined,
      cod_produto: cod_produto ?? undefined,
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
    this.form.markAsUntouched();
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
