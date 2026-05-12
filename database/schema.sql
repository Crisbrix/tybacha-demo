CREATE TABLE roles (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id VARCHAR(40) NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  remember_token_hash VARCHAR(255),
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40),
  document_number VARCHAR(60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE older_adults (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(40) NOT NULL,
  status ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  phone VARCHAR(40),
  address VARCHAR(255),
  emergency_contact VARCHAR(255),
  professional_id BIGINT,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES users(id)
);

CREATE TABLE medical_histories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  older_adult_id BIGINT NOT NULL,
  pathologies JSON,
  medications JSON,
  allergies JSON,
  notes TEXT,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (older_adult_id) REFERENCES older_adults(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE caregivers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  shift VARCHAR(60),
  status ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE caregiver_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  caregiver_id BIGINT NOT NULL,
  older_adult_id BIGINT NOT NULL,
  assigned_by BIGINT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  UNIQUE KEY uq_active_assignment (caregiver_id, older_adult_id, active),
  FOREIGN KEY (caregiver_id) REFERENCES caregivers(id),
  FOREIGN KEY (older_adult_id) REFERENCES older_adults(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE sft_batteries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sft_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  older_adult_id BIGINT NOT NULL,
  battery_id BIGINT NOT NULL,
  applied_by BIGINT NOT NULL,
  applied_at DATE NOT NULL,
  chair_stand INT,
  arm_curl INT,
  two_minute_step INT,
  chair_sit_reach DECIMAL(5,2),
  back_scratch DECIMAL(5,2),
  eight_foot_up_go DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (older_adult_id) REFERENCES older_adults(id),
  FOREIGN KEY (battery_id) REFERENCES sft_batteries(id),
  FOREIGN KEY (applied_by) REFERENCES users(id)
);

CREATE TABLE exercise_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  older_adult_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  source ENUM('Manual', 'Gemini AI') NOT NULL,
  status ENUM('Borrador', 'Revisado', 'Asignado', 'Historico', 'Ajustado') NOT NULL DEFAULT 'Borrador',
  generated_prompt_hash VARCHAR(128),
  reviewed_by BIGINT NULL,
  assigned_at TIMESTAMP NULL,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (older_adult_id) REFERENCES older_adults(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE plan_exercises (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id BIGINT NOT NULL,
  day_of_week ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes') NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  intensity VARCHAR(60) NOT NULL,
  progression_notes TEXT,
  position_order INT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES exercise_plans(id),
  UNIQUE KEY uq_plan_day (plan_id, day_of_week)
);

CREATE TABLE activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  older_adult_id BIGINT NOT NULL,
  plan_id BIGINT,
  plan_exercise_id BIGINT,
  activity_date DATE NOT NULL,
  status ENUM('Pendiente', 'Completado', 'Omitido') NOT NULL,
  minutes_completed INT DEFAULT 0,
  notes TEXT,
  registered_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (older_adult_id) REFERENCES older_adults(id),
  FOREIGN KEY (plan_id) REFERENCES exercise_plans(id),
  FOREIGN KEY (plan_exercise_id) REFERENCES plan_exercises(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(80) NOT NULL,
  status ENUM('Enviada', 'Recibida', 'Leida') NOT NULL DEFAULT 'Enviada',
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE alert_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  condition_json JSON NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  older_adult_id BIGINT NOT NULL,
  type VARCHAR(160) NOT NULL,
  status ENUM('Vigente', 'Vencido', 'Pendiente', 'Revocado') NOT NULL,
  signed_by VARCHAR(160),
  signed_at DATE,
  expires_at DATE,
  document_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (older_adult_id) REFERENCES older_adults(id)
);

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(120) NOT NULL,
  entity VARCHAR(120) NOT NULL,
  entity_id VARCHAR(80),
  changed_field VARCHAR(120),
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(80),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_older_adults_status ON older_adults(status);
CREATE INDEX idx_activity_adult_date ON activity_logs(older_adult_id, activity_date);
CREATE INDEX idx_sft_adult_date ON sft_results(older_adult_id, applied_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
