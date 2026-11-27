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
    const area = document.getElementById('relatorio-print-area');
    if (!area) return;

    const iframe = document.createElement('iframe');
    iframe.className = 'relatorio-iframe-impressao';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    const janela = iframe.contentWindow;
    if (!doc || !janela) {
      iframe.remove();
      return;
    }

    const classesTema = Array.from(document.documentElement.classList).filter((c) => c !== 'app-dark');
    doc.open();
    doc.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head><body></body></html>');
    doc.close();
    doc.documentElement.className = classesTema.join(' ');
    doc.title = this.titulo;
    const base = doc.createElement('base');
    base.href = document.baseURI;
    doc.head.appendChild(base);
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => doc.head.appendChild(el.cloneNode(true)));
    doc.body.className = 'relatorio-impressao';
    doc.body.appendChild(doc.importNode(area, true));

    const remover = () => setTimeout(() => iframe.remove(), 500);
    janela.addEventListener('afterprint', remover, { once: true });
    setTimeout(() => iframe.isConnected && iframe.remove(), 120_000);

    const carregamentos = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
      (link) =>
        new Promise<void>((ok) => {
          if (link.sheet) return ok();
          link.addEventListener('load', () => ok(), { once: true });
          link.addEventListener('error', () => ok(), { once: true });
          setTimeout(ok, 3000);
        }),
    );
    Promise.all(carregamentos).then(() =>
      setTimeout(() => {
        janela.focus();
        janela.print();
      }, 150),
    );
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
