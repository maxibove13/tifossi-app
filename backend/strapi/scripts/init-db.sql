-- Database initialization script for Tifossi development
-- This script runs when the PostgreSQL container starts for the first time

-- Ensure the database and user exist
CREATE DATABASE IF NOT EXISTS tifossi_dev;
CREATE USER IF NOT EXISTS strapi WITH PASSWORD 'strapi123';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tifossi_dev TO strapi;
GRANT ALL ON SCHEMA public TO strapi;

-- Set up extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- Create indexes for common queries (will be created by Strapi migrations)
-- These are just examples - Strapi will manage the actual schema

COMMENT ON DATABASE tifossi_dev IS 'Tifossi E-commerce Development Database';