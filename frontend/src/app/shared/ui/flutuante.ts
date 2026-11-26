export interface IOpcoesFlutuante {
  larguraDaAncora?: boolean;
  alinhar?: 'inicio' | 'fim';
  aoFechar?: () => void;
}

const MARGEM = 8;

export function ancoraDo(evento: Event): HTMLElement {
  return (evento.currentTarget ?? evento.target) as HTMLElement;
}

export class Flutuante {
  private ancora: HTMLElement | null = null;
  private readonly reposicionar = () => this.posicionar();
  private readonly cliqueFora = (evento: PointerEvent) => {
    const alvo = evento.target as Node;
    if (this.painel.contains(alvo) || this.ancora?.contains(alvo)) return;
    this.fechar();
  };
  private readonly tecla = (evento: KeyboardEvent) => {
    if (evento.key !== 'Escape') return;
    evento.stopPropagation();
    evento.preventDefault();
    const ancora = this.ancora;
    this.fechar();
    ancora?.focus();
  };

  constructor(
    private readonly painel: HTMLElement,
    private readonly opcoes: IOpcoesFlutuante = {},
  ) {}

  get aberto(): boolean {
    return this.ancora !== null;
  }

  abrir(ancora: HTMLElement): void {
    if (this.aberto) this.desligar();
    this.ancora = ancora;
    this.painel.showPopover();
    this.posicionar();
    document.addEventListener('pointerdown', this.cliqueFora, true);
    document.addEventListener('keydown', this.tecla, true);
    window.addEventListener('scroll', this.reposicionar, true);
    window.addEventListener('resize', this.reposicionar);
  }

  alternar(ancora: HTMLElement): void {
    if (this.aberto && this.ancora === ancora) this.fechar();
    else this.abrir(ancora);
  }

  fechar(): void {
    if (!this.aberto) return;
    this.desligar();
    this.opcoes.aoFechar?.();
  }

  posicionar(): void {
    if (!this.ancora) return;
    const r = this.ancora.getBoundingClientRect();
    const estilo = this.painel.style;
    if (this.opcoes.larguraDaAncora) estilo.minWidth = `${r.width}px`;
    estilo.maxHeight = '';
    const p = this.painel.getBoundingClientRect();
    const abaixo = window.innerHeight - r.bottom - MARGEM * 2;
    const acima = r.top - MARGEM * 2;
    const paraCima = p.height > abaixo && acima > abaixo;
    const espaco = Math.max(paraCima ? acima : abaixo, 120);
    const altura = Math.min(p.height, espaco);
    if (p.height > espaco) estilo.maxHeight = `${espaco}px`;
    const topo = paraCima ? r.top - 4 - altura : r.bottom + 4;
    let esquerda = this.opcoes.alinhar === 'fim' ? r.right - p.width : r.left;
    esquerda = Math.max(MARGEM, Math.min(esquerda, window.innerWidth - p.width - MARGEM));
    estilo.top = `${Math.max(MARGEM, topo)}px`;
    estilo.left = `${esquerda}px`;
  }

  private desligar(): void {
    document.removeEventListener('pointerdown', this.cliqueFora, true);
    document.removeEventListener('keydown', this.tecla, true);
    window.removeEventListener('scroll', this.reposicionar, true);
    window.removeEventListener('resize', this.reposicionar);
    this.ancora = null;
    if (this.painel.matches(':popover-open')) this.painel.hidePopover();
  }
}
