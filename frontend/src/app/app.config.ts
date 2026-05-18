import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideNgxMask } from 'ngx-mask';

registerLocaleData(localePtBr);


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.app-dark'
            }
        }
    }),
    { provide: LOCALE_ID, useValue: 'pt' },
    MessageService,
    ConfirmationService,
    provideNgxMask(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
