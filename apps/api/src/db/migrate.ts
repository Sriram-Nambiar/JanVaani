import { getDbPool } from './client.js';

export async function runDatabaseMigrations(): Promise<{ success: boolean; appliedTables: string[]; error?: string }> {
  const pool = getDbPool();
  const appliedTables: string[] = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Application Status Records with JSONB timeline & audit findings
    await client.query(`
      CREATE TABLE IF NOT EXISTS application_status_records (
        ack_number VARCHAR(64) PRIMARY KEY,
        scheme_id VARCHAR(64),
        scheme_name_kn TEXT NOT NULL,
        scheme_name_en TEXT NOT NULL,
        applicant_name TEXT NOT NULL,
        aadhaar_masked VARCHAR(32),
        current_stage_kn TEXT NOT NULL,
        current_stage_en TEXT NOT NULL,
        timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
        spoken_notification_kn TEXT,
        spoken_notification_en TEXT,
        is_ready_for_download BOOLEAN DEFAULT FALSE,
        audit_findings JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    appliedTables.push('application_status_records');

    // 2. Jana Spandana Grievance Dockets with JSONB timeline
    await client.query(`
      CREATE TABLE IF NOT EXISTS grievance_dockets (
        docket_number VARCHAR(64) PRIMARY KEY,
        ack_number VARCHAR(64),
        applicant_name TEXT NOT NULL,
        phone VARCHAR(32) NOT NULL,
        district VARCHAR(64) NOT NULL,
        department VARCHAR(64) NOT NULL,
        grievance_category VARCHAR(64) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(32) NOT NULL,
        assigned_officer TEXT NOT NULL,
        sla_days INT NOT NULL DEFAULT 7,
        timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
        resolution_text_kn TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    appliedTables.push('grievance_dockets');

    // 3. Citizen Conversation Draft Sessions with JSONB form slots
    await client.query(`
      CREATE TABLE IF NOT EXISTS citizen_draft_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        phone_hash VARCHAR(64) NOT NULL,
        scheme_id VARCHAR(64) NOT NULL,
        current_state VARCHAR(32) NOT NULL DEFAULT 'COLLECTING',
        form_slots JSONB NOT NULL DEFAULT '{}'::jsonb,
        confidence_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
        missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
        consent_given BOOLEAN DEFAULT FALSE,
        consent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    appliedTables.push('citizen_draft_sessions');

    // 4. Background Job Queue Records with JSONB payload/result
    await client.query(`
      CREATE TABLE IF NOT EXISTS background_job_records (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        progress INT NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        result JSONB DEFAULT '{}'::jsonb
      );
    `);
    appliedTables.push('background_job_records');

    // Indexes for fast lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_status_scheme ON application_status_records (scheme_id);
      CREATE INDEX IF NOT EXISTS idx_grievance_status ON grievance_dockets (status);
      CREATE INDEX IF NOT EXISTS idx_draft_phone ON citizen_draft_sessions (phone_hash);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON background_job_records (status);
    `);

    await client.query('COMMIT');
    return { success: true, appliedTables };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, appliedTables, error: err.message || 'Migration failed' };
  } finally {
    client.release();
  }
}
