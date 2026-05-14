-- ============================================================
-- Cabinet Médical — MySQL Schema (STRUCTURE ONLY)
-- ⚠️ NO DATA INSERTED HERE — Data is seeded by server/index.ts
--    with proper bcrypt-hashed passwords on first startup.
-- ============================================================

DROP DATABASE IF EXISTS cabinet_medical;
CREATE DATABASE cabinet_medical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cabinet_medical;

-- ============================================================
-- 1. TABLE: users (all roles: admin, patient, secretary, doctor)
-- ============================================================
CREATE TABLE users (
    id              VARCHAR(36)     NOT NULL    PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL    UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            ENUM('admin','patient','secretary','doctor') NOT NULL,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20)     DEFAULT '',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_name (last_name, first_name)
) ENGINE=InnoDB;

-- ============================================================
-- 2. TABLE: patient_details
-- ============================================================
CREATE TABLE patient_details (
    user_id         VARCHAR(36)     NOT NULL    PRIMARY KEY,
    date_of_birth   DATE,
    address         TEXT,
    blood_type      VARCHAR(5)      DEFAULT NULL,
    allergies       JSON            DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_patient_dob (date_of_birth)
) ENGINE=InnoDB;

-- ============================================================
-- 3. TABLE: doctor_details
-- ============================================================
CREATE TABLE doctor_details (
    user_id         VARCHAR(36)     NOT NULL    PRIMARY KEY,
    specialization  VARCHAR(200)    DEFAULT 'Médecine Générale',
    license_number  VARCHAR(50)     DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. TABLE: appointments
-- ============================================================
CREATE TABLE appointments (
    id              VARCHAR(36)     NOT NULL    PRIMARY KEY,
    patient_id      VARCHAR(36)     NOT NULL,
    doctor_id       VARCHAR(36)     NOT NULL,
    date            DATE            NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    status          ENUM('pending','confirmed','completed','cancelled','no-show')
                                    NOT NULL    DEFAULT 'pending',
    reason          VARCHAR(500)    DEFAULT '',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    consultation_id VARCHAR(36)     DEFAULT NULL,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id)  REFERENCES users(id) ON DELETE RESTRICT,

    INDEX idx_apt_date (date),
    INDEX idx_apt_doctor_date (doctor_id, date),
    INDEX idx_apt_patient (patient_id),
    INDEX idx_apt_status (status),
    UNIQUE idx_apt_slot (doctor_id, date, start_time)
) ENGINE=InnoDB;

-- ============================================================
-- 5. TABLE: consultations
-- ============================================================
CREATE TABLE consultations (
    id              VARCHAR(36)     NOT NULL    PRIMARY KEY,
    appointment_id  VARCHAR(36)     NOT NULL,
    patient_id      VARCHAR(36)     NOT NULL,
    doctor_id       VARCHAR(36)     NOT NULL,
    date            DATE            NOT NULL,
    is_present      BOOLEAN         NOT NULL    DEFAULT TRUE,
    report          TEXT,
    diagnosis       VARCHAR(500),
    notes           TEXT,
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id)     REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id)      REFERENCES users(id) ON DELETE RESTRICT,

    INDEX idx_cons_patient (patient_id),
    INDEX idx_cons_doctor (doctor_id),
    INDEX idx_cons_date (date)
) ENGINE=InnoDB;

-- ============================================================
-- 6. TABLE: prescriptions
-- ============================================================
CREATE TABLE prescriptions (
    id                  VARCHAR(36)     NOT NULL    PRIMARY KEY,
    consultation_id     VARCHAR(36)     NOT NULL,
    medication_name     VARCHAR(200)    NOT NULL,
    dosage              VARCHAR(100)    DEFAULT '',
    duration            VARCHAR(100)    DEFAULT '',
    instructions        TEXT,

    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,

    INDEX idx_rx_consultation (consultation_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. TABLE: audit_log
-- ============================================================
CREATE TABLE audit_log (
    id          BIGINT          AUTO_INCREMENT  PRIMARY KEY,
    timestamp   DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    level       ENUM('INFO','WARN','ERROR') NOT NULL DEFAULT 'INFO',
    user_id     VARCHAR(36)     DEFAULT NULL,
    action      VARCHAR(100)    NOT NULL,
    details     JSON            DEFAULT NULL,
    ip_address  VARCHAR(45)     DEFAULT NULL,

    INDEX idx_log_timestamp (timestamp),
    INDEX idx_log_user (user_id),
    INDEX idx_log_level (level)
) ENGINE=InnoDB;
