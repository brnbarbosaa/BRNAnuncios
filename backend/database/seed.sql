-- ============================================================
-- BRN Anúncios — Seed Inicial
-- Admin: bruno.barbosa@brnsolution.com.br / 123456
-- ATENÇÃO: Execute migrations.sql antes deste script!
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- Admin developer (senha: 123456 — hash bcrypt rounds=12)
-- Hash gerado para: 123456
INSERT INTO users (name, email, password_hash, role, active) VALUES (
  'Bruno Barbosa',
  'bruno.barbosa@brnsolution.com.br',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz0TsolorzYfJfHjLkmGJSh9V.UVwQy',
  'admin',
  1
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Categorias iniciais
INSERT INTO categories (name, slug, icon, color) VALUES
  ('Alimentação',       'alimentacao',       'restaurant',    '#f59e0b'),
  ('Saúde & Beleza',    'saude-beleza',      'spa',           '#ec4899'),
  ('Educação',          'educacao',          'school',        '#6366f1'),
  ('Comércio',          'comercio',          'store',         '#10b981'),
  ('Serviços',          'servicos',          'build',         '#3b82f6'),
  ('Entretenimento',    'entretenimento',    'movie',         '#8b5cf6'),
  ('Automotivo',        'automotivo',        'directions_car','#ef4444'),
  ('Animais de Estimação','animais-estimacao','pets',         '#f97316'),
  ('Imóveis',           'imoveis',           'home',          '#14b8a6'),
  ('Tecnologia',        'tecnologia',        'computer',      '#0ea5e9')
ON DUPLICATE KEY UPDATE name = VALUES(name);
