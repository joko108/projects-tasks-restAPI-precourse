import { pool } from "./db.js";

async function init() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'todo',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT projects_status_check CHECK (status IN ('todo','in_progress','done'))
            );`
        );

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL NOT NULL PRIMARY KEY,
                project_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                is_done BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );`
        );
        console.log('✅ Таблицы созданы или уже существуют.')
    } catch (err) {
        console.error(`❌ Ошибка создания таблицы: ${err}`);
    } finally {
        await pool.end();
    }
}

init();
