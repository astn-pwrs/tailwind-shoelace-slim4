import { db } from "../db.js";
import { redis } from "../redis.js";

export async function syncRouteRoles() {
  const result = await db.query(`
    SELECT route_id, role_id
    FROM route_group_roles
  `);

  const pipeline = redis.multi();

  const roles = [...new Set(result.rows.map((r) => r.role_id))];
  const routes = [...new Set(result.rows.map((r) => r.route_id))];

  roles.forEach((r) => pipeline.del(`RBAC:ROLE:${r}:ROUTES`));
  routes.forEach((r) => pipeline.del(`RBAC:ROUTE:${r}:ROLES`));

  result.rows.forEach((r) => {
    pipeline.sAdd(`RBAC:ROLE:${r.role_id}:ROUTES`, r.route_id);
    pipeline.sAdd(`RBAC:ROUTE:${r.route_id}:ROLES`, r.role_id);
  });

  await pipeline.exec();
}
