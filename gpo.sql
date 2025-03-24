-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Mar 24, 2025 alle 17:59
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gpo`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `dati`
--

CREATE TABLE `dati` (
  `id` int(10) UNSIGNED NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  `co2` int(11) DEFAULT NULL,
  `pm10` int(11) DEFAULT NULL,
  `pm2.5` int(11) DEFAULT NULL,
  `idMicro` char(17) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `dati`
--

INSERT INTO `dati` (`id`, `timestamp`, `co2`, `pm10`, `pm2.5`, `idMicro`, `latitude`, `longitude`) VALUES
(3, '2025-03-24 15:47:55', 420, 25, 15, '00:11:22:33:44:55', 45.4642, 9.19);

-- --------------------------------------------------------

--
-- Struttura della tabella `micro`
--

CREATE TABLE `micro` (
  `mac` char(17) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `dataAvvio` timestamp NULL DEFAULT current_timestamp(),
  `attivo` bit(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `micro`
--

INSERT INTO `micro` (`mac`, `latitude`, `longitude`, `dataAvvio`, `attivo`) VALUES
('00:11:22:33:44:55', 45.4642, 9.19, '2025-03-24 15:47:27', b'1');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `dati`
--
ALTER TABLE `dati`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk1` (`idMicro`);

--
-- Indici per le tabelle `micro`
--
ALTER TABLE `micro`
  ADD PRIMARY KEY (`mac`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `dati`
--
ALTER TABLE `dati`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `dati`
--
ALTER TABLE `dati`
  ADD CONSTRAINT `fk1` FOREIGN KEY (`idMicro`) REFERENCES `micro` (`mac`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
