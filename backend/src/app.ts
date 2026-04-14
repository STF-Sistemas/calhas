import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import authRoutes from './modules/auth/auth.routes';
import cepRoutes from './modules/cep/cep.routes';
import cidadesRoutes from './modules/cidades/cidades.routes';
import empresasRoutes from './modules/empresas/empresas.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import clientesRoutes from './modules/clientes/clientes.routes';
import produtosRoutes from './modules/produtos/produtos.routes';
import chapasRoutes from './modules/chapas/chapas.routes';
import servicosRoutes from './modules/servicos/servicos.routes';
import pedidosRoutes from './modules/pedidos/pedidos.routes';
import desenhosRoutes from './modules/desenhos/desenhos.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import meiosPagamentoRoutes from './modules/meios-pagamento/meios-pagamento.routes';
import fornecedoresRoutes from './modules/fornecedores/fornecedores.routes';
import comprasRoutes from './modules/compras/compras.routes';
import relatoriosRoutes from './modules/relatorios/relatorios.routes';
import pagamentosRoutes from './modules/pagamentos/pagamentos.routes';
import minhaEmpresaRoutes from './modules/minha-empresa/minha-empresa.routes';
import perfilRoutes from './modules/perfil/perfil.routes';
import { empresaValidadeMiddleware } from './middlewares/empresa-validade.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

// ── Validação obrigatória de variáveis de ambiente ────────────────────────────
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(`[STARTUP] Variável de ambiente obrigatória ausente: ${v}`);
    process.exit(1);
  }
}

if ((process.env['JWT_SECRET'] as string).length < 32) {
  console.error('[STARTUP] JWT_SECRET deve ter pelo menos 32 caracteres.');
  process.exit(1);
}

const app = express();
const PORT = process.env['PORT'] || 3004;

// ── Headers de segurança HTTP ─────────────────────────────────────────────────
// CSP desabilitado: o Angular serve arquivos estáticos com hashes/nonces
// que o helmet não conhece em tempo de build. Outros headers (HSTS, XFO, etc.) permanecem.
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS — origens permitidas via variável de ambiente ────────────────────────
const rawOrigins = process.env['ALLOWED_ORIGINS'] || 'http://localhost:4204';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite sem origin (curl, mobile, Postman interno) apenas em dev
    if (!origin && process.env['NODE_ENV'] !== 'production') return callback(null, true);
    if (origin && allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Limite de tamanho de payload (prevenção de DoS) ───────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Rate limiting global ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use('/api/', globalLimiter);

// ── Rotas públicas ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/pagamentos', pagamentosRoutes); // webhook é público; autenticação por rota

// ── Verificação de validade de licença (todas as rotas protegidas) ────────────
app.use('/api', empresaValidadeMiddleware);

// ── Rotas protegidas ──────────────────────────────────────────────────────────
app.use('/api/cep', cepRoutes);
app.use('/api/cidades', cidadesRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/chapas', chapasRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/desenhos', desenhosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meios-pagamento', meiosPagamentoRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/minha-empresa', minhaEmpresaRoutes);
app.use('/api/perfil', perfilRoutes);

// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Servir frontend Angular (produção) ────────────────────────────────────────
const frontendCandidates = [
  path.join(process.cwd(), '../frontend/dist/frontend/browser'),
  path.join(process.cwd(), '../frontend/browser'),
  path.join(process.cwd(), 'frontend/browser'),
];
const frontendPath = frontendCandidates.find(p => fs.existsSync(p));

if (frontendPath) {
  console.log(`[STARTUP] Servindo frontend de: ${frontendPath}`);
  app.use(express.static(frontendPath));
  // SPA fallback — retorna index.html para qualquer rota não resolvida pelo backend
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.warn('[STARTUP] Pasta do frontend não encontrada — modo API only.');
  console.warn('[STARTUP] Caminhos verificados:', frontendCandidates);
}

// ── Error handler (deve ser o último middleware) ───────────────────────────────
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Backend Calhas rodando em http://localhost:${PORT}`);
});

export default app;
