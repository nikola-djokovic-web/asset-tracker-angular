export interface User {
  id: number;
  tenant_id?: number | string | null;
  name: string;
  email: string;
  role?: string;
}

export interface Asset {
  id: number | string;
  name: string;
  asset_tag: string;
  status: 'active' | 'assigned' | 'maintenance' | 'retired' | 'inactive';
  type: 'hardware' | 'license';
  category_id: number | string;
  category?: { id: number; name: string };
  organization_id?: number | string | null;
  created_at?: string;
  details?: {
    serial_number?: string | null;
    license_key?: string | null;
    seats?: number;
    expires_at?: string | null;
    specs?: Record<string, string | number | null>;
  } | null;
}

export interface Category {
  id: number | string;
  name: string;
}

export interface AssetUser {
  id: number | string;
  name: string;
  email: string;
}

export interface Assignment {
  id: number | string;
  assigned_to?: AssetUser;
  assigned_by?: AssetUser;
  assigned_at: string;
  returned_at?: string | null;
  notes?: string | null;
  condition_on_checkout?: string;
  condition_on_checkin?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
