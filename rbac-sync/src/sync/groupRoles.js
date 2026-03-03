import { db } from "../db.js";
import { redis } from "../redis.js";

export async function syncGroupRoles() {
  const result = await db.query(`
    SELECT g.name AS group_name, gr.role_id
    FROM group_roles gr
    JOIN groups g ON g.id = gr.group_id
  `);

  const pipeline = redis.multi();

  const groups = [...new Set(result.rows.map((r) => r.group_name))];
  groups.forEach((g) => pipeline.del(`RBAC:GROUP:${g}:ROLES`));

  result.rows.forEach((r) => {
    pipeline.sAdd(`RBAC:GROUP:${r.group_name}:ROLES`, r.role_id);
  });

  await pipeline.exec();
}
