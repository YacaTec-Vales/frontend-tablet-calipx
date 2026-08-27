import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { recaptchaInterceptor } from './core/interceptors/recaptcha.interceptor';
import { ddosProtectionInterceptor } from './core/interceptors/ddos-protection.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        ddosProtectionInterceptor,
        authInterceptor,
        refreshInterceptor,
        recaptchaInterceptor,
        errorInterceptor,
      ]),
    ),
  ],
};
