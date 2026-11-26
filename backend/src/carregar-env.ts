import { config } from 'dotenv';

// A Discloud grava o .env na raiz do repositório e o backend roda dentro de backend/.
config({ path: ['.env', '../.env'], quiet: true });
