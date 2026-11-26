import { Prisma } from '../generated/prisma/client';

/**
 * Pesquisa sem acento (REGRAS-DESENVOLVIMENTO): "Joao" encontra "João".
 * Usa a extensão `unaccent` (migration 2_unaccent) com SQL parametrizado.
 */

const escaparLike = (termo: string) => termo.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Condição: a coluna contém o termo, ignorando acentos e maiúsculas. */
export const contemSemAcento = (coluna: Prisma.Sql, termo: string): Prisma.Sql =>
  Prisma.sql`unaccent(lower(coalesce(${coluna}, ''))) LIKE unaccent(lower(${`%${escaparLike(termo.trim())}%`}))`;

/** Condição: alguma das colunas contém o termo. */
export const algumaContem = (colunas: Prisma.Sql[], termo: string): Prisma.Sql =>
  Prisma.sql`(${Prisma.join(
    colunas.map((c) => contemSemAcento(c, termo)),
    ' OR ',
  )})`;

/** Termo de busca vindo da URL: texto aparado e com tamanho limitado. */
export const termoBusca = (valor: unknown, max = 100): string =>
  typeof valor === 'string' ? valor.trim().slice(0, max) : '';
