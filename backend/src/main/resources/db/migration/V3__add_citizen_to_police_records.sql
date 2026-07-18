ALTER TABLE police_records
    ADD COLUMN citizen_id UUID;

ALTER TABLE police_records
    ADD CONSTRAINT fk_police_records_citizen
    FOREIGN KEY (citizen_id) REFERENCES citizens(id);