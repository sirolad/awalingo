import 'server-only';
import { type Permission } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/server-auth';

/**
 * Decorator to enforce RBAC permissions on server action methods.
 * Note: This decorator must be used on static methods of a class.
 *
 * @param permission - The required permission to execute the method.
 */
export function Authorized(permission: Permission) {
  return function (
    _target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error('Authorized decorator can only be used on methods');
    }

    descriptor.value = async function (...args: unknown[]) {
      try {
        await requirePermission(permission);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof Error) {
          // Return standardized error response
          // This assumes the method returns an object with a success/error signature
          return { success: false, error: error.message };
        }
        return { success: false, error: 'Unauthorized' };
      }
    };

    return descriptor;
  };
}
