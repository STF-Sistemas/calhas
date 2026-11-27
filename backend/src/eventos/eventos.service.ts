import { Injectable, MessageEvent } from '@nestjs/common';
import { filter, interval, map, merge, Observable, Subject } from 'rxjs';
import { IEventoTempoReal } from '#shared/interfaces';

const INTERVALO_SINAL_MS = 25_000;

interface IEventoEmpresa {
  codEmpresa: number;
  evento: IEventoTempoReal;
}

@Injectable()
export class EventosService {
  private readonly canal = new Subject<IEventoEmpresa>();

  emitir(codEmpresa: number, evento: IEventoTempoReal): void {
    this.canal.next({ codEmpresa, evento });
  }

  fluxo(codEmpresa: number | null): Observable<MessageEvent> {
    const sinal = interval(INTERVALO_SINAL_MS).pipe(map((): MessageEvent => ({ type: 'sinal', data: '' })));
    if (!codEmpresa) return sinal;
    const eventos = this.canal.pipe(
      filter((e) => e.codEmpresa === codEmpresa),
      map((e): MessageEvent => ({ type: e.evento.tipo, data: e.evento })),
    );
    return merge(eventos, sinal);
  }
}
