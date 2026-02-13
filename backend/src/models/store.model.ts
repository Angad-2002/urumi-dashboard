export type StoreType = 'woocommerce' | 'medusa';

export type StoreStatus = 'Provisioning' | 'Ready' | 'Failed' | 'Deleting';

export interface Store {
  id: string;
  type: StoreType;
  name: string | null;
  namespace: string;
  status: StoreStatus;
  url: string | null;
  admin_url: string | null;
  error_message: string | null;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}
