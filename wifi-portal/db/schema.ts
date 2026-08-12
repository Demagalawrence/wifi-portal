/**
 * SQLite schema for the WiFi Hotspot Portal API.
 *
 * Mirrors the Django models (accounts.User, plans.Plan, payments.Payment,
 * wifi_sessions.*) using columns that map 1:1 to the DRF payloads the
 * frontend expects. Dates are stored as ISO-8601 UTC strings so that
 * lexicographic comparisons are equivalent to chronological ones.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active_session INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_staff INTEGER NOT NULL DEFAULT 0,
  is_superuser INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  mac_address TEXT,
  device_info TEXT NOT NULL DEFAULT '{}',
  last_login_ip TEXT,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL,
  duration_hours INTEGER NOT NULL,
  duration_display TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_included INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  external_reference TEXT,
  failure_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  request_data TEXT NOT NULL DEFAULT '{}',
  response_data TEXT NOT NULL DEFAULT '{}',
  status_code INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wifi_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  payment_id TEXT NOT NULL REFERENCES payments(id),
  mac_address TEXT,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  data_used INTEGER NOT NULL DEFAULT 0,
  last_activity TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_tokens (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  payment_id TEXT NOT NULL REFERENCES payments(id),
  session_id TEXT REFERENCES wifi_sessions(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL DEFAULT '',
  mac_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT NOT NULL,
  regenerated_from TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES wifi_sessions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  data_amount INTEGER NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS network_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mac_address TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  device_info TEXT NOT NULL DEFAULT '{}',
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);
`;
