import { pool } from "../db.js";

/**
Строка из таблицы `projects` в том виде, как ее возвращает драйвер `pg` по умолчанию.
Ожидаем именно такой тип объекта.
Важно: Колонка `created_at` имеет тип TIMESTAMPTZ, и `pg` парсит его в JS `Date`.
Поэтому типизируем как Date.
*/
export type ProjectRowDb = {
    id: number;
    name: string;
    description: string;
    status: "todo" | "in_progress" | "done";
    created_at: Date;
};

/**
Тело запроса при создании проекта (payload клиента).
description/status можно не передавать - мы подставим запасные значения
через COALESCE.
*/
export type NewProjectInput = {
    name: string;
    description?: string;
    status?: "todo" | "in_progress" | "done";
};

/**
Тело запроса при обновлении проекта через PUT.
Для "настоящего" PUT ожидаем полную замену ресурса - все поля обязательны.
*/
export type UpdateProjectInput = {
    name: string;
    description: string;
    status: "todo" | "in_progress" | "done";
};

/**
Фильтр списка через query-параметры.
name - подстрочный (ILIKE) поиск по названию, регистронезависимо.
*/
export type ProjectFilter = {
    name?: string;
    status?: "todo" | "in_progress" | "done";
};

// Список весь, или отфильтрованный по подстройке: либо name (ILIKE), либо status.
export async function listProject(filter: ProjectFilter = {}): Promise<ProjectRowDb[]> {
    const { name, status } = filter;
    let sql = "SELECT * FROM projects";
    const conditions: string[] = [];
    const params: string[] = [];

    if (name) {
        conditions.push(` name ILIKE $${params.length + 1}`);
        params.push(`%${name}%`);
    }

    if (status) {
        conditions.push(` status = $${params.length + 1}`);
        params.push(status);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY id DESC";

    const { rows } = await pool.query<ProjectRowDb>(sql, params);
    return rows;
}

// Создание проекта.
export async function createProject(data: NewProjectInput): Promise<ProjectRowDb> {
    const { rows } = await pool.query<ProjectRowDb>(
        `INSERT INTO projects (name, description, status)
         VALUES ($1, COALESCE($2, ''), COALESCE($3, 'todo'))
         RETURNING id, name, description, status, created_at`,
        [data.name, data.description ?? null, data.status ?? null]
    );
    return rows[0];
}

// Получить один проект по id. Если нет - вернем null.
export async function getProjectById(id: number): Promise<ProjectRowDb | null> {
    const { rows } = await pool.query<ProjectRowDb>(
        `SELECT * FROM projects WHERE id = $1`,
        [id]
    );
    return rows[0] ?? null;
}


// Обновление проекта через PUT (полная замена).
// Если строка не найдена (0 rows) - вернем null.
export async function updateProject(
    id: number, 
    data: UpdateProjectInput
): Promise<ProjectRowDb | null> {
    const { rows } = await pool.query<ProjectRowDb>(
        `UPDATE projects SET name = $2, description = $3, status = $4
         WHERE id = $1
         RETURNING *`,
        [id, data.name, data.description, data.status]
    );
    return rows[0] ?? null;
}

// Удаление по id. Возвращает true, если удалили ровно одну строку.
export async function deleteProject(id: number): Promise<boolean> {
    const res = await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
    return res.rowCount === 1;
}
