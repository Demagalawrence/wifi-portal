/**
 * Row shapes returned by the SQLite queries.
 *
 * SQLite stores booleans as 0/1 integers and JSON columns as text; the
 * serializers convert those to the exact JSON types the frontend expects.
 */

export interface UserRow {
  id: string;
  username: string;
  password: string;
  email: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active_session: number;
  is_active: number;
  is_staff: number;
  is_superuser: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfileRow {
  id: number;
  user_id: string;
  mac_address: string | null;
  device_info: string;
  last_login_ip: string | null;
  total_sessions: number;
  total_spent: number;
}

export interface PlanRow {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_hours: number;
  duration_display: string;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatureRow {
  id: number;
  plan_id: string;
  feature_name: string;
  is_included: number;
}

export interface AuthTokenRow {
  key: string;
  user_id: string;
  created: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  payment_method: string;
  phone_number: string;
  transaction_id: string | null;
  status: string;
  external_reference: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRow {
  id: number;
  payment_id: string;
  transaction_type: string;
  request_data: string;
  response_data: string;
  status_code: number | null;
  created_at: string;
}

export interface WiFiSessionRow {
  id: string;
  user_id: string;
  plan_id: string;
  payment_id: string;
  mac_address: string | null;
  ip_address: string | null;
  status: string;
  start_time: string;
  end_time: string;
  data_used: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface AccessTokenRow {
  id: string;
  code: string;
  user_id: string;
  plan_id: string;
  payment_id: string;
  session_id: string | null;
  phone_number: string;
  mac_address: string | null;
  status: string;
  expires_at: string;
  regenerated_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionActivityRow {
  id: number;
  session_id: string;
  activity_type: string;
  data_amount: number;
  timestamp: string;
  details: string;
}

export interface NetworkDeviceRow {
  id: number;
  mac_address: string;
  ip_address: string | null;
  user_id: string | null;
  status: string;
  device_info: string;
  first_seen: string;
  last_seen: string;
}
