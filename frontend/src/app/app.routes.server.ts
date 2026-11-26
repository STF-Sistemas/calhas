import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'esqueci-senha', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
