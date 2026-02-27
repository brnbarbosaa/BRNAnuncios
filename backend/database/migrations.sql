-- ============================================================
-- BRN Anúncios — Schema do Banco de Dados
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Fuso horário: America/Sao_Paulo (-03:00)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  icon VARCHAR(80) DEFAULT NULL COMMENT 'Nome do ícone (ex: store, restaurant)',
  color VARCHAR(20) DEFAULT '#6366f1',
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- USUÁRIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','client') NOT NULL DEFAULT 'client',
  phone VARCHAR(20) DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  active TINYINT(1) DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ANÚNCIOS / NEGÓCIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED DEFAULT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  short_description VARCHAR(300) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  logo VARCHAR(255) DEFAULT NULL COMMENT 'Caminho relativo: /uploads/{id}/logo.jpg',
  phone VARCHAR(20) DEFAULT NULL,
  whatsapp VARCHAR(20) DEFAULT NULL,
  email VARCHAR(180) DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  instagram VARCHAR(120) DEFAULT NULL,
  facebook VARCHAR(120) DEFAULT NULL,
  -- Endereço
  street VARCHAR(200) DEFAULT NULL,
  number VARCHAR(20) DEFAULT NULL,
  complement VARCHAR(100) DEFAULT NULL,
  neighborhood VARCHAR(100) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state CHAR(2) DEFAULT NULL,
  zip_code VARCHAR(10) DEFAULT NULL,
  -- Configurações
  tags VARCHAR(500) DEFAULT NULL COMMENT 'Palavras-chave separadas por vírgula',
  status ENUM('active','inactive','pending') NOT NULL DEFAULT 'pending',
  views INT UNSIGNED DEFAULT 0,
  featured TINYINT(1) DEFAULT 0,
  featured_order INT UNSIGNED DEFAULT NULL,
  plan ENUM('free','basic','premium') DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_business_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_business_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_featured ON businesses(featured);
CREATE FULLTEXT INDEX ft_businesses_search ON businesses(name, short_description, tags);

-- ------------------------------------------------------------
-- GALERIA DE IMAGENS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id INT UNSIGNED NOT NULL,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL COMMENT 'Caminho relativo: /uploads/{business_id}/gallery/...',
  caption VARCHAR(200) DEFAULT NULL,
  sort_order INT UNSIGNED DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_img_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- HORÁRIOS DE FUNCIONAMENTO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_hours (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id INT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Dom, 1=Seg ... 6=Sab',
  open_time TIME DEFAULT NULL,
  close_time TIME DEFAULT NULL,
  closed TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_hours_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_business_day (business_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- DESTAQUES (CARROSSEL E CARDS ROTATIVOS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS highlights (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id INT UNSIGNED NOT NULL,
  type ENUM('carousel','card') NOT NULL DEFAULT 'card',
  title VARCHAR(200) DEFAULT NULL,
  subtitle VARCHAR(300) DEFAULT NULL,
  banner_image VARCHAR(255) DEFAULT NULL,
  sort_order INT UNSIGNED DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  starts_at DATETIME DEFAULT NULL,
  ends_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_highlight_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- SOLICITAÇÕES DE CADASTRO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- Dados do solicitante
  contact_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(180) NOT NULL,
  contact_phone VARCHAR(20) DEFAULT NULL,
  -- Dados do negócio
  business_name VARCHAR(200) NOT NULL,
  category_id INT UNSIGNED DEFAULT NULL,
  short_description VARCHAR(300) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  whatsapp VARCHAR(20) DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  instagram VARCHAR(120) DEFAULT NULL,
  facebook VARCHAR(120) DEFAULT NULL,
  street VARCHAR(200) DEFAULT NULL,
  number VARCHAR(20) DEFAULT NULL,
  complement VARCHAR(100) DEFAULT NULL,
  neighborhood VARCHAR(100) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state CHAR(2) DEFAULT NULL,
  zip_code VARCHAR(10) DEFAULT NULL,
  -- Controle
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT NULL,
  reviewed_by INT UNSIGNED DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_request_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_request_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- LOGS DO SISTEMA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  user_name VARCHAR(150) DEFAULT NULL COMMENT 'Nome no momento do log',
  action VARCHAR(100) NOT NULL COMMENT 'Ex: LOGIN, CREATE_BUSINESS, DELETE_USER',
  entity VARCHAR(60) DEFAULT NULL COMMENT 'Ex: business, user, request',
  entity_id INT UNSIGNED DEFAULT NULL,
  details JSON DEFAULT NULL COMMENT 'Dados extras do evento',
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  level ENUM('info','warning','error','success') DEFAULT 'info',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_log_action (action),
  INDEX idx_log_level (level),
  INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- CONFIGURAÇÕES DO SISTEMA (KEY-VALUE)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT DEFAULT NULL,
  description VARCHAR(300) DEFAULT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurações padrão
INSERT INTO settings (`key`, `value`, `description`) VALUES
  ('site_name', 'BRN Anúncios', 'Nome do site'),
  ('site_slogan', 'Descubra os melhores negócios do seu bairro', 'Slogan exibido na home'),
  ('contact_email', '', 'E-mail de contato do site'),
  ('ads_per_page', '12', 'Quantidade de anúncios por página'),
  ('carousel_interval', '5000', 'Intervalo do carrossel em ms'),
  ('highlight_cards_count', '8', 'Quantidade de cards de destaque visíveis');
