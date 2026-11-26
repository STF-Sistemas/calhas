import { Injectable, signal } from '@angular/core';

export type TToastTipo = 'success' | 'error' | 'info' | 'warn';

export interface IToast {
  id: number;
  tipo: TToastTipo;
  titulo?: string;
  texto: string;
}

const DURACAO_MS: Record<TToastTipo, number> = { success: 3500, info: 4000, warn: 5500, error: 6500 };
const MAXIMO = 4;

/**
 * Mensagens de resultado de ação (salvou, excluiu, falhou). Montado uma vez no app.html.
 * Erro de campo de formulário continua inline, perto do campo.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximoId = 1;
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();
  readonly toasts = signal<IToast[]>([]);

  success(texto: string, titulo?: string): void {
    this.mostrar('success', texto, titulo);
  }

  error(texto: string, titulo?: string): void {
    this.mostrar('error', texto, titulo);
  }

  info(texto: string, titulo?: string): void {
    this.mostrar('info', texto, titulo);
  }

  warn(texto: string, titulo?: string): void {
    this.mostrar('warn', texto, titulo);
  }

  fechar(id: number): void {
    clearTimeout(this.temporizadores.get(id));
    this.temporizadores.delete(id);
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: TToastTipo, texto: string, titulo?: string): void {
    const id = this.proximoId++;
    this.toasts.update((lista) => [...lista, { id, tipo, titulo, texto }].slice(-MAXIMO));
    if (typeof window !== 'undefined') {
      this.temporizadores.set(id, setTimeout(() => this.fechar(id), DURACAO_MS[tipo]));
    }
  }
}
