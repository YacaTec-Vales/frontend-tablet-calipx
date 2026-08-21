export const environment = {
  production: false,
  // Dev: usa el proxy de Angular (proxy.conf.json) que redirige /api/*
  // al backend dev en casa (utete.ddns.net:45000). Patron consistente con
  // desktop-Tecu y mobile-poch. apiv2.taquizaschavez.com.mx es dev y
  // solo se usa para deploys remotos via tunnel Cloudflare.
  apiUrl: '/api/v1'
};

