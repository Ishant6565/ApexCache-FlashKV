import { prisma } from '../db';
import { logSecurityAuditEvent } from '../security/audit';

export class EvictionEngine {
  /**
   * Run Cache Eviction according to configured Keyspace policy (LRU / LFU / TTL)
   */
  static async enforceEviction(keyspaceId: string) {
    const keyspace = await prisma.keyspace.findUnique({
      where: { id: keyspaceId },
    });

    if (!keyspace) throw new Error('Keyspace not found');

    const totalCount = await prisma.kvEntry.count({ where: { keyspaceId } });

    // If capacity within max limit, only sweep expired TTL keys
    if (totalCount <= keyspace.maxKeys) {
      return await this.sweepExpiredTtl(keyspaceId);
    }

    const excessCount = totalCount - keyspace.maxKeys;
    let evictedKeys: string[] = [];

    if (keyspace.evictionPolicy === 'LRU') {
      // Evict Least Recently Used (oldest lastAccessedAt)
      const toEvict = await prisma.kvEntry.findMany({
        where: { keyspaceId },
        orderBy: { lastAccessedAt: 'asc' },
        take: excessCount,
        select: { id: true, key: true },
      });

      evictedKeys = toEvict.map((e) => e.key);
      await prisma.kvEntry.deleteMany({
        where: { id: { in: toEvict.map((e) => e.id) } },
      });
    } else if (keyspace.evictionPolicy === 'LFU') {
      // Evict Least Frequently Used (lowest accessCount)
      const toEvict = await prisma.kvEntry.findMany({
        where: { keyspaceId },
        orderBy: [{ accessCount: 'asc' }, { lastAccessedAt: 'asc' }],
        take: excessCount,
        select: { id: true, key: true },
      });

      evictedKeys = toEvict.map((e) => e.key);
      await prisma.kvEntry.deleteMany({
        where: { id: { in: toEvict.map((e) => e.id) } },
      });
    } else {
      // TTL Sweep
      return await this.sweepExpiredTtl(keyspaceId);
    }

    // Update keyspace count
    const remainingCount = await prisma.kvEntry.count({ where: { keyspaceId } });
    await prisma.keyspace.update({
      where: { id: keyspaceId },
      data: { currentKeys: remainingCount },
    });

    await logSecurityAuditEvent({
      action: `CACHE_EVICTION_${keyspace.evictionPolicy}`,
      targetResource: `keyspace:${keyspace.name}`,
      riskLevel: 'LOW',
      payloadSnippet: `Evicted ${evictedKeys.length} keys: ${evictedKeys.join(', ')}`,
    });

    return {
      policy: keyspace.evictionPolicy,
      evictedCount: evictedKeys.length,
      evictedKeys,
      remainingKeys: remainingCount,
    };
  }

  /**
   * Active TTL Expiration Sweeper
   */
  static async sweepExpiredTtl(keyspaceId: string) {
    const now = new Date();
    const expired = await prisma.kvEntry.findMany({
      where: {
        keyspaceId,
        expiresAt: { lt: now },
      },
      select: { id: true, key: true },
    });

    if (expired.length > 0) {
      await prisma.kvEntry.deleteMany({
        where: { id: { in: expired.map((e) => e.id) } },
      });

      const remainingCount = await prisma.kvEntry.count({ where: { keyspaceId } });
      await prisma.keyspace.update({
        where: { id: keyspaceId },
        data: { currentKeys: remainingCount },
      });
    }

    return {
      policy: 'TTL_SWEEP',
      expiredCount: expired.length,
      expiredKeys: expired.map((e) => e.key),
    };
  }
}
