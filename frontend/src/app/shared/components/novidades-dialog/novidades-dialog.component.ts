import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogWrapperComponent } from '#shared-frontend/components/dialog-wrapper/dialog-wrapper.component';
import { NOVIDADES, VERSAO_ATUAL } from '#shared/constants';
import { INovidade } from '#shared/interfaces';

/** Chave do localStorage com a última versão cujas novidades o usuário já viu. */
const CHAVE_VERSAO_VISTA = 'calhas.novidades.versaoVista';

/**
 * Tela "Novidades do Calhas Pro": abre sozinha quando o sistema foi atualizado
 * desde a última vez que o usuário viu, e pode ser reaberta pelo topo.
 */
@Component({
  selector: 'app-novidades-dialog',
  standalone: true,
  imports: [ButtonModule, DialogWrapperComponent],
  templateUrl: './novidades-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./novidades-dialog.component.css'],
})
export class NovidadesDialogComponent implements OnInit {
  readonly novidades: INovidade[] = NOVIDADES;
  readonly versaoAtual = VERSAO_ATUAL;

  visible = false;
  /** Há novidades que o usuário ainda não viu (para o indicador no topo). */
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
      // localStorage indisponível (modo privado): apenas não persiste.
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
