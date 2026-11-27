"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.termoBusca = exports.algumaContem = exports.contemSemAcento = void 0;
const client_1 = require("../generated/prisma/client");
const escaparLike = (termo) => termo.replace(/[\\%_]/g, (c) => `\\${c}`);
const contemSemAcento = (coluna, termo) => client_1.Prisma.sql `unaccent(lower(coalesce(${coluna}, ''))) LIKE unaccent(lower(${`%${escaparLike(termo.trim())}%`}))`;
exports.contemSemAcento = contemSemAcento;
const algumaContem = (colunas, termo) => client_1.Prisma.sql `(${client_1.Prisma.join(colunas.map((c) => (0, exports.contemSemAcento)(c, termo)), ' OR ')})`;
exports.algumaContem = algumaContem;
const termoBusca = (valor, max = 100) => typeof valor === 'string' ? valor.trim().slice(0, max) : '';
exports.termoBusca = termoBusca;
//# sourceMappingURL=busca-sem-acento.js.map