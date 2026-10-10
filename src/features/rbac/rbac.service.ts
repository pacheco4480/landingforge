export function hasPermission(
  userPermissions: readonly string[],
  permission: string,
) {
  return userPermissions.includes(permission);
}

export function hasRole(userRoles: readonly string[], role: string) {
  return userRoles.includes(role);
}
