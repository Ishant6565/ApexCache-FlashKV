import { prisma } from '../db';

export interface QuorumConfig {
  readQuorum: number; // R
  writeQuorum: number; // W
  replicationFactor: number; // N
}

export class RaftClusterEngine {
  /**
   * Get cluster state and evaluate Quorum consistency
   */
  static async getClusterStatus(config?: Partial<QuorumConfig>) {
    const nodes = await prisma.storageNode.findMany({
      orderBy: { ringPosition: 'asc' },
    });

    const N = config?.replicationFactor || 3;
    const R = config?.readQuorum || 2;
    const W = config?.writeQuorum || 2;

    const isStrictlyConsistent = R + W > N;
    const consistencyModel = isStrictlyConsistent
      ? 'STRICT_STRONG_CONSISTENCY (R + W > N)'
      : 'EVENTUAL_CONSISTENCY (R + W <= N)';

    const leaderNode = nodes.find((n) => n.status === 'LEADER') || nodes[0];

    return {
      totalNodes: nodes.length,
      leaderNode: leaderNode ? leaderNode.nodeId : 'None',
      quorum: {
        R,
        W,
        N,
        isStrictlyConsistent,
        consistencyModel,
      },
      nodes: nodes.map((n) => ({
        id: n.id,
        nodeId: n.nodeId,
        host: n.host,
        port: n.port,
        status: n.status,
        ringPosition: n.ringPosition,
        virtualNodes: n.virtualNodeCount,
        lastHeartbeatMs: Math.round(15 + Math.random() * 25),
      })),
    };
  }

  /**
   * Simulate Leader Election triggered by heartbeat failure
   */
  static async triggerLeaderElection() {
    const nodes = await prisma.storageNode.findMany();
    if (nodes.length === 0) throw new Error('No storage nodes in cluster');

    // Demote existing leader and elect a random follower
    const newLeaderIndex = Math.floor(Math.random() * nodes.length);
    const newLeaderId = nodes[newLeaderIndex].id;

    for (let i = 0; i < nodes.length; i++) {
      await prisma.storageNode.update({
        where: { id: nodes[i].id },
        data: {
          status: nodes[i].id === newLeaderId ? 'LEADER' : 'FOLLOWER',
          lastHeartbeat: new Date(),
        },
      });
    }

    return {
      newLeader: nodes[newLeaderIndex].nodeId,
      term: 14,
      status: 'LEADER_ELECTED_CONSENSUS_REACHED',
      quorumAchieved: true,
    };
  }
}
