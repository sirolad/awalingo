/**
 * Permission-based access control system for Awalingo
 *
 * This module defines the core permission types and role-permission mappings
 * used throughout the application for authorization checks.
 */

/**
 * Available permissions in the system
 * Format: 'resource:action'
 */
export type Permission =
  | 'review:requests' // Can review and approve/reject translation requests
  | 'manage:users' // Can manage user roles and permissions
  | 'create:requests' // Can create translation requests
  | 'vote:suggestions' // Can vote on translation suggestions
  | 'view:admin' // Can access admin pages
  | 'rate:neos'; // Can rate neologisms

/**
 * Available roles in the system
 */
export type Role = 'ADMIN' | 'JUROR' | 'CONTRIBUTOR' | 'EXPLORER';

/**
 * Mapping of roles to their permitted actions
 * This is the single source of truth for role-based permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'review:requests',
    'manage:users',
    'create:requests',
    'vote:suggestions',
    'view:admin',
    'rate:neos',
  ],
  JUROR: [
    'review:requests',
    'create:requests',
    'vote:suggestions',
    'view:admin',
    'rate:neos',
  ],
  CONTRIBUTOR: ['create:requests', 'vote:suggestions'],
  EXPLORER: [],
};

/**
 * Check if a role has a specific permission
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns true if the role has the permission, false otherwise
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role has any of the specified permissions
 * @param role - The role to check
 * @param permissions - Array of permissions to check
 * @returns true if the role has at least one of the permissions
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 * @param role - The role to check
 * @param permissions - Array of permissions to check
 * @returns true if the role has all of the permissions
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a given role
 * @param role - The role to get permissions for
 * @returns Array of permissions for the role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
