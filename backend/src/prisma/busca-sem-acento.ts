import { Prisma } from '../generated/prisma/client';

const escaparLike = (termo: string) => termo.replace(/[\\%_]/g, (c) => `\\${c}`);

export const contemSemAcento = (coluna: Prisma.Sql, termo: string): Prisma.Sql =>
  Prisma.sql`unaccent(lower(coalesce(${coluna}, ''))) LIKE unaccent(lower(${`%${escaparLike(termo.trim())}%`}))`;

export const algumaContem = (colunas: Prisma.Sql[], termo: string): Prisma.Sql =>
  Prisma.sql`(${Prisma.join(
    colunas.map((c) => contemSemAcento(c, termo)),
    ' OR ',
  )})`;

export const termoBusca = (valor: unknown, max = 100): string =>
  typeof valor === 'string' ? valor.trim().slice(0, max) : '';
