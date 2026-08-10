/** Item de configuracion global del negocio */
export interface BusinessConfigItem {
  id: string;
  config_key: string;
  description: string;
  value_cents: number | null;
  value_bps: number | null;
  version: number;
  updated_at: string;
}
