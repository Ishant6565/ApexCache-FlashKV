import { NextResponse } from 'next/server';
import { RaftClusterEngine } from '@/lib/engine/raft-cluster';
import { logSecurityAuditEvent } from '@/lib/security/audit';

export async function POST() {
  try {
    const result = await RaftClusterEngine.triggerLeaderElection();

    await logSecurityAuditEvent({
      action: 'RAFT_LEADER_ELECTION_TRIGGERED',
      targetResource: `cluster:leader:${result.newLeader}`,
      riskLevel: 'LOW',
      payloadSnippet: `Elected new cluster leader ${result.newLeader} on term ${result.term}`,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Election failed' }, { status: 500 });
  }
}
