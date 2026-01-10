import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlite = sqlite3.verbose();

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        name TEXT,
        password_hash TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user')) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // 2. Cases Table
        db.run(`CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            system_prompt TEXT,
            config JSON,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration Check: Add image_url if it doesn't exist
        db.all("PRAGMA table_info(cases)", (err, rows) => {
            if (rows && !rows.find(r => r.name === 'image_url')) {
                db.run("ALTER TABLE cases ADD COLUMN image_url TEXT");
            }
        });

        // 3. Sessions Table
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER,
            user_id INTEGER,
            student_name TEXT,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            duration INTEGER,
            FOREIGN KEY(case_id) REFERENCES cases(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

    // Migration Check: Add user_id, end_time, duration to sessions if they don't exist
    db.all("PRAGMA table_info(sessions)", (err, rows) => {
        if (rows) {
            if (!rows.find(r => r.name === 'user_id')) {
                db.run("ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id)");
            }
            if (!rows.find(r => r.name === 'end_time')) {
                db.run("ALTER TABLE sessions ADD COLUMN end_time DATETIME");
            }
            if (!rows.find(r => r.name === 'duration')) {
                db.run("ALTER TABLE sessions ADD COLUMN duration INTEGER");
            }
        }
    });

    // Migration Check: Add name to users if it doesn't exist
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (rows && !rows.find(r => r.name === 'name')) {
            db.run("ALTER TABLE users ADD COLUMN name TEXT", (err) => {
                if (err) console.error("Error adding name column:", err);
                else console.log("Added 'name' column to users table");
            });
        }
    });

        // 4. Interactions Table (Chat Logs)
        db.run(`CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            role TEXT CHECK(role IN ('user', 'assistant', 'system')),
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )`);

        // 5. Login Logs Table - Track all login/logout events
        db.run(`CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT CHECK(action IN ('login', 'logout', 'failed_login')) NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // 6. Settings Logs Table - Track all settings changes
        db.run(`CREATE TABLE IF NOT EXISTS settings_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id INTEGER,
            case_id INTEGER,
            setting_type TEXT CHECK(setting_type IN ('llm', 'monitor', 'case_load')) NOT NULL,
            setting_name TEXT,
            old_value TEXT,
            new_value TEXT,
            settings_json JSON,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            FOREIGN KEY(case_id) REFERENCES cases(id)
        )`);

        // 7. Session Settings Table - Link settings to sessions
        db.run(`CREATE TABLE IF NOT EXISTS session_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            case_id INTEGER,
            user_id INTEGER,
            llm_provider TEXT,
            llm_model TEXT,
            llm_base_url TEXT,
            monitor_hr INTEGER,
            monitor_rhythm TEXT,
            monitor_spo2 INTEGER,
            monitor_bp_sys INTEGER,
            monitor_bp_dia INTEGER,
            monitor_rr INTEGER,
            monitor_temp REAL,
            settings_snapshot JSON,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            FOREIGN KEY(case_id) REFERENCES cases(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Migration: Add monitor_settings to sessions table
        db.all("PRAGMA table_info(sessions)", (err, rows) => {
            if (rows && !rows.find(r => r.name === 'monitor_settings')) {
                db.run("ALTER TABLE sessions ADD COLUMN monitor_settings JSON");
            }
            if (rows && !rows.find(r => r.name === 'llm_settings')) {
                db.run("ALTER TABLE sessions ADD COLUMN llm_settings JSON");
            }
        });

        // 8. Event Log Table - Chronological event tracking
        db.run(`CREATE TABLE IF NOT EXISTS event_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            event_type TEXT,
            description TEXT,
            vital_sign TEXT,
            old_value TEXT,
            new_value TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )`);

        // 9. Alarm Events Table - Track alarm triggers and acknowledgments
        db.run(`CREATE TABLE IF NOT EXISTS alarm_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            vital_sign TEXT,
            threshold_type TEXT,
            threshold_value REAL,
            actual_value REAL,
            triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            acknowledged_at DATETIME,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )`);

        // 10. Alarm Config Table - User-specific alarm thresholds
        db.run(`CREATE TABLE IF NOT EXISTS alarm_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            vital_sign TEXT,
            high_threshold REAL,
            low_threshold REAL,
            enabled BOOLEAN DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // 11. Case Investigations Table - Labs/Radiology per case
        db.run(`CREATE TABLE IF NOT EXISTS case_investigations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER,
            investigation_type TEXT,
            test_name TEXT,
            result_data JSON,
            image_url TEXT,
            turnaround_minutes INTEGER DEFAULT 30,
            FOREIGN KEY(case_id) REFERENCES cases(id)
        )`);

        // Migration: Add lab database columns to case_investigations
        db.all("PRAGMA table_info(case_investigations)", (err, rows) => {
            if (rows) {
                if (!rows.find(r => r.name === 'test_group')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN test_group TEXT");
                }
                if (!rows.find(r => r.name === 'gender_category')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN gender_category TEXT");
                }
                if (!rows.find(r => r.name === 'min_value')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN min_value REAL");
                }
                if (!rows.find(r => r.name === 'max_value')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN max_value REAL");
                }
                if (!rows.find(r => r.name === 'current_value')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN current_value REAL");
                }
                if (!rows.find(r => r.name === 'unit')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN unit TEXT");
                }
                if (!rows.find(r => r.name === 'normal_samples')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN normal_samples JSON");
                }
                if (!rows.find(r => r.name === 'is_abnormal')) {
                    db.run("ALTER TABLE case_investigations ADD COLUMN is_abnormal BOOLEAN DEFAULT 0");
                }
            }
        });

        // 12. Investigation Orders Table - Track ordered tests
        db.run(`CREATE TABLE IF NOT EXISTS investigation_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            investigation_id INTEGER,
            ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            available_at DATETIME,
            viewed_at DATETIME,
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            FOREIGN KEY(investigation_id) REFERENCES case_investigations(id)
        )`);

        // Migration: Add scenario column to cases table
        db.all("PRAGMA table_info(cases)", (err, rows) => {
            if (rows && !rows.find(r => r.name === 'scenario')) {
                db.run("ALTER TABLE cases ADD COLUMN scenario JSON");
            }
            // Migration: Add is_available and is_default columns for student access control
            if (rows && !rows.find(r => r.name === 'is_available')) {
                db.run("ALTER TABLE cases ADD COLUMN is_available BOOLEAN DEFAULT 0", (err) => {
                    if (!err) console.log("Added 'is_available' column to cases table");
                });
            }
            if (rows && !rows.find(r => r.name === 'is_default')) {
                db.run("ALTER TABLE cases ADD COLUMN is_default BOOLEAN DEFAULT 0", (err) => {
                    if (!err) console.log("Added 'is_default' column to cases table");
                });
            }
        });

        // 14. Platform Settings Table - Admin configuration
        db.run(`CREATE TABLE IF NOT EXISTS platform_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            updated_by INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(updated_by) REFERENCES users(id)
        )`);

        // 13. Scenarios Repository Table - Reusable scenario templates
        db.run(`CREATE TABLE IF NOT EXISTS scenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            duration_minutes INTEGER NOT NULL,
            category TEXT,
            timeline JSON NOT NULL,
            created_by INTEGER,
            is_public BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);

        // Learning Analytics Events Table - Comprehensive interaction tracking
        db.run(`CREATE TABLE IF NOT EXISTS learning_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            user_id INTEGER,
            case_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

            -- xAPI-style action verbs
            verb TEXT NOT NULL,

            -- Object being acted upon
            object_type TEXT NOT NULL,
            object_id TEXT,
            object_name TEXT,

            -- Context
            component TEXT,
            parent_component TEXT,

            -- Result/Details
            result TEXT,
            duration_ms INTEGER,

            -- Additional context as JSON
            context JSON,

            -- Chat content (when verb is SENT_MESSAGE or RECEIVED_MESSAGE)
            message_content TEXT,
            message_role TEXT,

            -- Foreign keys
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(case_id) REFERENCES cases(id)
        )`);

        // Create index for efficient querying
        db.run(`CREATE INDEX IF NOT EXISTS idx_learning_events_session ON learning_events(session_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_learning_events_user ON learning_events(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_learning_events_verb ON learning_events(verb)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_learning_events_timestamp ON learning_events(timestamp)`);

        console.log('Database tables initialized with comprehensive logging and scenario repository.');
    });
}

export default db;
