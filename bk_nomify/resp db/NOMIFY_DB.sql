-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 01, 2026 at 07:59 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `planilla_nicaragua`
--

-- --------------------------------------------------------

--
-- Table structure for table `adelantos`
--

CREATE TABLE `adelantos` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descontar_en` date DEFAULT NULL,
  `estado` enum('Pendiente','Descontado') COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `pausado` tinyint(1) DEFAULT '0',
  `fecha_registro` date DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deducciones`
--

CREATE TABLE `deducciones` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `monto` decimal(10,2) NOT NULL,
  `descontar_en` date DEFAULT NULL,
  `estado` enum('Pendiente','Descontado') COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `pausado` tinyint(1) DEFAULT '0',
  `fecha_registro` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detalle_planilla`
--

CREATE TABLE `detalle_planilla` (
  `id` int NOT NULL,
  `planilla_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `salario_quincenal` decimal(10,2) DEFAULT '0.00',
  `inss` decimal(10,2) DEFAULT '0.00',
  `ir` decimal(10,2) DEFAULT '0.00',
  `deducciones_prestamos` decimal(10,2) DEFAULT '0.00',
  `deducciones_adelantos` decimal(10,2) DEFAULT '0.00',
  `deducciones_otras` decimal(10,2) DEFAULT '0.00',
  `extras` decimal(10,2) DEFAULT '0.00',
  `vacaciones_pagadas` decimal(10,2) DEFAULT '0.00',
  `neto` decimal(10,2) DEFAULT '0.00',
  `periodo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `tipo_planilla` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Con Seguro',
  `desc_prestamo` decimal(12,2) DEFAULT '0.00',
  `desc_adelanto` decimal(12,2) DEFAULT '0.00',
  `desc_deducciones` decimal(12,2) DEFAULT '0.00',
  `total_deducciones` decimal(12,2) DEFAULT '0.00',
  `inss_patronal` decimal(10,2) DEFAULT '0.00',
  `inatec` decimal(10,2) DEFAULT '0.00',
  `meses_trabajados` decimal(4,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `empleados`
--

CREATE TABLE `empleados` (
  `id` int NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cedula` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_planilla` enum('Con Seguro','Sin Seguro') COLLATE utf8mb4_unicode_ci DEFAULT 'Con Seguro',
  `salario_bruto` decimal(10,2) DEFAULT '0.00',
  `inss_base` enum('Salario Completo','Salario Mínimo') COLLATE utf8mb4_unicode_ci DEFAULT 'Salario Completo',
  `ir_fijo` decimal(10,2) DEFAULT '0.00',
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Empleado',
  `planillas_acceso` json DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ingreso` date DEFAULT NULL,
  `ir_tipo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Sin IR',
  `empresa_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `empresas`
--

