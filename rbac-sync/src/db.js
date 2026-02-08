import pg from "pg";

export const db = new pg.Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  database: "rbac",
});
