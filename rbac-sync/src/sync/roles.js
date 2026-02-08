async function syncGroupRoles() {
  const rows = await pg.query(`
    SELECT g.name AS group_name, gr.role_id
    FROM group_roles gr
    JOIN groups g ON g.id = gr.group_id
  `);

  const pipeline = redis.pipeline();

  const groups = [...new Set(rows.rows.map((r) => r.group_name))];
  groups.forEach((g) => pipeline.del(`RBAC:GROUP:${g}:ROLES`));

  rows.rows.forEach((r) => {
    pipeline.sadd(`RBAC:GROUP:${r.group_name}:ROLES`, r.role_id);
  });

  await pipeline.exec();
}
