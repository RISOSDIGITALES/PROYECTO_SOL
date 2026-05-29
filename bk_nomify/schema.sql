-- ============================================================
-- Nomify — Script de instalación de base de datos
-- MariaDB / MySQL  ·  charset utf8mb4
-- Base de datos destino: nomify  (o planilla_nicaragua)
-- ============================================================
-- Ejecutar con:
--   mysql -u root -p nomify < schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Empresas ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `empresas` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `nombre`     VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Empleados ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `empleados` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `nombre`           VARCHAR(150) NOT NULL,
  `cedula`           VARCHAR(16)  DEFAULT NULL,
  `fecha_nacimiento` DATE         DEFAULT NULL,
  `cargo`            VARCHAR(100) DEFAULT NULL,
  `tipo_planilla`    ENUM('Con Seguro','Sin Seguro') DEFAULT 'Con Seguro',
  `salario_bruto`    DECIMAL(10,2) DEFAULT '0.00',
  `inss_base`        ENUM('Salario Completo','Salario Mínimo') DEFAULT 'Salario Completo',
  `ir_fijo`          DECIMAL(10,2) DEFAULT '0.00',
  `ir_tipo`          VARCHAR(20)  DEFAULT 'Sin IR',
  `email`            VARCHAR(150) DEFAULT NULL,
  `rol`              VARCHAR(50)  NOT NULL DEFAULT 'Empleado',
  `planillas_acceso` JSON         DEFAULT NULL,
  `activo`           TINYINT(1)   DEFAULT 1,
  `fecha_ingreso`    DATE         DEFAULT NULL,
  `empresa_id`       INT          DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Usuarios del sistema ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `email`            VARCHAR(150) NOT NULL,
  `password_hash`    VARCHAR(255) NOT NULL,
  `rol`              VARCHAR(50)  NOT NULL DEFAULT 'Planillero',
  `nombre`           VARCHAR(150) DEFAULT NULL,
  `empleado_id`      INT          DEFAULT NULL,
  `planillas_acceso` VARCHAR(100) DEFAULT NULL,
  `empresas_acceso`  TEXT         DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Planillas ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `planillas` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `periodo`           DATE         NOT NULL,
  `tipo`              VARCHAR(50)  DEFAULT '',
  `estado`            VARCHAR(50)  DEFAULT 'Borrador',
  `total_bruto`       DECIMAL(12,2) DEFAULT '0.00',
  `total_deducciones` DECIMAL(12,2) DEFAULT '0.00',
  `total_neto`        DECIMAL(12,2) DEFAULT '0.00',
  `empresa_id`        INT          DEFAULT NULL,
  `folio`             INT          DEFAULT NULL,
  `generado_por`      VARCHAR(150) DEFAULT NULL,
  `fecha_generacion`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `created_at`        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Detalle por empleado de cada planilla ─────────────────
