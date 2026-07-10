ALTER TABLE users
    ADD COLUMN IF NOT EXISTS citizen_reference_number VARCHAR(100);