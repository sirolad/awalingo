import 'server-only';

import { getCurrentUser } from '@/lib/supabase/server';
import { getUserContext } from '@/actions/auth';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  Permission,
  Role,
} from './permissions';

/**
 * Server-side authentication and authorization helpers
 * These functions should only be used in server actions and API routes
 */

/**
 * Require that a user is authenticated
 * @throws Error if no user session exists
 * @returns The authenticated user object
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: No user session');
  }

  return { user };
}

/**
 * Get the role for a given user ID
 * Leverages the existing getUserContext function for efficient data fetching
 * @param userId - The user ID to get the role for
 * @returns The user's role, defaults to EXPLORER if no role is assigned
 */
export async function getUserRole(userId: string): Promise<Role> {
  const { userRole } = await getUserContext(userId);
  return (userRole?.role?.name as Role) || 'EXPLORER';
}

/**
 * Require that the authenticated user has a specific permission
 * @param permission - The required permission
 * @throws Error if user is not authenticated or lacks the permission
 * @returns Object containing the authenticated user and their role
 */
export async function requirePermission(permission: Permission) {
  const { user } = await requireAuth();
  const role = await getUserRole(user.id);

  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }

  return { user, role };
}

/**
 * Require that the authenticated user has at least one of the specified permissions
 * @param permissions - Array of acceptable permissions
 * @throws Error if user is not authenticated or lacks all permissions
 * @returns Object containing the authenticated user and their role
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const { user } = await requireAuth();
  const role = await getUserRole(user.id);

  if (!hasAnyPermission(role, permissions)) {
    throw new Error(
      `Forbidden: Missing any of required permissions: ${permissions.join(', ')}`
    );
  }

  return { user, role };
}

/**
 * Require that the authenticated user has all of the specified permissions
 * @param permissions - Array of required permissions
 * @throws Error if user is not authenticated or lacks any permission
 * @returns Object containing the authenticated user and their role
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const { user } = await requireAuth();
  const role = await getUserRole(user.id);

  if (!hasAllPermissions(role, permissions)) {
    throw new Error(
      `Forbidden: Missing required permissions: ${permissions.join(', ')}`
    );
  }

  return { user, role };
}

/**
 * Get the current authenticated user and their role (without throwing errors)
 * Useful for optional authentication scenarios
 * @returns Object with user and role, or null values if not authenticated
 */
export async function getAuthContext() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { user: null, role: null };
    }

    const role = await getUserRole(user.id);
    return { user, role };
  } catch {
    return { user: null, role: null };
  }
}
