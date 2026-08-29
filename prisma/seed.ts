import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ApexCache LSM-Tree Storage Engine & Consistent Hash Ring...');

  // 1. Create Core Systems Engineer User
  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'engineer@apexcache.io' },
    update: {},
    create: {
      email: 'engineer@apexcache.io',
      name: 'Lead Storage Systems Engineer',
      passwordHash,
      role: 'STORAGE_ADMIN',
      apiKey: `apk_live_${Date.now()}_998877`,
    },
  });

  // 2. Create Keyspaces
  const sessionKs = await prisma.keyspace.upsert({
    where: { name: 'session_cache' },
    update: {},
    create: {
      name: 'session_cache',
      evictionPolicy: 'LRU',
      maxKeys: 5000,
      memoryLimitMb: 256.0,
      currentKeys: 12,
      hitCount: 4820,
      missCount: 42,
    },
  });

  const catalogKs = await prisma.keyspace.upsert({
    where: { name: 'product_catalog' },
    update: {},
    create: {
      name: 'product_catalog',
      evictionPolicy: 'LFU',
      maxKeys: 10000,
      memoryLimitMb: 512.0,
      currentKeys: 8,
      hitCount: 12400,
      missCount: 110,
    },
  });

  const rateLimitKs = await prisma.keyspace.upsert({
    where: { name: 'rate_limit_store' },
    update: {},
    create: {
      name: 'rate_limit_store',
      evictionPolicy: 'TTL',
      maxKeys: 20000,
      memoryLimitMb: 128.0,
      currentKeys: 5,
      hitCount: 29500,
      missCount: 300,
    },
  });

  // 3. Populate Sample KV Entries
  await prisma.kvEntry.deleteMany();

  const sessionEntries = [
    { key: 'sess:usr_4019:jwt', value: '{"sub":"usr_4019","role":"ADMIN","exp":1756489200}', ttl: 3600, level: 'MEMTABLE', count: 18 },
    { key: 'sess:usr_8821:jwt', value: '{"sub":"usr_8821","role":"USER","exp":1756489200}', ttl: 3600, level: 'MEMTABLE', count: 4 },
    { key: 'sess:usr_9912:jwt', value: '{"sub":"usr_9912","role":"USER","exp":1756489200}', ttl: 1800, level: 'L0', count: 42 },
    { key: 'sess:usr_1102:jwt', value: '{"sub":"usr_1102","role":"GUEST","exp":1756489200}', ttl: 900, level: 'L1', count: 85 },
  ];

  for (const e of sessionEntries) {
    await prisma.kvEntry.create({
      data: {
        keyspaceId: sessionKs.id,
        key: e.key,
        value: e.value,
        ttlSeconds: e.ttl,
        expiresAt: new Date(Date.now() + e.ttl * 1000),
        accessCount: e.count,
        sstableLevel: e.level,
      },
    });
  }

  const catalogEntries = [
    { key: 'prod:item_001', value: '{"name":"Apex Cloud Engine","sku":"APX-001","price":499.00,"stock":150}', level: 'MEMTABLE', count: 240 },
    { key: 'prod:item_002', value: '{"name":"FlashKV Storage Card","sku":"APX-002","price":1299.00,"stock":45}', level: 'L0', count: 520 },
    { key: 'prod:item_003', value: '{"name":"Distributed Mesh Router","sku":"APX-003","price":850.00,"stock":80}', level: 'L1', count: 1400 },
  ];

  for (const e of catalogEntries) {
    await prisma.kvEntry.create({
      data: {
        keyspaceId: catalogKs.id,
        key: e.key,
        value: e.value,
        accessCount: e.count,
        sstableLevel: e.level,
      },
    });
  }

  // 4. Create WAL logs
  await prisma.walLogEntry.deleteMany();
  for (let i = 1; i <= 6; i++) {
    await prisma.walLogEntry.create({
      data: {
        sequenceNumber: 1000 + i,
        keyspaceName: 'session_cache',
        operation: 'SET',
        key: `sess:usr_401${i}:jwt`,
        valueSnippet: '{"sub":"usr_4019"...}',
      },
    });
  }

  // 5. Create SSTables
  await prisma.sstableFile.deleteMany();
  await prisma.sstableFile.create({
    data: {
      level: 'L0',
      filename: 'sstable_l0_1788001122.db',
      minKey: 'prod:item_002',
      maxKey: 'sess:usr_9912:jwt',
      entryCount: 4,
      sizeBytes: 1024,
      bloomFilterBits: 'e3f019a2b847',
    },
  });

  await prisma.sstableFile.create({
    data: {
      level: 'L1',
      filename: 'sstable_l1_1788000980.db',
      minKey: 'prod:item_003',
      maxKey: 'sess:usr_1102:jwt',
      entryCount: 18,
      sizeBytes: 4096,
      bloomFilterBits: '9a4c7f01de44',
    },
  });

  // 6. Create Distributed Storage Nodes (Hash Ring)
  await prisma.storageNode.deleteMany();
  const ringNodes = [
    { nodeId: 'node-us-east-1a', host: '10.0.1.10', port: 7001, status: 'LEADER', ringPos: 45.0 },
    { nodeId: 'node-us-east-1b', host: '10.0.1.11', port: 7002, status: 'FOLLOWER', ringPos: 115.0 },
    { nodeId: 'node-us-west-2a', host: '10.0.2.20', port: 7003, status: 'FOLLOWER', ringPos: 190.0 },
    { nodeId: 'node-eu-west-1a', host: '10.0.3.30', port: 7004, status: 'FOLLOWER', ringPos: 275.0 },
    { nodeId: 'node-ap-southeast-1a', host: '10.0.4.40', port: 7005, status: 'FOLLOWER', ringPos: 335.0 },
  ];

  for (const n of ringNodes) {
    await prisma.storageNode.create({
      data: {
        nodeId: n.nodeId,
        host: n.host,
        port: n.port,
        status: n.status,
        ringPosition: n.ringPos,
        virtualNodeCount: 128,
      },
    });
  }

  console.log('✅ ApexCache Seed completed successfully!');
  console.log('👤 Credentials: engineer@apexcache.io / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
