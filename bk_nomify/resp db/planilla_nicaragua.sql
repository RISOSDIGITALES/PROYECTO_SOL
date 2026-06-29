-- Nomify — Esquema base de datos
-- Solo estructura, sin datos. Para instalación inicial.
-- Las actualizaciones se aplican automáticamente al arrancar el servidor.
-- Generado: 2026-06-29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- adelantos
-- --------------------------------------------------------
CREATE TABLE `adelantos` (
  `id`             int          NOT NULL AUTO_INCREMENT,
  `empleado_id`    int          NOT NULL,
  `monto`          decimal(10,2) NOT NULL,
  `descontar_en`   date          DEFAULT NULL,
  `estado`         varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `pausado`        tinyint(1)    DEFAULT '0',
  `fecha_registro` date          DEFAULT NULL,
  `notas`          text          COLLATE utf8mb4_unicode_ci,
  `created_at`     timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- deducciones
-- --------------------------------------------------------
CREATE TABLE `deducciones` (
  `id`             int          NOT NULL AUTO_INCREMENT,
  `empleado_id`    int          NOT NULL,
  `concepto`       varchar(100)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion`    text          COLLATE utf8mb4_unicode_ci,
  `monto`          decimal(10,2) NOT NULL,
  `descontar_en`   date          DEFAULT NULL,
  `estado`         varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `pausado`        tinyint(1)    DEFAULT '0',
  `fecha_registro` date          DEFAULT NULL,
  `created_at`     timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- detalle_planilla
-- --------------------------------------------------------
CREATE TABLE `detalle_planilla` (
  `id`                   int          NOT NULL AUTO_INCREMENT,
  `planilla_id`          int          NOT NULL,
  `empleado_id`          int          NOT NULL,
  `salario_quincenal`    decimal(10,2) DEFAULT '0.00',
  `inss`                 decimal(10,2) DEFAULT '0.00',
  `ir`                   decimal(10,2) DEFAULT '0.00',
  `deducciones_prestamos` decimal(10,2) DEFAULT '0.00',
  `deducciones_adelantos` decimal(10,2) DEFAULT '0.00',
  `deducciones_otras`    decimal(10,2) DEFAULT '0.00',
  `extras`               decimal(10,2) DEFAULT '0.00',
  `vacaciones_pagadas`   decimal(10,2) DEFAULT '0.00',
  `neto`                 decimal(10,2) DEFAULT '0.00',
  `periodo`              varchar(10)   COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `tipo_planilla`        varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Con Seguro',
  `desc_prestamo`        decimal(12,2) DEFAULT '0.00',
  `desc_adelanto`        decimal(12,2) DEFAULT '0.00',
  `desc_deducciones`     decimal(12,2) DEFAULT '0.00',
  `total_deducciones`    decimal(12,2) DEFAULT '0.00',
  `inss_patronal`        decimal(10,2) DEFAULT '0.00',
  `inatec`               decimal(10,2) DEFAULT '0.00',
  `meses_trabajados`     decimal(4,2)  DEFAULT NULL,
  `adelantos_ids`        text          COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deducciones_ids`      text          COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prestamos_data`       text          COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_planilla_empleado` (`planilla_id`, `empleado_id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- empleados
-- --------------------------------------------------------
CREATE TABLE `empleados` (
  `id`               int          NOT NULL AUTO_INCREMENT,
  `nombre`           varchar(150)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `cedula`           varchar(16)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date          DEFAULT NULL,
  `cargo`            varchar(100)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_planilla`    varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Con Seguro',
  `salario_bruto`    decimal(10,2) DEFAULT '0.00',
  `inss_base`        varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Salario Completo',
  `ir_tipo`          varchar(20)   COLLATE utf8mb4_unicode_ci DEFAULT 'Sin IR',
  `ir_fijo`          decimal(10,2) DEFAULT '0.00',
  `email`            varchar(150)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol`              varchar(50)   COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Empleado',
  `planillas_acceso` json          DEFAULT NULL,
  `activo`           tinyint(1)    DEFAULT '1',
  `fecha_ingreso`    date          DEFAULT NULL,
  `empresa_id`       int           DEFAULT NULL,
  `created_at`       timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- empresas
-- --------------------------------------------------------
CREATE TABLE `empresas` (
  `id`              int          NOT NULL AUTO_INCREMENT,
  `nombre`          varchar(255)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruc`             varchar(30)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo`          varchar(150)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono`        varchar(30)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion`       text          COLLATE utf8mb4_unicode_ci,
  `logo`            mediumtext    COLLATE utf8mb4_unicode_ci,
  `inatec_activo`   tinyint(1)    NOT NULL DEFAULT '1',
  `notif_usuarios`  text          COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`      timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- extras
-- --------------------------------------------------------
CREATE TABLE `extras` (
  `id`             int          NOT NULL AUTO_INCREMENT,
  `empleado_id`    int          NOT NULL,
  `tipo`           varchar(100)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion`    text          COLLATE utf8mb4_unicode_ci,
  `monto`          decimal(10,2) NOT NULL,
  `pagar_en`       date          DEFAULT NULL,
  `fecha_registro` date          DEFAULT NULL,
  `created_at`     timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- historial_salarios
-- --------------------------------------------------------
CREATE TABLE `historial_salarios` (
  `id`               int          NOT NULL AUTO_INCREMENT,
  `empleado_id`      int          NOT NULL,
  `salario_anterior` decimal(12,2) NOT NULL,
  `salario_nuevo`    decimal(12,2) NOT NULL,
  `fecha`            date          NOT NULL,
  `usuario`          varchar(150)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo`           varchar(200)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`       timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- liquidaciones
-- --------------------------------------------------------
CREATE TABLE `liquidaciones` (
  `id`                   int          NOT NULL AUTO_INCREMENT,
  `empleado_id`          int          NOT NULL,
  `empresa_id`           int           DEFAULT NULL,
  `fecha_baja`           date          NOT NULL,
  `motivo`               varchar(100)  COLLATE utf8mb4_unicode_ci DEFAULT 'Renuncia voluntaria',
  `salario_mensual`      decimal(12,2) DEFAULT '0.00',
  `fecha_ingreso`        date          DEFAULT NULL,
  `anios_servicio`       decimal(6,2)  DEFAULT '0.00',
  `meses_servicio`       decimal(6,2)  DEFAULT '0.00',
  `dias_vacaciones`      decimal(6,2)  DEFAULT '0.00',
  `monto_vacaciones`     decimal(12,2) DEFAULT '0.00',
  `meses_aguinaldo`      decimal(4,2)  DEFAULT '0.00',
  `monto_aguinaldo`      decimal(12,2) DEFAULT '0.00',
  `aplica_indemnizacion` tinyint(1)    DEFAULT '0',
  `monto_indemnizacion`  decimal(12,2) DEFAULT '0.00',
  `aplica_preaviso`      tinyint(1)    DEFAULT '0',
  `dias_preaviso`        int           DEFAULT '0',
  `monto_preaviso`       decimal(12,2) DEFAULT '0.00',
  `total`                decimal(12,2) DEFAULT '0.00',
  `notas`                text          COLLATE utf8mb4_unicode_ci,
  `estado`               varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `created_at`           timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- moneda
-- --------------------------------------------------------
CREATE TABLE `moneda` (
  `id`         int          NOT NULL AUTO_INCREMENT,
  `nombre`     varchar(100)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo`     varchar(10)   COLLATE utf8mb4_unicode_ci NOT NULL,
  `simbolo`    varchar(10)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- pagos_prestamos
-- --------------------------------------------------------
CREATE TABLE `pagos_prestamos` (
  `id`          int          NOT NULL AUTO_INCREMENT,
  `prestamo_id` int          NOT NULL,
  `fecha`       varchar(10)   COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto`       decimal(12,2) NOT NULL,
  `tipo`        varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Abono directo',
  `concepto`    varchar(200)  COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at`  timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `prestamo_id` (`prestamo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- planillas
-- --------------------------------------------------------
CREATE TABLE `planillas` (
  `id`                   int          NOT NULL AUTO_INCREMENT,
  `periodo`              date          NOT NULL,
  `tipo`                 varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT '',
  `fecha_generacion`     timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  `generado_por`         varchar(150)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado`               varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Borrador',
  `total_bruto`          decimal(12,2) DEFAULT '0.00',
  `total_deducciones`    decimal(12,2) DEFAULT '0.00',
  `total_neto`           decimal(12,2) DEFAULT '0.00',
  `total_inss_patronal`  decimal(12,2) DEFAULT '0.00',
  `total_inatec`         decimal(12,2) DEFAULT '0.00',
  `costo_total_empresa`  decimal(12,2) DEFAULT '0.00',
  `empresa_id`           int           DEFAULT NULL,
  `folio`                int           DEFAULT NULL,
  `created_at`           timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- prestamos
-- --------------------------------------------------------
CREATE TABLE `prestamos` (
  `id`               int          NOT NULL AUTO_INCREMENT,
  `empleado_id`      int          NOT NULL,
  `monto_total`      decimal(10,2) NOT NULL,
  `cuota_quincenal`  decimal(10,2) NOT NULL,
  `cuotas_restantes` int           DEFAULT '0',
  `estado`           varchar(50)   COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `fecha_inicio`     date          DEFAULT NULL,
  `notas`            text          COLLATE utf8mb4_unicode_ci,
  `historial_pagos`  text          COLLATE utf8mb4_unicode_ci,
  `frecuencia`       varchar(20)   COLLATE utf8mb4_unicode_ci DEFAULT 'Quincenal',
  `frecuencia_dia`   varchar(10)   COLLATE utf8mb4_unicode_ci DEFAULT '15',
  `saldo_pendiente`  decimal(12,2) DEFAULT NULL,
  `created_at`       timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- usuarios
-- --------------------------------------------------------
CREATE TABLE `usuarios` (
  `id`               int          NOT NULL AUTO_INCREMENT,
  `email`            varchar(150)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash`    varchar(255)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol`              varchar(50)   COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Planillero',
  `empleado_id`      int           DEFAULT NULL,
  `nombre`           varchar(150)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planillas_acceso` varchar(100)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresas_acceso`  text          COLLATE utf8mb4_unicode_ci,
  `created_at`       timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- vacaciones
-- --------------------------------------------------------
CREATE TABLE `vacaciones` (
  `id`               int          NOT NULL AUTO_INCREMENT,
  `empleado_id`      int          NOT NULL,
  `tipo`             varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Días libres',
  `dias`             decimal(5,2)  DEFAULT '0.00',
  `monto`            decimal(10,2) DEFAULT '0.00',
  `fecha_inicio`     date          DEFAULT NULL,
  `fecha_fin`        date          DEFAULT NULL,
  `fecha_registro`   date          DEFAULT NULL,
  `estado`           varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT 'Aprobada',
  `notas`            text          COLLATE utf8mb4_unicode_ci,
  `pago_tipo`        varchar(20)   COLLATE utf8mb4_unicode_ci DEFAULT 'Independiente',
  `planilla_id`      int           DEFAULT NULL,
  `periodo_planilla` date          DEFAULT NULL,
  `created_at`       timestamp     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Llaves foráneas
-- --------------------------------------------------------
ALTER TABLE `adelantos`
  ADD CONSTRAINT `adelantos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

ALTER TABLE `deducciones`
  ADD CONSTRAINT `deducciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

ALTER TABLE `detalle_planilla`
  ADD CONSTRAINT `detalle_planilla_ibfk_1` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_planilla_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

ALTER TABLE `extras`
  ADD CONSTRAINT `extras_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

ALTER TABLE `historial_salarios`
  ADD CONSTRAINT `historial_salarios_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE;

ALTER TABLE `liquidaciones`
  ADD CONSTRAINT `liquidaciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

ALTER TABLE `pagos_prestamos`
  ADD CONSTRAINT `pagos_prestamos_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE;

ALTER TABLE `prestamos`
  ADD CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL;

ALTER TABLE `vacaciones`
  ADD CONSTRAINT `vacaciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

COMMIT;
