export type TSeveridade = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';

export interface IMenuItem {
  label?: string;
  icon?: string;
  style?: Record<string, string>;
  command?: () => void;
  separator?: boolean;
  perigo?: boolean;
  disabled?: boolean;
}

export interface IPaginaEvento {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}

export interface IMudancaValor<T = any> {
  value: T;
  originalEvent?: Event;
}
