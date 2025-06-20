-- database/schema.sql

-- 1. Dashboard metrics table
CREATE TABLE dashboard_metrics (
    id SERIAL PRIMARY KEY,
    reporting_period VARCHAR(20) NOT NULL,
    facilities_reporting INTEGER NOT NULL,
    completeness INTEGER NOT NULL,
    timeliness INTEGER NOT NULL,
    active_users INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Training materials table
CREATE TABLE training_materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
