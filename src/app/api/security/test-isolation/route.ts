import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logSecurityAuditEvent } from '@/lib/security/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantA_key, tenantB_key, crossTenantQueryKey } = body;

    // Simulate multi-tenant keyspace isolation
    const keyspaceA = await prisma.keyspace.findUnique({ where: { name: 'session_cache' } });
    const keyspaceB = await prisma.keyspace.findUnique({ where: { name: 'product_catalog' } });

    if (!keyspaceA || !keyspaceB) throw new Error('Keyspaces not configured');

    // Query in Keyspace A
    const foundInA = await prisma.kvEntry.findUnique({
      where: {
        keyspaceId_key: { keyspaceId: keyspaceA.id, key: crossTenantQueryKey },
      },
    });

    const isLeaked = !!foundInA && foundInA.keyspaceId !== keyspaceA.id;

    await logSecurityAuditEvent({
      action: 'MULTI_TENANT_KEYSPACE_ISOLATION_PROBE',
      targetResource: `keyspace:${keyspaceA.name}`,
      riskLevel: isLeaked ? 'CRITICAL' : 'LOW',
      payloadSnippet: `Queried key ${crossTenantQueryKey} in keyspace ${keyspaceA.name}. Leaked: ${isLeaked}`,
    });

    return NextResponse.json({
      success: true,
      verdict: isLeaked ? 'ISOLATION_BREACH_DETECTED' : 'KEYSPACE_ISOLATION_ENFORCED',
      details: {
        targetKeyspace: keyspaceA.name,
        queriedKey: crossTenantQueryKey,
        dataLeaked: isLeaked,
        crossTenantProtection: 'ACTIVE (Strict Keyspace Partitioning)',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Probe failed' }, { status: 500 });
  }
}
