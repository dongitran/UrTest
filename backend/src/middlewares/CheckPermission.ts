import type { MiddlewareHandler } from "hono";

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
};

const CheckPermission = (allowedRoles: string[]): MiddlewareHandler => {
  return async (ctx, next) => {
    const user = ctx.get("user");

    if (!user || !user.roles) {
      return ctx.json({ message: "Forbidden: User has no roles defined" }, 403);
    }

    const hasRole = allowedRoles.some((role) => user.roles.includes(role));

    const hasGroup =
      user.groups &&
      allowedRoles.some((role) => {
        const groupMappings: Record<string, string[]> = {
          ADMIN: ["/Administrators"],
          MANAGER: ["/Managers"],
          STAFF: ["/Staff Members"],
        };

        const matchingGroups = groupMappings[role] || [];
        return matchingGroups.some((group) => user.groups.includes(group));
      });

    if (!hasRole && !hasGroup) {
      return ctx.json(
        {
          message: "Forbidden: Insufficient permissions to perform this action",
          requiredRoles: allowedRoles,
        },
        403
      );
    }

    await next();
  };
};

export default CheckPermission;
