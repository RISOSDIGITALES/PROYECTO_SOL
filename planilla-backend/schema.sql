-- ============================================================
-- Planilla Nicaragua — Schema MariaDB
-- Ejecutar una sola vez para crear la base de datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS planilla_nicaragua
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE planilla_nicaragua;

-- ─── EMPLEADOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empleados (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(150) NOT NULL,
  cargo             VARCHAR(150),
  salario_mensual   DECIMAL(10,2) NOT NULL DEFAULT 0,
  tipo_planilla     ENUM('Con Seguro','Sin Seguro') NOT NULL DEFAULT 'Con Seguro',
  inss_base         ENUM('Salario Completo','Salario Mínimo') NOT NULL DEFAULT 'Salario Completo',
  ir                DECIMAL(10,2) NOT NULL DEFAULT 0,
  email             VARCHAR(200),
  rol               ENUM('Admin','Planillero','Empleado') DEFAULT 'Empleado',
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRÉSTAMOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestamos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id       INT NOT NULL,
  monto_total       DECIMAL(10,2) NOT NULL,
  saldo_pendiente   DECIMAL(10,2) NOT NULL,
  cuota_quincenal   DECIMAL(10,2) NOT NULL,
  cuotas_restantes  INT NOT NULL DEFAULT 0,
  descripcion       TEXT,
  fecha_inicio      DATE NOT NULL,
  estado            ENUM('Activo','Pagado','Pausado') NOT NULL DEFAULT 'Activo',
  historial_pagos   TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- ─── ADELANTOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adelantos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id         INT NOT NULL,
  monto               DECIMAL(10,2) NOT NULL,
  quincena_descuento  VARCHAR(10) NOT NULL,   -- formato YYYY-MM-DD
  descripcion         TEXT,
  estado              ENUM('Pendiente','Descontado') NOT NULL DEFAULT 'Pendiente',
  pausado             TINYINT(1) NOT NULL DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- ─── EXTRAS / BONOS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extras (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id       INT NOT NULL,
  tipo              ENUM('Feriado trabajado','Horas extra','Bono','Otro') NOT NULL DEFAULT 'Otro',
  descripcion       TEXT,
  monto             DECIMAL(10,2) NOT NULL,
  pagar_quincena    VARCHAR(10) NOT NULL,     -- formato YYYY-MM-DD
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- ─── DEDUCCIONES MANUALES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS deducciones (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id         INT NOT NULL,
  descripcion         TEXT NOT NULL,
  monto               DECIMAL(10,2) NOT NULL,
  quincena_descuento  VARCHAR(10) NOT NULL,   -- formato YYYY-MM-DD
  estado              ENUM('Pendiente','Descontado') NOT NULL DEFAULT 'Pendiente',
  pausado             TINYINT(1) NOT NULL DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- ─── VACACIONES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vacaciones (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id   INT NOT NULL,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  dias          DECIMAL(5,2) NOT NULL,
  pagadas       TINYINT(1) NOT NULL DEFAULT 0,
  monto         DECIMAL(10,2),               -- monto neto si pagadas
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);

-- ─── PLANILLAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planillas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  periodo             VARCHAR(10) NOT NULL,   -- YYYY-MM-DD
  tipo                VARCHAR(50),
  fecha_inicio        DATE,
  fecha_fin           DATE,
  estado              ENUM('Borrador','Generada','Pagada') NOT NULL DEFAULT 'Borrador',
  total_bruto         DECIMAL(12,2) DEFAULT 0,
  total_deducciones   DECIMAL(12,2) DEFAULT 0,
  total_neto          DECIMAL(12,2) DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── DETALLE PLANILLA ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_planilla (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  planilla_id           INT NOT NULL,
  empleado_id           INT NOT NULL,
  tipo_planilla         VARCHAR(50),
  salario_quincenal     DECIMAL(10,2) DEFAULT 0,
  extras                DECIMAL(10,2) DEFAULT 0,
  subtotal              DECIMAL(10,2) DEFAULT 0,
  inss                  DECIMAL(10,2) DEFAULT 0,
  ir                    DECIMAL(10,2) DEFAULT 0,
  desc_prestamos        DECIMAL(10,2) DEFAULT 0,
  desc_adelantos        DECIMAL(10,2) DEFAULT 0,
  desc_deducciones      DECIMAL(10,2) DEFAULT 0,
  total_descuentos      DECIMAL(10,2) DEFAULT 0,
  neto_pagar            DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (planilla_id) REFERENCES planillas(id),
  FOREIGN KEY (empleado_id) REFERENCES empleados(id)
);
