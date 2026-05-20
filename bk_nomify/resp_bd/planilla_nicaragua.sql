-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 20, 2026 at 09:14 PM
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
  `neto` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `rol` enum('Admin','Planillero','Empleado') COLLATE utf8mb4_unicode_ci DEFAULT 'Empleado',
  `planillas_acceso` json DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
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
-- Table structure for table `planillas`
--

CREATE TABLE `planillas` (
  `id` int NOT NULL,
  `periodo` date NOT NULL,
  `tipo` enum('Con Seguro','Sin Seguro') COLLATE utf8mb4_unicode_ci DEFAULT 'Con Seguro',
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `generado_por` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL
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
  `estado` enum('Activo','Saldado','Pausado') COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  `fecha_inicio` date DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `historial_pagos` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('Admin','Planillero','Empleado') COLLATE utf8mb4_unicode_ci DEFAULT 'Empleado',
  `empleado_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `password_hash`, `rol`, `empleado_id`, `created_at`) VALUES
(1, 'risosadmi@gmail.com', '$2a$10$vazd6lq7USa46G3kiwVrtOnIw7ygDMHYWXjgpgJukMSi5dIdtlwLq', 'Admin', NULL, '2026-05-20 19:30:25');

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
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
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
  ADD KEY `planilla_id` (`planilla_id`),
  ADD KEY `empleado_id` (`empleado_id`);

--
-- Indexes for table `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `extras`
--
ALTER TABLE `extras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleado_id` (`empleado_id`);

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
-- AUTO_INCREMENT for table `extras`
--
ALTER TABLE `extras`
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
