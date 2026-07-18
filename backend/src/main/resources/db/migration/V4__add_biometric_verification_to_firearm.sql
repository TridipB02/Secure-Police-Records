ALTER TABLE firearm_applications
    ADD COLUMN biometric_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE firearm_applications
    ADD COLUMN biometric_verified_at TIMESTAMP;