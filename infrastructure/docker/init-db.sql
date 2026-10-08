-- Database initialization for local development
-- Creates schemas per docs/16-data-architecture.md

CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema ownership per service
CREATE SCHEMA IF NOT EXISTS customer;
CREATE SCHEMA IF NOT EXISTS conversation;
CREATE SCHEMA IF NOT EXISTS case_management;
CREATE SCHEMA IF NOT EXISTS policy;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE SCHEMA IF NOT EXISTS workflow_reference;
CREATE SCHEMA IF NOT EXISTS notification;
