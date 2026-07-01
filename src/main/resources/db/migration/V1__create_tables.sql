-- Users table (all roles)
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       username VARCHAR(100) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       full_name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       role VARCHAR(50) NOT NULL,
                       badge_number VARCHAR(100),
                       station_code VARCHAR(100),
                       is_active BOOLEAN DEFAULT TRUE,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Citizens table (off-chain encrypted)
CREATE TABLE citizens (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          reference_number VARCHAR(100) NOT NULL UNIQUE,
                          full_name_encrypted TEXT NOT NULL,
                          dob_encrypted TEXT NOT NULL,
                          address_encrypted TEXT NOT NULL,
                          phone_encrypted TEXT NOT NULL,
                          email_encrypted TEXT NOT NULL,
                          id_proof_type VARCHAR(50) NOT NULL,
                          id_proof_number_encrypted TEXT NOT NULL,
                          record_hash VARCHAR(255) NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC requests table
CREATE TABLE kyc_requests (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              request_number VARCHAR(100) NOT NULL UNIQUE,
                              citizen_id UUID NOT NULL REFERENCES citizens(id),
                              assigned_officer_id UUID REFERENCES users(id),
                              status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                              verification_remarks_encrypted TEXT,
                              report_hash VARCHAR(255),
                              blockchain_tx_id VARCHAR(255),
                              submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              verified_at TIMESTAMP,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Antecedent verification table
CREATE TABLE antecedent_reports (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    report_number VARCHAR(100) NOT NULL UNIQUE,
                                    citizen_id UUID NOT NULL REFERENCES citizens(id),
                                    officer_id UUID REFERENCES users(id),
                                    fir_history_encrypted TEXT,
                                    conviction_status VARCHAR(50),
                                    pending_cases INTEGER DEFAULT 0,
                                    blacklist_flag BOOLEAN DEFAULT FALSE,
                                    overall_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                                    report_hash VARCHAR(255),
                                    blockchain_tx_id VARCHAR(255),
                                    digital_signature TEXT,
                                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Firearm applications table
CREATE TABLE firearm_applications (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                      application_number VARCHAR(100) NOT NULL UNIQUE,
                                      citizen_id UUID NOT NULL REFERENCES citizens(id),
                                      weapon_type VARCHAR(100) NOT NULL,
                                      purpose_encrypted TEXT NOT NULL,
                                      kyc_request_id UUID REFERENCES kyc_requests(id),
                                      antecedent_report_id UUID REFERENCES antecedent_reports(id),
                                      assigned_officer_id UUID REFERENCES users(id),
                                      licensing_authority_id UUID REFERENCES users(id),
                                      status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
                                      rejection_reason_encrypted TEXT,
                                      revocation_reason_encrypted TEXT,
                                      license_number VARCHAR(100),
                                      issue_date TIMESTAMP,
                                      expiry_date TIMESTAMP,
                                      revoked_at TIMESTAMP,
                                      report_hash VARCHAR(255),
                                      blockchain_tx_id VARCHAR(255),
                                      certificate_qr_path TEXT,
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Police records table (tamper-proof versioned)
CREATE TABLE police_records (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                record_id VARCHAR(100) NOT NULL,
                                version INTEGER NOT NULL DEFAULT 1,
                                record_type VARCHAR(100) NOT NULL,
                                content_encrypted TEXT NOT NULL,
                                previous_hash VARCHAR(255),
                                current_hash VARCHAR(255) NOT NULL,
                                action_type VARCHAR(50) NOT NULL,
                                action_reason_encrypted TEXT,
                                officer_id UUID REFERENCES users(id),
                                digital_signature TEXT,
                                blockchain_tx_id VARCHAR(255),
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            actor_id UUID REFERENCES users(id),
                            actor_role VARCHAR(50) NOT NULL,
                            action_type VARCHAR(100) NOT NULL,
                            resource_type VARCHAR(100) NOT NULL,
                            resource_id VARCHAR(255),
                            ip_address VARCHAR(50),
                            details_encrypted TEXT,
                            blockchain_tx_id VARCHAR(255),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates table
CREATE TABLE certificates (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              certificate_id VARCHAR(100) NOT NULL UNIQUE,
                              certificate_type VARCHAR(50) NOT NULL,
                              citizen_id UUID REFERENCES citizens(id),
                              reference_id UUID NOT NULL,
                              status VARCHAR(50) NOT NULL DEFAULT 'VALID',
                              issued_by UUID REFERENCES users(id),
                              issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              expiry_date TIMESTAMP,
                              qr_code_path TEXT,
                              document_hash VARCHAR(255),
                              blockchain_tx_id VARCHAR(255),
                              revoked_at TIMESTAMP,
                              revocation_reason TEXT,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_citizens_reference ON citizens(reference_number);
CREATE INDEX idx_kyc_citizen ON kyc_requests(citizen_id);
CREATE INDEX idx_kyc_status ON kyc_requests(status);
CREATE INDEX idx_antecedent_citizen ON antecedent_reports(citizen_id);
CREATE INDEX idx_firearm_citizen ON firearm_applications(citizen_id);
CREATE INDEX idx_firearm_status ON firearm_applications(status);
CREATE INDEX idx_police_record_id ON police_records(record_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_certificates_id ON certificates(certificate_id);