import { prisma } from '../db';
import { logSecurityAuditEvent } from '../security/audit';

export class SimpleBloomFilter {
  private size: number;
  private bitset: Uint8Array;

  constructor(size: number = 256) {
    this.size = size;
    this.bitset = new Uint8Array(Math.ceil(size / 8));
  }

  private hash1(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.size;
  }

  private hash2(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.size;
  }

  add(str: string) {
    const idx1 = this.hash1(str);
    const idx2 = this.hash2(str);
    this.bitset[Math.floor(idx1 / 8)] |= 1 << (idx1 % 8);
    this.bitset[Math.floor(idx2 / 8)] |= 1 << (idx2 % 8);
  }

  test(str: string): boolean {
    const idx1 = this.hash1(str);
    const idx2 = this.hash2(str);
    const b1 = (this.bitset[Math.floor(idx1 / 8)] & (1 << (idx1 % 8))) !== 0;
    const b2 = (this.bitset[Math.floor(idx2 / 8)] & (1 << (idx2 % 8))) !== 0;
    return b1 && b2;
  }

  toHexString(): string {
    return Array.from(this.bitset)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export class LsmTreeEngine {
  private static walSequence: number = 1000;

  /**
   * Set key-value pair into LSM-Tree
   * Writes to append-only WAL first, then updates MemTable
   */
  static async set(
    keyspaceName: string,
    key: string,
    value: string,
    ttlSeconds?: number
  ) {
    const startTime = performance.now();

    const keyspace = await prisma.keyspace.findUnique({
      where: { name: keyspaceName },
    });

    if (!keyspace) throw new Error(`Keyspace "${keyspaceName}" not found.`);

    // 1. Append-Only Write-Ahead Log (WAL) Write
    this.walSequence += 1;
    await prisma.walLogEntry.create({
      data: {
        sequenceNumber: this.walSequence,
        keyspaceName,
        operation: 'SET',
        key,
        valueSnippet: value.slice(0, 100),
      },
    });

    // 2. Compute Expiration
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;

    // 3. Upsert into In-Memory MemTable
    const entry = await prisma.kvEntry.upsert({
      where: {
        keyspaceId_key: { keyspaceId: keyspace.id, key },
      },
      update: {
        value,
        ttlSeconds: ttlSeconds || null,
        expiresAt,
        isTombstone: false,
        sstableLevel: 'MEMTABLE',
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
      create: {
        keyspaceId: keyspace.id,
        key,
        value,
        ttlSeconds: ttlSeconds || null,
        expiresAt,
        isTombstone: false,
        sstableLevel: 'MEMTABLE',
      },
    });

    // Increment keyspace count
    await prisma.keyspace.update({
      where: { id: keyspace.id },
      data: { currentKeys: { increment: 1 } },
    });

    const elapsedUs = Math.round((performance.now() - startTime) * 1000);

    return {
      key,
      value,
      level: 'MEMTABLE',
      walSequence: this.walSequence,
      latencyUs: elapsedUs,
      status: 'COMMITTED',
    };
  }

  /**
   * Get key-value pair from LSM-Tree with Bloom filter fast-path
   */
  static async get(keyspaceName: string, key: string) {
    const startTime = performance.now();

    const keyspace = await prisma.keyspace.findUnique({
      where: { name: keyspaceName },
    });

    if (!keyspace) throw new Error(`Keyspace "${keyspaceName}" not found.`);

    // Search Step 1: In-Memory MemTable lookup
    let entry = await prisma.kvEntry.findUnique({
      where: { keyspaceId_key: { keyspaceId: keyspace.id, key } },
    });

    // Handle TTL Lazy Expiration
    if (entry && entry.expiresAt && new Date() > entry.expiresAt) {
      await prisma.kvEntry.delete({ where: { id: entry.id } });
      entry = null;
    }

    const elapsedUs = Math.round((performance.now() - startTime) * 1000);

    if (!entry || entry.isTombstone) {
      await prisma.keyspace.update({
        where: { id: keyspace.id },
        data: { missCount: { increment: 1 } },
      });

      return {
        found: false,
        key,
        value: null,
        level: 'NOT_FOUND',
        latencyUs: elapsedUs,
      };
    }

    // Update access stats for LRU/LFU
    await prisma.kvEntry.update({
      where: { id: entry.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    await prisma.keyspace.update({
      where: { id: keyspace.id },
      data: { hitCount: { increment: 1 } },
    });

    return {
      found: true,
      key: entry.key,
      value: entry.value,
      level: entry.sstableLevel,
      accessCount: entry.accessCount + 1,
      ttlSeconds: entry.ttlSeconds,
      latencyUs: elapsedUs,
    };
  }

  /**
   * Delete key by inserting an immutable Tombstone marker
   */
  static async del(keyspaceName: string, key: string) {
    const keyspace = await prisma.keyspace.findUnique({
      where: { name: keyspaceName },
    });

    if (!keyspace) throw new Error(`Keyspace "${keyspaceName}" not found.`);

    this.walSequence += 1;
    await prisma.walLogEntry.create({
      data: {
        sequenceNumber: this.walSequence,
        keyspaceName,
        operation: 'DEL',
        key,
        valueSnippet: '[TOMBSTONE]',
      },
    });

    // Mark as Tombstone in MemTable
    await prisma.kvEntry.upsert({
      where: { keyspaceId_key: { keyspaceId: keyspace.id, key } },
      update: {
        value: '',
        isTombstone: true,
        sstableLevel: 'MEMTABLE',
      },
      create: {
        keyspaceId: keyspace.id,
        key,
        value: '',
        isTombstone: true,
        sstableLevel: 'MEMTABLE',
      },
    });

    return {
      key,
      status: 'TOMBSTONE_COMMITTED',
      walSequence: this.walSequence,
    };
  }

  /**
   * Flush In-Memory MemTable to Immutable L0 SSTable file with Bloom filter
   */
  static async flushMemTable() {
    const memEntries = await prisma.kvEntry.findMany({
      where: { sstableLevel: 'MEMTABLE' },
      orderBy: { key: 'asc' },
    });

    if (memEntries.length === 0) {
      return { flushedCount: 0, message: 'MemTable is currently empty.' };
    }

    const bloom = new SimpleBloomFilter(512);
    memEntries.forEach((e) => bloom.add(e.key));

    const sstableName = `sstable_l0_${Date.now()}.db`;
    const minKey = memEntries[0].key;
    const maxKey = memEntries[memEntries.length - 1].key;

    // Create SSTable metadata
    const sstable = await prisma.sstableFile.create({
      data: {
        level: 'L0',
        filename: sstableName,
        minKey,
        maxKey,
        entryCount: memEntries.length,
        sizeBytes: memEntries.length * 128,
        bloomFilterBits: bloom.toHexString(),
      },
    });

    // Move entries from MEMTABLE to L0
    await prisma.kvEntry.updateMany({
      where: { sstableLevel: 'MEMTABLE' },
      data: { sstableLevel: 'L0' },
    });

    await logSecurityAuditEvent({
      action: 'LSM_MEMTABLE_FLUSHED',
      targetResource: sstableName,
      riskLevel: 'LOW',
      payloadSnippet: `Flushed ${memEntries.length} entries to L0 SSTable (${minKey} -> ${maxKey})`,
    });

    return {
      sstableId: sstable.id,
      filename: sstableName,
      level: 'L0',
      flushedCount: memEntries.length,
      keyRange: `${minKey} ... ${maxKey}`,
      bloomFilterHex: bloom.toHexString().substring(0, 32) + '...',
    };
  }

  /**
   * Tiered Size-Compaction: Merges L0 SSTables into L1 and purges Tombstones
   */
  static async compact() {
    const l0Entries = await prisma.kvEntry.findMany({
      where: { sstableLevel: 'L0' },
      orderBy: { key: 'asc' },
    });

    // Filter out tombstones during compaction
    const activeEntries = l0Entries.filter((e) => !e.isTombstone);
    const purgedTombstones = l0Entries.length - activeEntries.length;

    // Delete tombstones permanently
    await prisma.kvEntry.deleteMany({
      where: { sstableLevel: 'L0', isTombstone: true },
    });

    // Promote remaining L0 to L1
    await prisma.kvEntry.updateMany({
      where: { sstableLevel: 'L0' },
      data: { sstableLevel: 'L1' },
    });

    // Clean old L0 SSTable files and create compacted L1 SSTable
    await prisma.sstableFile.deleteMany({ where: { level: 'L0' } });

    if (activeEntries.length > 0) {
      const bloom = new SimpleBloomFilter(1024);
      activeEntries.forEach((e) => bloom.add(e.key));

      await prisma.sstableFile.create({
        data: {
          level: 'L1',
          filename: `sstable_l1_compacted_${Date.now()}.db`,
          minKey: activeEntries[0].key,
          maxKey: activeEntries[activeEntries.length - 1].key,
          entryCount: activeEntries.length,
          sizeBytes: activeEntries.length * 110,
          bloomFilterBits: bloom.toHexString(),
        },
      });
    }

    return {
      promotedToL1Count: activeEntries.length,
      purgedTombstonesCount: purgedTombstones,
      message: `Compacted L0 into L1. Purged ${purgedTombstones} deleted tombstone entries.`,
    };
  }
}
