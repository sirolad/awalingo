import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requireAuth,
  getUserRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  getAuthContext,
} from '../server-auth';
import * as supabase from '@/lib/supabase/server';
import * as authActions from '@/actions/auth';
import { Role, Permission } from '../permissions';

vi.mock('@/lib/supabase/server', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/actions/auth', () => ({
  getUserContext: vi.fn(),
}));

describe('server-auth', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);

      const result = await requireAuth();

      expect(result).toEqual({ user: mockUser });
    });

    it('should throw error when not authenticated', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow(
        'Unauthorized: No user session'
      );
    });
  });

  describe('getUserRole', () => {
    it('should return user role from context', async () => {
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'ADMIN' } },
      });

      const result = await getUserRole('user-1');

      expect(result).toBe('ADMIN');
    });

    it('should default to EXPLORER if no role assigned', async () => {
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: null,
      });

      const result = await getUserRole('user-1');

      expect(result).toBe('EXPLORER');
    });

    it('should default to EXPLORER if context returns undefined', async () => {
      (authActions.getUserContext as any).mockResolvedValue({});

      const result = await getUserRole('user-1');

      expect(result).toBe('EXPLORER');
    });
  });

  describe('requirePermission', () => {
    it('should return user and role when user has permission', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'ADMIN' } },
      });

      const result = await requirePermission('review:requests');

      expect(result.user).toEqual(mockUser);
      expect(result.role).toBe('ADMIN');
    });

    it('should throw error when user lacks permission', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'EXPLORER' } },
      });

      await expect(requirePermission('review:requests')).rejects.toThrow(
        "Forbidden: Missing permission 'review:requests'"
      );
    });

    it('should throw error when not authenticated', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(null);

      await expect(requirePermission('review:requests')).rejects.toThrow(
        'Unauthorized: No user session'
      );
    });
  });

  describe('requireAnyPermission', () => {
    it('should return user and role when user has any of the permissions', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'CONTRIBUTOR' } },
      });

      const result = await requireAnyPermission([
        'create:requests',
        'view:admin',
      ]);

      expect(result.user).toEqual(mockUser);
      expect(result.role).toBe('CONTRIBUTOR');
    });

    it('should throw error when user lacks all permissions', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'EXPLORER' } },
      });

      await expect(
        requireAnyPermission(['create:requests', 'view:admin'])
      ).rejects.toThrow(
        'Forbidden: Missing any of required permissions: create:requests, view:admin'
      );
    });
  });

  describe('requireAllPermissions', () => {
    it('should return user and role when user has all permissions', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'ADMIN' } },
      });

      const result = await requireAllPermissions([
        'review:requests',
        'manage:users',
      ]);

      expect(result.user).toEqual(mockUser);
      expect(result.role).toBe('ADMIN');
    });

    it('should throw error when user lacks any permission', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'JUROR' } },
      });

      await expect(
        requireAllPermissions(['review:requests', 'manage:users'])
      ).rejects.toThrow('Forbidden: Missing required permissions');
    });
  });

  describe('getAuthContext', () => {
    it('should return user and role when authenticated', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(mockUser);
      (authActions.getUserContext as any).mockResolvedValue({
        userRole: { role: { name: 'ADMIN' } },
      });

      const result = await getAuthContext();

      expect(result.user).toEqual(mockUser);
      expect(result.role).toBe('ADMIN');
    });

    it('should return null values when not authenticated', async () => {
      (supabase.getCurrentUser as any).mockResolvedValue(null);

      const result = await getAuthContext();

      expect(result.user).toBeNull();
      expect(result.role).toBeNull();
    });

    it('should return null values on error', async () => {
      (supabase.getCurrentUser as any).mockRejectedValue(new Error('Error'));

      const result = await getAuthContext();

      expect(result.user).toBeNull();
      expect(result.role).toBeNull();
    });
  });
});
