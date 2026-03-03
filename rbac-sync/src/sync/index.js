import { syncGroupMembers } from "./groups.js";
import { syncGroupRoles } from "./groupRoles.js";
import { syncRolePermissions } from "./permissions.js";
import { syncRouteRoles } from "./routes.js";

export async function syncAll() {
  await syncGroupMembers();
  await syncGroupRoles();
  await syncRolePermissions();
  await syncRouteRoles();
}
