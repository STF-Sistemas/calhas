import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { provideNgxMask } from 'ngx-mask';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

registerLocaleData(localePtBr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt' },
    provideNgxMask(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideClientHydration(withEventReplay()),
  ],
};
