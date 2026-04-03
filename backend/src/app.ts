import 'dotenv/config';
import express from 'express';
import cors from 'cors';

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
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();
const PORT = process.env['PORT'] || 3004;

app.use(cors({ origin: 'http://localhost:4204', credentials: true }));
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
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

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Backend Calhas rodando em http://localhost:${PORT}`);
});

export default app;
