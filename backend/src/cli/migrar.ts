import '../carregar-env';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Client } from 'pg';

const ADVISORY_LOCK = 72707369;
const BASELINE = '0_init';
const TABELA_EXISTENTE = 'calhas.pedidos';

function pastaMigrations(): string {
  const candidatas = [
    resolve(process.cwd(), 'prisma', 'migrations'),
    resolve(__dirname, '..', '..', 'prisma', 'migrations'),
  ];
  const pasta = candidatas.find((p) => existsSync(p));
  if (!pasta) throw new Error(`Pasta de migrations não encontrada em: ${candidatas.join(', ')}`);
  return pasta;
}

const log = (mensagem: string) => console.log(`[migrar] ${mensagem}`);

async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL ausente.');

  const pasta = pastaMigrations();
  const migrations = readdirSync(pasta, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(pasta, d.name, 'migration.sql')))
    .map((d) => d.name)
    .sort();

  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    await cliente.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK]);

    const { rows: tabela } = await cliente.query(`SELECT to_regclass('public._prisma_migrations') AS t`);
    const tabelaNova = !tabela[0].t;
    if (tabelaNova) {
      await cliente.query(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
          "checksum"            VARCHAR(64) NOT NULL,
          "finished_at"         TIMESTAMPTZ,
          "migration_name"      VARCHAR(255) NOT NULL,
          "logs"                TEXT,
          "rolled_back_at"      TIMESTAMPTZ,
          "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        )`);
    }

    const { rows: registradas } = await cliente.query<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>('SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"');

    const falhou = registradas.find((m) => !m.finished_at && !m.rolled_back_at);
    if (falhou) {
      throw new Error(
        `A migration ${falhou.migration_name} falhou antes e bloqueia as próximas. ` +
          'Corrija o banco e marque com "prisma migrate resolve".',
      );
    }
    const aplicadas = new Set(registradas.filter((m) => m.finished_at).map((m) => m.migration_name));

    if (tabelaNova && migrations.includes(BASELINE)) {
      const { rows } = await cliente.query(`SELECT to_regclass($1) AS t`, [TABELA_EXISTENTE]);
      if (rows[0].t) {
        await registrar(cliente, pasta, BASELINE, true);
        aplicadas.add(BASELINE);
        log(`Banco existente detectado: ${BASELINE} registrada como aplicada (baseline).`);
      }
    }

    let novas = 0;
    for (const nome of migrations) {
      if (aplicadas.has(nome)) continue;
      const sql = readFileSync(join(pasta, nome, 'migration.sql'), 'utf8');
      const id = randomUUID();
      await cliente.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count)
         VALUES ($1, $2, $3, now(), 0)`,
        [id, checksum(pasta, nome), nome],
      );
      log(`Aplicando ${nome}...`);
      try {
        await cliente.query('BEGIN');
        await cliente.query(sql);
        await cliente.query('COMMIT');
      } catch (erro) {
        await cliente.query('ROLLBACK').catch(() => undefined);
        await cliente.query('UPDATE "_prisma_migrations" SET logs = $2 WHERE id = $1', [
          id,
          String((erro as Error).message),
        ]);
        throw erro;
      }
      await cliente.query(
        'UPDATE "_prisma_migrations" SET finished_at = now(), applied_steps_count = 1 WHERE id = $1',
        [id],
      );
      novas++;
    }
    log(novas ? `${novas} migration(s) aplicada(s).` : 'Banco já está atualizado.');
  } finally {
    await cliente.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK]).catch(() => undefined);
    await cliente.end();
  }
}

function checksum(pasta: string, nome: string): string {
  return createHash('sha256').update(readFileSync(join(pasta, nome, 'migration.sql'))).digest('hex');
}

async function registrar(cliente: Client, pasta: string, nome: string, aplicada: boolean): Promise<void> {
  await cliente.query(
    `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
     VALUES ($1, $2, $3, now(), ${aplicada ? 'now()' : 'NULL'}, ${aplicada ? 1 : 0})`,
    [randomUUID(), checksum(pasta, nome), nome],
  );
}

main().catch((erro) => {
  console.error(`[migrar] Falhou: ${(erro as Error).message}`);
  process.exit(1);
});
