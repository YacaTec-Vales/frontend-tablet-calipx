export const environment = {
  production: true,
  apiUrl: 'https://api.taquizaschavez.com.mx/api/v1',
  enforceTabletResolution: true,
  // Clave pública del sitio reCAPTCHA v3 (Google reCAPTCHA Admin).
  // Un solo par de llaves cubre los dominios tecu/calipx/poch.
  // Si queda vacía, el interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: '6LfrdwktAAAAADqngll9t39PaELG52BcoHv8gw8v',
  // Mitigación cooperante de DDoS en el cliente (rate-limit,
  // circuit breaker, fingerprint, request-id). El corte real debe
  // seguir viviéndose en el edge (Cloudflare) y backend.
  ddosProtection: true,
};
