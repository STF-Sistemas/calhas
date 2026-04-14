import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IEmpresa } from '#shared/interfaces';

@Component({
  selector: 'app-relatorio-wrapper',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './relatorio-wrapper.component.html',
  styleUrls: ['./relatorio-wrapper.component.scss'],
  // ViewEncapsulation.None permite que os estilos @media print afetem o DOM global
  encapsulation: ViewEncapsulation.None,
})
export class RelatorioWrapperComponent {
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
    return partes.join(' — ');
  }
}