CREATE TABLE `empresas` (
  `id` int NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruc` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `logo` mediumtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `extras`
--

CREATE TABLE `extras` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `tipo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `monto` decimal(10,2) NOT NULL,
  `pagar_en` date DEFAULT NULL,
  `fecha_registro` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `historial_salarios`
--

CREATE TABLE `historial_salarios` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `salario_anterior` decimal(12,2) NOT NULL,
  `salario_nuevo` decimal(12,2) NOT NULL,
  `fecha` date NOT NULL,
  `usuario` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `liquidaciones`
--

CREATE TABLE `liquidaciones` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `empresa_id` int DEFAULT NULL,
  `fecha_baja` date NOT NULL,
  `motivo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Renuncia voluntaria',
  `salario_mensual` decimal(12,2) DEFAULT '0.00',
  `fecha_ingreso` date DEFAULT NULL,
  `anios_servicio` decimal(6,2) DEFAULT '0.00',
  `meses_servicio` decimal(6,2) DEFAULT '0.00',
  `dias_vacaciones` decimal(6,2) DEFAULT '0.00',
  `monto_vacaciones` decimal(12,2) DEFAULT '0.00',
  `meses_aguinaldo` decimal(4,2) DEFAULT '0.00',
  `monto_aguinaldo` decimal(12,2) DEFAULT '0.00',
  `aplica_indemnizacion` tinyint(1) DEFAULT '0',
  `monto_indemnizacion` decimal(12,2) DEFAULT '0.00',
  `aplica_preaviso` tinyint(1) DEFAULT '0',
  `dias_preaviso` int DEFAULT '0',
  `monto_preaviso` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) DEFAULT '0.00',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pagos_prestamos`
--

CREATE TABLE `pagos_prestamos` (
  `id` int NOT NULL,
  `prestamo_id` int NOT NULL,
  `fecha` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Abono directo',
  `concepto` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `planillas`
--

CREATE TABLE `planillas` (
  `id` int NOT NULL,
  `periodo` date NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `generado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Borrador',
  `total_bruto` decimal(12,2) DEFAULT '0.00',
  `total_deducciones` decimal(12,2) DEFAULT '0.00',
  `total_neto` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `empresa_id` int DEFAULT NULL,
  `folio` int DEFAULT NULL,
  `total_inss_patronal` decimal(12,2) DEFAULT '0.00',
  `total_inatec` decimal(12,2) DEFAULT '0.00',
  `costo_total_empresa` decimal(12,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prestamos`
--

CREATE TABLE `prestamos` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cuota_quincenal` decimal(10,2) NOT NULL,
  `cuotas_restantes` int DEFAULT '0',
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `fecha_inicio` date DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `historial_pagos` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `frecuencia` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Quincenal',
  `saldo_pendiente` decimal(12,2) DEFAULT NULL,
  `frecuencia_dia` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '15'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Planillero',
  `empleado_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planillas_acceso` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresas_acceso` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `password_hash`, `rol`, `empleado_id`, `created_at`, `nombre`, `planillas_acceso`, `empresas_acceso`) VALUES
(9, 'risosadmi@gmail.com', '$2a$10$hINfPxYmcxV1xLJFxZMHVeVNov7h3TBBa7UxKkhNUkAoyTv8kQbQC', 'Master', NULL, '2026-05-29 18:24:14', 'Administrador', NULL, NULL),
(10, 'anget3747@gmail.com', '$2a$10$kOz0MHsDncTuMHiqA6EamuOdpcltJA25qtW0D5/zMs2PwWOSHcApW', 'Empleado', NULL, '2026-06-01 19:49:40', 'Sol', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vacaciones`
--

CREATE TABLE `vacaciones` (
  `id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `tipo` enum('Pagadas','Días libres') COLLATE utf8mb4_unicode_ci DEFAULT 'Días libres',
  `dias` decimal(5,2) DEFAULT '0.00',
  `monto` decimal(10,2) DEFAULT '0.00',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `fecha_registro` date DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Aprobada'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adelantos`
--
ALTER TABLE `adelantos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `deducciones`
--
ALTER TABLE `deducciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `detalle_planilla`
--
ALTER TABLE `detalle_planilla`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_planilla_empleado` (`planilla_id`,`empleado_id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `extras`
--
ALTER TABLE `extras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `historial_salarios`
--
ALTER TABLE `historial_salarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `liquidaciones`
--
ALTER TABLE `liquidaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `pagos_prestamos`
--
ALTER TABLE `pagos_prestamos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `prestamo_id` (`prestamo_id`);

--
-- Indexes for table `planillas`
--
ALTER TABLE `planillas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `prestamos`
--
ALTER TABLE `prestamos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `vacaciones`
--
ALTER TABLE `vacaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adelantos`
--
ALTER TABLE `adelantos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deducciones`
--
ALTER TABLE `deducciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `detalle_planilla`
--
ALTER TABLE `detalle_planilla`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `extras`
--
ALTER TABLE `extras`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `historial_salarios`
--
ALTER TABLE `historial_salarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `liquidaciones`
--
ALTER TABLE `liquidaciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pagos_prestamos`
--
ALTER TABLE `pagos_prestamos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `planillas`
--
ALTER TABLE `planillas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prestamos`
--
ALTER TABLE `prestamos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `vacaciones`
--
ALTER TABLE `vacaciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `adelantos`
--
ALTER TABLE `adelantos`
  ADD CONSTRAINT `adelantos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

--
-- Constraints for table `deducciones`
--
ALTER TABLE `deducciones`
  ADD CONSTRAINT `deducciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

--
-- Constraints for table `detalle_planilla`
--
ALTER TABLE `detalle_planilla`
  ADD CONSTRAINT `detalle_planilla_ibfk_1` FOREIGN KEY (`planilla_id`) REFERENCES `planillas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_planilla_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

--
-- Constraints for table `extras`
--
ALTER TABLE `extras`
  ADD CONSTRAINT `extras_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

--
-- Constraints for table `historial_salarios`
--
ALTER TABLE `historial_salarios`
  ADD CONSTRAINT `historial_salarios_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `liquidaciones`
--
ALTER TABLE `liquidaciones`
  ADD CONSTRAINT `liquidaciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

--
-- Constraints for table `pagos_prestamos`
--
ALTER TABLE `pagos_prestamos`
  ADD CONSTRAINT `pagos_prestamos_ibfk_1` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamos` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prestamos`
--
ALTER TABLE `prestamos`
  ADD CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `vacaciones`
--
ALTER TABLE `vacaciones`
  ADD CONSTRAINT `vacaciones_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
