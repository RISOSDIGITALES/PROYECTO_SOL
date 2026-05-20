-- Ejecutar en phpMyAdmin (Laragon) contra la base planilla_nicaragua
-- Solo crea las tablas si no existen

CREATE TABLE IF NOT EXISTS planillas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  periodo          VARCHAR(10)    NOT NULL,
  tipo             VARCHAR(50)    DEFAULT '',
  estado           VARCHAR(50)    DEFAULT 'Borrador',
  total_bruto      DECIMAL(12,2)  DEFAULT 0,
  total_deducciones DECIMAL(12,2) DEFAULT 0,
  total_neto       DECIMAL(12,2)  DEFAULT 0,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_planilla (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  planilla_id       INT           NOT NULL,
  empleado_id       INT           NOT NULL,
  periodo           VARCHAR(10)   NOT NULL,
  tipo_planilla     VARCHAR(50)   DEFAULT 'Con Seguro',
  salario_quincenal DECIMAL(12,2) DEFAULT 0,
  inss              DECIMAL(12,2) DEFAULT 0,
  ir                DECIMAL(12,2) DEFAULT 0,
  desc_prestamo     DECIMAL(12,2) DEFAULT 0,
  desc_adelanto     DECIMAL(12,2) DEFAULT 0,
  extras            DECIMAL(12,2) DEFAULT 0,
  desc_deducciones  DECIMAL(12,2) DEFAULT 0,
  total_deducciones DECIMAL(12,2) DEFAULT 0,
  neto              DECIMAL(12,2) DEFAULT 0,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('Admin','Planillero','Empleado') DEFAULT 'Empleado',
  empleado_id   INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
