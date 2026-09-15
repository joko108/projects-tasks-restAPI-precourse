import express, { Request, Response } from "express";
import cors from "cors";
import {
    listProject,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    ProjectFilter,
    NewProjectInput,
    UpdateProjectInput
} from "./repositories/projects.repository.js";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTaskById,
    NewTaskInput,
    UpdateTaskInput,
} from "./repositories/tasks.repository.js";
import { getProjectWithTasksJoin } from "./repositories/project-with-tasks.repository.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

const HTTP = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    NOT_FOUND: 404
} as const;

app.use(express.json());
app.use(cors());

// Пинг
app.get("/", (_req: Request, res: Response) => {
    res.status(HTTP.OK).json({ message: "Project API is up" });
});

// GET /project?name=...&status=...
app.get("/projects", async (req: Request, res: Response) => {
    const { name, status } = req.query as ProjectFilter;
    const rows = await listProject({ name, status });
    res.status(HTTP.OK).json(rows);
});

// GET /project/:id
app.get("/projects/:id", async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid project ID" });
        return;
    }

    const row = await getProjectById(idNum);    
    if (!row) {
        res.sendStatus(HTTP.NOT_FOUND);
        return;
    }

    res.status(HTTP.OK).json(row);
});

// POST /project
app.post("/projects", async (req: Request, res: Response) => {
    const { name, description, status } = req.body as NewProjectInput;
    if (!name) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Name is required" });
        return;
    }

    const created = await createProject({ name, description, status });
    res.status(HTTP.CREATED).json(created);
});

// PUT /project/:id
app.put("/projects/:id", async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);    
    if (!Number.isFinite(idNum) || idNum <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid project ID" });
        return;
    }

    const { name, description, status } = req.body as UpdateProjectInput;    
    if (!name || !description || !status) {
        res.status(HTTP.BAD_REQUEST).json({ error: "name, description, status are required" });
        return;
    }

    const updated = await updateProject(idNum, { name: name.trim(), description, status });    
    if (!updated) {
        res.status(HTTP.NOT_FOUND);
        return;
    }

    res.status(HTTP.OK).json(updated);
});

// DELETE /project/:id
app.delete("/projects/:id", async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid project ID" });
        return;
    }

    const ok = await deleteProject(idNum);
    if (!ok) {
        res.sendStatus(HTTP.NOT_FOUND);
        return;
    }

    res.sendStatus(HTTP.NO_CONTENT);
});

/*
---------------------------------------------------------------------------------
*/

// POST /projects/:projectId/tasks
app.post('/projects/:projectId/tasks', async (req: Request, res: Response) => {
    const { title, is_done } = req.body as NewTaskInput;
    const project_id = Number(req.params.projectId);

    if (!project_id || !title) {
        res
            .sendStatus(HTTP.BAD_REQUEST)
            .json({ error: "project_id, title are required" });
        return;
    }

    if (!Number.isFinite(project_id) || project_id <= 0) {
        res
            .status(HTTP.BAD_REQUEST)
            .json({ error: "Invalid project ID to Tasks" });
        return;
    }

    const create = await createTask(project_id, { title, is_done });
    res.status(HTTP.CREATED).json(create);
});

// GET /projects/:projectId/tasks
app.get('/projects/:projectId/tasks', async (req: Request, res: Response) => {
    const project_id = Number(req.params.projectId);
    if (!Number.isFinite(project_id) || project_id <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid project ID to Tasks" });
        return;
    }

    const rows = await getTasks({ project_id });
    if (!rows) {
        res.sendStatus(HTTP.NOT_FOUND);
        return;
    }

    res.status(HTTP.OK).json(rows)
});

// PUT /tasks/:id
app.put('/tasks/:id', async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid task ID" });
        return;
    }

    const { title, is_done } = req.body as UpdateTaskInput;
    if (!title || typeof is_done !== "boolean") {
        res.sendStatus(HTTP.BAD_REQUEST).json({ error: "title, is_done are required" });
        return;
    }

    const row = await updateTask(idNum, { title, is_done });
    if (row === null) {
        res.sendStatus(HTTP.NOT_FOUND);
        return;
    }

    res.status(HTTP.CREATED).json(row);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid task ID" });
        return;
    }

    const ok = await deleteTaskById(idNum);
    if (!ok) {
        res.sendStatus(HTTP.NOT_FOUND);
        return;
    }

    res.sendStatus(HTTP.NO_CONTENT);
});

// GET /projects/:id/with-tasks
app.get('/projects/:id/with-tasks', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        res.status(HTTP.BAD_REQUEST).json({ error: "Invalid task ID" });
        return;
    }

    const row = await getProjectWithTasksJoin(id);
    if (!row) {
        res.sendStatus(HTTP.NOT_FOUND);
        return;
    }

    res.status(HTTP.OK).json(row);
});

app.listen(port, () => {
    console.log(`✅ http://localhost:${port}`)
});
