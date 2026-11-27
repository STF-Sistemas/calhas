import { Injectable, MessageEvent } from '@nestjs/common';
import { filter, from, interval, map, merge, Observable, share, Subject, switchMap, takeUntil } from 'rxjs';
import { EStatusGeral } from '#shared/enums';
import { IEventoTempoReal } from '#shared/interfaces';
import { JwtPayload } from '../common/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';

const INTERVALO_SINAL_MS = 25_000;

interface IEventoEmpresa {
  codEmpresa: number;
  evento: IEventoTempoReal;
}

@Injectable()
export class EventosService {
  private readonly canal = new Subject<IEventoEmpresa>();

  constructor(private readonly prisma: PrismaService) {}

  emitir(codEmpresa: number, evento: IEventoTempoReal): void {
    this.canal.next({ codEmpresa, evento });
  }

  fluxo(usuario: JwtPayload): Observable<MessageEvent> {
    const verificacao = interval(INTERVALO_SINAL_MS).pipe(
      switchMap(() => from(this.sessaoValida(usuario))),
      share(),
    );
    const sinal = verificacao.pipe(
      filter((valida) => valida),
      map((): MessageEvent => ({ type: 'sinal', data: '' })),
    );
    const encerrada = verificacao.pipe(filter((valida) => !valida));
    const codEmpresa = usuario.cod_empresa;
    const eventos = codEmpresa
      ? this.canal.pipe(
          filter((e) => e.codEmpresa === codEmpresa),
          map((e): MessageEvent => ({ type: e.evento.tipo, data: e.evento })),
        )
      : [];
    return merge(eventos, sinal).pipe(takeUntil(encerrada));
  }

  private async sessaoValida(usuario: JwtPayload): Promise<boolean> {
    const atual = await this.prisma.usuario.findFirst({
      where: { id: usuario.id, excluido: false },
      select: { status: true, token_versao: true, cod_empresa: true },
    });
    return (
      !!atual &&
      atual.status === EStatusGeral.Ativo &&
      atual.token_versao === (usuario.tv ?? 0) &&
      atual.cod_empresa === usuario.cod_empresa
    );
  }
}
