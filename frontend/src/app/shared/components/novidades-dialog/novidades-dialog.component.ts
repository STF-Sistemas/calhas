import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DialogWrapper } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { NOVIDADES, VERSAO_ATUAL } from '#shared/constants';
import { INovidade } from '#shared/interfaces';
import { Botao } from '#ui';

const CHAVE_VERSAO_VISTA = 'calhas.novidades.versaoVista';

@Component({
  selector: 'app-novidades-dialog',
  standalone: true,
  imports: [
    DialogWrapper,
    Botao,
  ],
  templateUrl: './novidades-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./novidades-dialog.component.css'],
})
export class NovidadesDialog implements OnInit {
  readonly novidades: INovidade[] = NOVIDADES;
  readonly versaoAtual = VERSAO_ATUAL;

  visible = false;
  readonly temNaoVistas = signal(false);

  ngOnInit() {
    const naoVistas = this.lerVersaoVista() !== this.versaoAtual;
    this.temNaoVistas.set(naoVistas);
    if (naoVistas) this.visible = true;
  }

  abrir() {
    this.visible = true;
  }

  onVisibleChange(v: boolean) {
    this.visible = v;
    if (!v) this.marcarComoVista();
  }

  entendi() {
    this.visible = false;
    this.marcarComoVista();
  }

  private marcarComoVista() {
    this.temNaoVistas.set(false);
    try {
      localStorage.setItem(CHAVE_VERSAO_VISTA, this.versaoAtual);
    } catch {
    }
  }

  private lerVersaoVista(): string | null {
    try {
      return localStorage.getItem(CHAVE_VERSAO_VISTA);
    } catch {
      return this.versaoAtual;
    }
  }
}
