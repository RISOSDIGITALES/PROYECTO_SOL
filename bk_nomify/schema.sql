-- ============================================================
-- Nomify — Script de instalación de base de datos
-- MariaDB / MySQL
-- Ejecutar contra la base de datos: planilla_nicaragua
-- ============================================================

CREATE TABLE IF NOT EXISTS empleados (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150)   NOT NULL,
  cargo         VARCHAR(100)   DEFAULT '',
  tipo_planilla VARCHAR(50)    DEFAULT 'Con Seguro',
  salario_bruto DECIMAL(12,2)  DEFAULT 0,
  inss_base     VARCHAR(50)    DEFAULT 'Salario Completo',
  ir_fijo       DECIMAL(12,2)  DEFAULT 0,
  email         VARCHAR(255)   DEFAULT NULL,
  rol           VARCHAR(50)    DEFAULT 'Empleado',
  planillas_acceso VARCHAR(100) DEFAULT NULL,
  fecha_ingreso DATE           DEFAULT NULL,
  activo        TINYINT(1)     DEFAULT 1
);

CREATE TABLE IF NOT EXISTS planillas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  periodo           VARCHAR(10)    NOT NULL,
  tipo              VARCHAR(50)    DEFAULT '',
  estado            VARCHAR(50)    DEFAULT 'Borrador',
  total_bruto       DECIMAL(12,2)  DEFAULT 0,
  total_deducciones DECIMAL(12,2)  DEFAULT 0,
  total_neto        DECIMAL(12,2)  DEFAULT 0,
  created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_planilla (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  planilla_id       INT            NOT NULL,
  empleado_id       INT            NOT NULL,
  periodo           VARCHAR(10)    NOT NULL,
  tipo_planilla     VARCHAR(50)    DEFAULT 'Con Seguro',
  salario_quincenal DECIMAL(12,2)  DEFAULT 0,
  inss              DECIMAL(12,2)  DEFAULT 0,
  ir                DECIMAL(12,2)  DEFAULT 0,
  desc_prestamo     DECIMAL(12,2)  DEFAULT 0,
  desc_adelanto     DECIMAL(12,2)  DEFAULT 0,
  extras            DECIMAL(12,2)  DEFAULT 0,
  desc_deducciones  DECIMAL(12,2)  DEFAULT 0,
  total_deducciones DECIMAL(12,2)  DEFAULT 0,
  neto              DECIMAL(12,2)  DEFAULT 0,
  created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prestamos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id       INT            NOT NULL,
  monto_total       DECIMAL(12,2)  DEFAULT 0,
  cuota_quincenal   DECIMAL(12,2)  DEFAULT 0,
  cuotas_restantes  INT            DEFAULT 0,
  estado            VARCHAR(50)    DEFAULT 'Activo',
  historial_pagos   TEXT           DEFAULT NULL,
  notas             TEXT           DEFAULT NULL,
  created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adelantos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id   INT            NOT NULL,
  monto         DECIMAL(12,2)  DEFAULT 0,
  descontar_en  VARCHAR(10)    DEFAULT NULL,
  estado        VARCHAR(50)    DEFAULT 'Pendiente',
  pausado       TINYINT(1)     DEFAULT 0,
  fecha_registro DATE          DEFAULT (CURDATE())
);

CREATE TABLE IF NOT EXISTS extras (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT            NOT NULL,
  tipo        VARCHAR(50)    DEFAULT 'Bono',
  descripcion TEXT           DEFAULT NULL,
  monto       DECIMAL(12,2)  DEFAULT 0,
  pagar_en    VARCHAR(10)    DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS deducciones (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id   INT            NOT NULL,
  concepto      VARCHAR(100)   DEFAULT NULL,
  descripcion   TEXT           DEFAULT NULL,
  monto         DECIMAL(12,2)  DEFAULT 0,
  descontar_en  VARCHAR(10)    DEFAULT NULL,
  estado        VARCHAR(50)    DEFAULT 'Pendiente',
  pausado       TINYINT(1)     DEFAULT 0,
  fecha_registro DATE          DEFAULT (CURDATE())
);

CREATE TABLE IF NOT EXISTS vacaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT            NOT NULL,
  tipo        VARCHAR(50)    DEFAULT 'Descanso',
  dias        DECIMAL(5,1)   DEFAULT 0,
  monto       DECIMAL(12,2)  DEFAULT NULL,
  fecha_inicio DATE          DEFAULT NULL,
  fecha_fin   DATE           DEFAULT NULL,
  estado      VARCHAR(50)    DEFAULT 'Aprobada',
  notas       TEXT           DEFAULT NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(150)   DEFAULT NULL,
  email            VARCHAR(255)   UNIQUE NOT NULL,
  password_hash    VARCHAR(255)   NOT NULL,
  rol              VARCHAR(50)    DEFAULT 'Colaborador',
  planillas_acceso VARCHAR(100)   DEFAULT NULL,
  empleado_id      INT            DEFAULT NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);
