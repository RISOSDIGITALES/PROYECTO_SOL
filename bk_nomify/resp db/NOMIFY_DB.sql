-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 25, 2026 at 09:05 PM
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

--
-- Dumping data for table `adelantos`
--

INSERT INTO `adelantos` (`id`, `empleado_id`, `monto`, `descontar_en`, `estado`, `pausado`, `fecha_registro`, `notas`, `created_at`) VALUES
(1, 1, '1500.00', '2026-05-30', 'Pendiente', 1, '2026-05-22', NULL, '2026-05-22 14:41:48'),
(2, 2, '100.00', '2026-05-29', 'Pendiente', 0, '2026-05-22', NULL, '2026-05-22 21:01:48');

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
  `total_deducciones` decimal(12,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `detalle_planilla`
--

INSERT INTO `detalle_planilla` (`id`, `planilla_id`, `empleado_id`, `salario_quincenal`, `inss`, `ir`, `deducciones_prestamos`, `deducciones_adelantos`, `deducciones_otras`, `extras`, `vacaciones_pagadas`, `neto`, `periodo`, `tipo_planilla`, `desc_prestamo`, `desc_adelanto`, `desc_deducciones`, `total_deducciones`) VALUES
(5, 7, 1, '6000.00', '420.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '4380.00', '2026-05-31', 'Con Seguro', '1200.00', '0.00', '0.00', '1620.00'),
(6, 7, 2, '7000.00', '490.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '6510.00', '2026-05-31', 'Con Seguro', '0.00', '0.00', '0.00', '490.00'),
(7, 7, 3, '5000.00', '0.00', '0.00', '0.00', '0.00', '0.00', '500.00', '0.00', '5500.00', '2026-05-31', 'Sin Seguro', '0.00', '0.00', '0.00', '0.00'),
(8, 8, 3, '5000.00', '0.00', '0.00', '0.00', '0.00', '0.00', '500.00', '0.00', '5500.00', '2026-05-31', 'Sin Seguro', '0.00', '0.00', '0.00', '0.00'),
(9, 9, 1, '6000.00', '420.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '4380.00', '2026-05-31', 'Con Seguro', '1200.00', '0.00', '0.00', '1620.00'),
(10, 9, 2, '7000.00', '490.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '6510.00', '2026-05-31', 'Con Seguro', '0.00', '0.00', '0.00', '490.00');

-- --------------------------------------------------------

--
-- Table structure for table `empleados`
--

CREATE TABLE `empleados` (
  `id` int NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
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

--
-- Dumping data for table `empleados`
--

INSERT INTO `empleados` (`id`, `nombre`, `cargo`, `tipo_planilla`, `salario_bruto`, `inss_base`, `ir_fijo`, `email`, `rol`, `planillas_acceso`, `activo`, `created_at`, `fecha_ingreso`, `ir_tipo`, `empresa_id`) VALUES
(1, 'Solange Carolina Torrez Perez', 'RONE', 'Con Seguro', '12000.00', 'Salario Mínimo', NULL, 'anget3747@gmail.com', 'Empleado', NULL, 1, '2026-05-22 14:13:48', '2026-01-12', 'Sin IR', 1),
(2, 'Karla Falcon', 'counter', 'Con Seguro', '14000.00', 'Salario Completo', NULL, 'anget3747@gmail.com', 'Empleado', NULL, 1, '2026-05-22 20:53:50', '2025-03-21', 'Sin IR', 2),
(3, 'NIDIA GOMEZ', 'limpieza', 'Sin Seguro', '10000.00', 'Salario Completo', NULL, NULL, 'Empleado', NULL, 1, '2026-05-23 13:13:43', '2024-06-13', 'Sin IR', 1);

-- --------------------------------------------------------

--
-- Table structure for table `empresas`
--

CREATE TABLE `empresas` (
  `id` int NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `empresas`
--

INSERT INTO `empresas` (`id`, `nombre`, `created_at`) VALUES
(1, 'RISOS DIGITALES', '2026-05-25 20:23:56'),
(2, 'CRATING EXPRESS', '2026-05-25 20:36:05');

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

--
-- Dumping data for table `extras`
--

INSERT INTO `extras` (`id`, `empleado_id`, `tipo`, `descripcion`, `monto`, `pagar_en`, `fecha_registro`, `created_at`) VALUES
(1, 1, 'Bono', 'buen desempeño', '2000.00', '2026-05-30', NULL, '2026-05-22 14:42:27'),
(2, 3, 'Feriado trabajado', 'Día de las Madres', '500.00', '2026-05-31', NULL, '2026-05-23 13:20:54');

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

--
-- Dumping data for table `pagos_prestamos`
--

INSERT INTO `pagos_prestamos` (`id`, `prestamo_id`, `fecha`, `monto`, `tipo`, `concepto`, `created_at`) VALUES
(1, 1, '2026-05-22', '800.00', 'Abono directo', 'abono1', '2026-05-22 15:44:51'),
(2, 1, '2026-05-22', '500.00', 'Abono directo', 'abono2', '2026-05-22 19:17:22'),
(3, 1, '2026-05-31', '1200.00', 'Quincena', 'Planilla 2026-05-31', '2026-05-22 20:59:10'),
(4, 1, '2026-05-31', '1200.00', 'Quincena', 'Planilla 2026-05-31', '2026-05-23 14:29:21'),
(5, 1, '2026-05-31', '1200.00', 'Quincena', 'Planilla 2026-05-31', '2026-05-23 19:29:27');

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
  `empresa_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `planillas`
--

INSERT INTO `planillas` (`id`, `periodo`, `tipo`, `fecha_generacion`, `generado_por`, `estado`, `total_bruto`, `total_deducciones`, `total_neto`, `created_at`, `empresa_id`) VALUES
(7, '2026-05-31', '', '2026-05-23 14:29:21', NULL, 'Borrador', '18500.00', '2110.00', '16390.00', '2026-05-23 14:29:21', NULL),
(8, '2026-05-31', 'Sin Seguro', '2026-05-23 19:29:14', NULL, 'Borrador', '5500.00', '0.00', '5500.00', '2026-05-23 19:29:14', NULL),
(9, '2026-05-31', 'Con Seguro', '2026-05-23 19:29:27', NULL, 'Borrador', '13000.00', '2110.00', '10890.00', '2026-05-23 19:29:27', NULL);

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

--
-- Dumping data for table `prestamos`
--

INSERT INTO `prestamos` (`id`, `empleado_id`, `monto_total`, `cuota_quincenal`, `cuotas_restantes`, `estado`, `fecha_inicio`, `notas`, `historial_pagos`, `created_at`, `frecuencia`, `saldo_pendiente`, `frecuencia_dia`) VALUES
(1, 1, '5000.00', '1200.00', 1, 'Activo', NULL, NULL, NULL, '2026-05-22 14:20:52', 'Quincenal', '100.00', '15'),
(2, 2, '5000.00', '2000.00', 3, 'Suspendido', NULL, NULL, NULL, '2026-05-22 21:00:45', 'Mensual', '5000.00', 'Fin');

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
(1, 'risosadmi@gmail.com', '$2a$10$vazd6lq7USa46G3kiwVrtOnIw7ygDMHYWXjgpgJukMSi5dIdtlwLq', 'Admin', NULL, '2026-05-20 19:30:25', NULL, NULL, NULL),
(8, 'anget3747@gmail.com', '$2a$10$pdWPkaotKXfc9wfzCSjnF.ev/NBCBM6TrWNaazwc88NzZA40aAH0m', 'Empleado', 2, '2026-05-23 19:31:05', 'Karla Falcon', NULL, NULL);

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
-- Dumping data for table `vacaciones`
--

INSERT INTO `vacaciones` (`id`, `empleado_id`, `tipo`, `dias`, `monto`, `fecha_inicio`, `fecha_fin`, `fecha_registro`, `notas`, `created_at`, `estado`) VALUES
(1, 3, 'Pagadas', '5.00', '1550.00', '2026-05-25', '2026-05-29', '2026-05-23', 'Vacaciones pagadas', '2026-05-23 13:25:50', 'Aprobada'),
(2, 3, 'Pagadas', '20.00', '6200.00', '2026-01-05', '2026-01-30', '2026-05-23', 'Vacaciones pagadas', '2026-05-23 13:26:46', 'Aprobada'),
(3, 3, 'Pagadas', '22.00', '6820.00', '2026-04-01', '2026-04-30', '2026-05-23', NULL, '2026-05-23 13:27:14', 'Aprobada'),
(4, 2, 'Pagadas', '15.00', '6510.00', '2026-05-03', '2026-05-23', '2026-05-23', 'Vacaciones pagadas', '2026-05-23 13:27:56', 'Aprobada'),
(5, 3, 'Pagadas', '12.00', '3720.00', '2026-03-10', '2026-03-25', '2026-05-23', 'Vacaciones pagadas', '2026-05-23 14:27:27', 'Aprobada');

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
  ADD KEY `planilla_id` (`planilla_id`),
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `deducciones`
--
ALTER TABLE `deducciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `detalle_planilla`
--
ALTER TABLE `detalle_planilla`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `extras`
--
ALTER TABLE `extras`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `pagos_prestamos`
--
ALTER TABLE `pagos_prestamos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `planillas`
--
ALTER TABLE `planillas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `prestamos`
--
ALTER TABLE `prestamos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vacaciones`
--
ALTER TABLE `vacaciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
