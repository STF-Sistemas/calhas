import { Injectable, signal } from '@angular/core';

export interface IConfirmOpcoes {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface IConfirmAberto extends Required<Omit<IConfirmOpcoes, 'danger'>> {
  danger: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly aberto = signal<IConfirmAberto | null>(null);
  private resolver?: (resposta: boolean) => void;

  confirm(opcoes: IConfirmOpcoes): Promise<boolean> {
    this.resolver?.(false);
    this.aberto.set({
      title: opcoes.title ?? 'Confirmar',
      message: opcoes.message,
      confirmText: opcoes.confirmText ?? 'Confirmar',
      cancelText: opcoes.cancelText ?? 'Cancelar',
      danger: opcoes.danger ?? false,
    });
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  responder(resposta: boolean): void {
    const resolver = this.resolver;
    this.resolver = undefined;
    this.aberto.set(null);
    resolver?.(resposta);
  }
}
