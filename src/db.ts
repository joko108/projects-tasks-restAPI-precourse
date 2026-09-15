import { Pool } from "pg";

const connectToDb = 
    process.env.DATABASE_URL || 
    "postgresql://postgres:password@localhost:5533/projectsdb";

export const pool = new Pool ({ connectionString: connectToDb });
