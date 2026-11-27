"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarPrismaClient = criarPrismaClient;
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
function criarPrismaClient() {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString)
        throw new Error('DATABASE_URL ausente.');
    return new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg({ connectionString, max: 5 }),
        log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
    });
}
//# sourceMappingURL=criar-prisma-client.js.map