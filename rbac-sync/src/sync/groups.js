import { db } from "../db.js";
import { redis } from "../redis.js";

export async function syncGroupMembers() {
  const result = await db.query(`
    SELECT g.name AS group_name, gm.user_id
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
  `);

  const pipeline = redis.multi();

  const groups = [...new Set(result.rows.map((r) => r.group_name))];
  groups.forEach((g) => pipeline.del(`RBAC:GROUP:${g}:USERS`));

  result.rows.forEach((r) => {
    pipeline.sAdd(`RBAC:GROUP:${r.group_name}:USERS`, r.user_id);
  });

  await pipeline.exec();
}
