export const environment = {
  production: false,
  apiUrl: 'http://192.168.253.141:56473/api/v1',
  enforceTabletResolution: false,
  // Vacía = captcha apagado en local. Pegar aquí la site key (o la
  // clave de prueba de Google) para probar contra un backend con
  // RECAPTCHA_ENABLED=true.
  recaptchaSiteKey: '',
  // Apagado en dev para no entorpecer pruebas manuales con
  // reintentos rápidos. Activar puntualmente si se quiere validar
  // el comportamiento del rate-limit/circuit breaker en local.
  ddosProtection: false,
};
