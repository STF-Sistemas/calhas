import { Component, Input, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IEmpresa } from '#shared/interfaces';
import { Botao, Spinner } from '#ui';

@Component({
  selector: 'app-relatorio-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    Botao,
    Spinner,
  ],
  templateUrl: './relatorio-wrapper.component.html',
  styleUrls: ['./relatorio-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class RelatorioWrapper {
  @Input() titulo = '';
  @Input() empresa: IEmpresa | null = null;
  @Input() isLoading = false;

  readonly hoje = new Date();

  imprimir() {
    window.print();
  }

  get enderecoEmpresa(): string {
    if (!this.empresa) return '';
    const partes: string[] = [];
    if (this.empresa.endereco) {
      partes.push(this.empresa.endereco + (this.empresa.numero ? ', ' + this.empresa.numero : ''));
    }
    if (this.empresa.bairro) partes.push(this.empresa.bairro);
    return partes.join(', ');
  }
}
