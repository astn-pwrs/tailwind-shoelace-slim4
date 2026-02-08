import { db } from "../db.js";
import { redis } from "../redis.js";

export async function syncRolePermissions() {
  const result = await db.query(`
    SELECT id, permission_ids
    FROM roles
  `);

  const pipeline = redis.multi();

  result.rows.forEach((r) => {
    pipeline.del(`RBAC:ROLE:${r.id}:PERMISSIONS`);
    r.permission_ids.forEach((pid) => {
      pipeline.sAdd(`RBAC:ROLE:${r.id}:PERMISSIONS`, pid);
    });
  });

  await pipeline.exec();
}
