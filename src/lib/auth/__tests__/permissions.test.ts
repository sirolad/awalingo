import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
} from '@/lib/auth/permissions';

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('should return true when role has the permission', () => {
      expect(hasPermission('ADMIN', 'review:requests')).toBe(true);
      expect(hasPermission('ADMIN', 'manage:users')).toBe(true);
      expect(hasPermission('JUROR', 'review:requests')).toBe(true);
      expect(hasPermission('CONTRIBUTOR', 'create:requests')).toBe(true);
    });

    it('should return false when role does not have the permission', () => {
      expect(hasPermission('EXPLORER', 'review:requests')).toBe(false);
      expect(hasPermission('CONTRIBUTOR', 'manage:users')).toBe(false);
      expect(hasPermission('JUROR', 'manage:users')).toBe(false);
    });

    it('should handle EXPLORER role with no permissions', () => {
      expect(hasPermission('EXPLORER', 'review:requests')).toBe(false);
      expect(hasPermission('EXPLORER', 'manage:users')).toBe(false);
    });

    it('should return false for an invalid role', () => {
      expect(hasPermission('NONEXISTENT_ROLE' as any, 'review:requests')).toBe(
        false
      );
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when role has at least one permission', () => {
      expect(
        hasAnyPermission('CONTRIBUTOR', ['create:requests', 'manage:users'])
      ).toBe(true);
      expect(
        hasAnyPermission('JUROR', ['review:requests', 'manage:users'])
      ).toBe(true);
    });

    it('should return false when role has none of the permissions', () => {
      expect(
        hasAnyPermission('EXPLORER', ['create:requests', 'review:requests'])
      ).toBe(false);
      expect(
        hasAnyPermission('CONTRIBUTOR', ['manage:users', 'view:admin'])
      ).toBe(false);
    });

    it('should return true when role has all permissions', () => {
      expect(
        hasAnyPermission('ADMIN', ['create:requests', 'manage:users'])
      ).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when role has all specified permissions', () => {
      expect(
        hasAllPermissions('ADMIN', ['create:requests', 'review:requests'])
      ).toBe(true);
      expect(
        hasAllPermissions('JUROR', ['create:requests', 'vote:suggestions'])
      ).toBe(true);
    });

    it('should return false when role is missing any permission', () => {
      expect(
        hasAllPermissions('CONTRIBUTOR', ['create:requests', 'review:requests'])
      ).toBe(false);
      expect(
        hasAllPermissions('JUROR', ['review:requests', 'manage:users'])
      ).toBe(false);
    });

    it('should return false when role has no permissions', () => {
      expect(
        hasAllPermissions('EXPLORER', ['create:requests', 'review:requests'])
      ).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for ADMIN', () => {
      const permissions = getRolePermissions('ADMIN');
      expect(permissions).toContain('review:requests');
      expect(permissions).toContain('manage:users');
      expect(permissions).toContain('create:requests');
      expect(permissions).toContain('vote:suggestions');
      expect(permissions).toContain('view:admin');
      expect(permissions).toContain('rate:neos');
      expect(permissions).toHaveLength(6);
    });

    it('should return correct permissions for JUROR', () => {
      const permissions = getRolePermissions('JUROR');
      expect(permissions).toContain('review:requests');
      expect(permissions).toContain('create:requests');
      expect(permissions).toContain('vote:suggestions');
      expect(permissions).toContain('view:admin');
      expect(permissions).toContain('rate:neos');
      expect(permissions).not.toContain('manage:users');
      expect(permissions).toHaveLength(5);
    });

    it('should return correct permissions for CONTRIBUTOR', () => {
      const permissions = getRolePermissions('CONTRIBUTOR');
      expect(permissions).toContain('create:requests');
      expect(permissions).toContain('vote:suggestions');
      expect(permissions).not.toContain('review:requests');
      expect(permissions).not.toContain('manage:users');
      expect(permissions).toHaveLength(2);
    });

    it('should return empty array for EXPLORER', () => {
      const permissions = getRolePermissions('EXPLORER');
      expect(permissions).toEqual([]);
      expect(permissions).toHaveLength(0);
    });

    it('should return empty array for an invalid role', () => {
      const permissions = getRolePermissions('NONEXISTENT_ROLE' as any);
      expect(permissions).toEqual([]);
    });
  });

  describe('Role hierarchy verification', () => {
    it('should ensure ADMIN has all permissions that JUROR has', () => {
      const adminPerms = getRolePermissions('ADMIN');
      const jurorPerms = getRolePermissions('JUROR');

      jurorPerms.forEach(perm => {
        expect(adminPerms).toContain(perm);
      });
    });

    it('should ensure JUROR has all permissions that CONTRIBUTOR has', () => {
      const jurorPerms = getRolePermissions('JUROR');
      const contributorPerms = getRolePermissions('CONTRIBUTOR');

      contributorPerms.forEach(perm => {
        expect(jurorPerms).toContain(perm);
      });
    });
  });
});
