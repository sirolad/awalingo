import 'server-only';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Audit logging helpers for tracking sensitive operations
 */

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Create an audit log entry
 * This function does not throw errors to avoid blocking main operations
 *
 * @param entry - The audit log entry to create
 * @returns Promise that resolves when the log is created
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceId: entry.resourceId || null,
        metadata: entry.metadata || undefined,
      },
    });
  } catch (error) {
    // Log the error but don't throw to avoid breaking the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Query audit logs with optional filters
 * Useful for admin dashboards and security monitoring
 *
 * @param filters - Optional filters for the query
 * @returns Array of audit log entries
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  try {
    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific resource
 *
 * @param resourceId - The resource ID to get logs for
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries for the resource
 */
export async function getResourceAuditLogs(
  resourceId: string,
  limit: number = 50
) {
  try {
    return await prisma.auditLog.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch resource audit logs:', error);
    return [];
  }
}