CREATE TABLE IF NOT EXISTS `detalle_planilla` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `planilla_id`       INT NOT NULL,
  `empleado_id`       INT NOT NULL,
  `periodo`           VARCHAR(10)  NOT NULL DEFAULT '',
  `tipo_planilla`     VARCHAR(50)  DEFAULT 'Con Seguro',
  `salario_quincenal` DECIMAL(10,2) DEFAULT '0.00',
  `inss`              DECIMAL(10,2) DEFAULT '0.00',
  `ir`                DECIMAL(10,2) DEFAULT '0.00',
  `desc_prestamo`     DECIMAL(12,2) DEFAULT '0.00',
  `desc_adelanto`     DECIMAL(12,2) DEFAULT '0.00',
  `desc_deducciones`  DECIMAL(12,2) DEFAULT '0.00',
  `extras`            DECIMAL(10,2) DEFAULT '0.00',
  `total_deducciones` DECIMAL(12,2) DEFAULT '0.00',
  `neto`              DECIMAL(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_planilla_empleado` (`planilla_id`, `empleado_id`),
  CONSTRAINT `detalle_planilla_ibfk_1` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_planilla_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Préstamos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `prestamos` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `empleado_id`      INT NOT NULL,
  `monto_total`      DECIMAL(10,2) NOT NULL,
  `cuota_quincenal`  DECIMAL(10,2) NOT NULL,
  `cuotas_restantes` INT          DEFAULT 0,
  `saldo_pendiente`  DECIMAL(12,2) DEFAULT NULL,
  `estado`           VARCHAR(50)  NOT NULL DEFAULT 'Activo',
  `frecuencia`       VARCHAR(20)  DEFAULT 'Quincenal',
  `frecuencia_dia`   VARCHAR(10)  DEFAULT '15',
  `notas`            TEXT         DEFAULT NULL,
  `historial_pagos`  TEXT         DEFAULT NULL,
  `fecha_inicio`     DATE         DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Pagos de préstamos ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pagos_prestamos` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `prestamo_id` INT NOT NULL,
  `fecha`       VARCHAR(10) NOT NULL,
  `monto`       DECIMAL(12,2) NOT NULL,
  `tipo`        VARCHAR(50)  DEFAULT 'Abono directo',
  `concepto`    VARCHAR(200) DEFAULT '',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `pagos_prestamos_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Adelantos de salario ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `adelantos` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `empleado_id`     INT NOT NULL,
  `monto`           DECIMAL(10,2) NOT NULL,
  `descontar_en`    DATE         DEFAULT NULL,
  `estado`          ENUM('Pendiente','Descontado') DEFAULT 'Pendiente',
  `pausado`         TINYINT(1)   DEFAULT 0,
  `notas`           TEXT         DEFAULT NULL,
  `fecha_registro`  DATE         DEFAULT NULL,
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `adelantos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Extras (bonos, feriados, etc.) ────────────────────────
CREATE TABLE IF NOT EXISTS `extras` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `empleado_id`    INT NOT NULL,
  `tipo`           VARCHAR(100) DEFAULT NULL,
  `descripcion`    TEXT         DEFAULT NULL,
  `monto`          DECIMAL(10,2) NOT NULL,
  `pagar_en`       DATE         DEFAULT NULL,
  `fecha_registro` DATE         DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `extras_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Otras deducciones ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `deducciones` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `empleado_id`    INT NOT NULL,
  `concepto`       VARCHAR(200) DEFAULT NULL,
  `descripcion`    TEXT         DEFAULT NULL,
  `monto`          DECIMAL(10,2) NOT NULL,
  `descontar_en`   DATE         DEFAULT NULL,
  `estado`         ENUM('Pendiente','Descontado') DEFAULT 'Pendiente',
  `pausado`        TINYINT(1)   DEFAULT 0,
  `fecha_registro` DATE         DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `deducciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Vacaciones ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vacaciones` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `empleado_id`    INT NOT NULL,
  `tipo`           ENUM('Pagadas','Días libres') DEFAULT 'Días libres',
  `dias`           DECIMAL(5,2) DEFAULT '0.00',
  `monto`          DECIMAL(10,2) DEFAULT '0.00',
  `fecha_inicio`   DATE         DEFAULT NULL,
  `fecha_fin`      DATE         DEFAULT NULL,
  `estado`         VARCHAR(50)  DEFAULT 'Aprobada',
  `notas`          TEXT         DEFAULT NULL,
  `fecha_registro` DATE         DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `vacaciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Usuario administrador inicial
-- Email:    risosadmi@gmail.com
-- Password: Nomify2026  (cámbiala desde Ajustes al entrar)
-- ============================================================
INSERT IGNORE INTO `usuarios` (nombre, email, password_hash, rol)
VALUES (
  'Administrador',
  'risosadmi@gmail.com',
  '$2a$10$hINfPxYmcxV1xLJFxZMHVeVNov7h3TBBa7UxKkhNUkAoyTv8kQbQC',
  'Master'
);
