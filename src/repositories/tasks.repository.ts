import { pool } from "../db.js";

// Строка из `tasks` по умолчанию
export type TaskRowDb = {
    id: number;
    project_id: number;
    title: string;
    is_done: boolean;
    created_at: Date;
};

// Тело запроса на добавление таски
export type NewTaskInput = {
    title: string;
    is_done?: boolean;
};

// Тело запроса на обновление таски
export type UpdateTaskInput = {
    title: string;
    is_done: boolean;
};

// Тело запроса для фильтрации по ID проекта
export type TasksFilter = {
    project_id?: number;
};

// // Возврат всех тасок, либо по ID
// export async function getTasks(filter: TasksFilter = {}): Promise<TaskRowDb[]> {
//     const { project_id } = filter;
    
//     let sql = 'SELECT * FROM tasks';
//     const conditions: string[] = [];
//     const params: number[] = [];

//     if (project_id) {
//         conditions.push(` project_id = $${params.length + 1}`);
//         params.push(project_id);
//     }    

//     if (conditions.length > 0) {
//         sql += ` WHERE ${conditions.join(" AND ")}`;    // join(), если планируется масштабируемость
//     }

//     sql += ` ORDER BY id DESC`;

//     const { rows } = await pool.query<TaskRowDb>(sql, params);
//     return rows;
// }

// Возврат таски по ID
export async function getTasks(filter: TasksFilter = {}): Promise<TaskRowDb[]> {
    const { rows } = await pool.query<TaskRowDb>(
        'SELECT * FROM tasks WHERE project_id = COALESCE($1, project_id)', 
        [filter.project_id ?? null]
    );
    return rows;
}

// Добавление новой таски
export async function createTask(idNum: number, data: NewTaskInput): Promise<TaskRowDb> {
    const { rows } = await pool.query<TaskRowDb>(
        `INSERT INTO tasks (project_id, title, is_done)
         VALUES ($1, $2, COALESCE($3, false))
         RETURNING *`, 
        [idNum, data.title, data.is_done ?? null]    
    );
    return rows[0];
}

// Обновление таски
export async function updateTask(id: number, data: UpdateTaskInput): Promise<TaskRowDb | null> {
    const { rows } = await pool.query<TaskRowDb>(
        `UPDATE tasks SET title = $2, is_done = $3
         WHERE id = $1
         RETURNING *`,
        [id, data.title, data.is_done]
    );
    return rows[0] ?? null;
}

// Удаление таски
export async function deleteTaskById(id: number): Promise<boolean> {
    const result = await pool.query<TaskRowDb>(
        `DELETE FROM tasks WHERE id = $1`, [id]
    );
    return result.rowCount === 1;
}
