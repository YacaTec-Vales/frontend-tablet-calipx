export const environment = {
  production: true,
  // FASE B (CORS proper fix): apiUrl RELATIVO. El proxy de nginx en lb-01
  // (public.conf / vpn.conf) resuelve /api/ al backend correspondiente,
  // evitando preflight CORS cross-origin.
  apiUrl: '/api/v1',
  enforceTabletResolution: true,
  // Clave pública del sitio reCAPTCHA v3 (Google reCAPTCHA Admin).
  // Un solo par de llaves cubre los dominios tecu/calipx/poch.
  // Si queda vacía, el interceptor no adjunta x-recaptcha-token.
  recaptchaSiteKey: '6LdaJZItAAAAAJ_5et0s_du2lb3Jp0cVRinrg0be',
  // Mitigación cooperante de DDoS en el cliente (rate-limit,
  // circuit breaker, fingerprint, request-id). El corte real debe
  // seguir viviéndose en el edge (Cloudflare) y backend.
  ddosProtection: true,
};
