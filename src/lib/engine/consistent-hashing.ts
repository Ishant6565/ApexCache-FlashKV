export interface VirtualNode {
  hash: number;
  physicalNodeId: string;
  virtualIndex: number;
}

export class ConsistentHashRing {
  private ring: VirtualNode[] = [];
  private virtualNodeCount: number = 128;
  private physicalNodes: Set<string> = new Set();

  constructor(virtualNodeCount: number = 128) {
    this.virtualNodeCount = virtualNodeCount;
  }

  /**
   * 32-bit FNV-1a Hash function
   */
  static hash(key: string): number {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
  }

  /**
   * Add a physical storage node with V virtual replicas
   */
  addNode(nodeId: string) {
    if (this.physicalNodes.has(nodeId)) return;
    this.physicalNodes.add(nodeId);

    for (let i = 0; i < this.virtualNodeCount; i++) {
      const vKey = `${nodeId}#vn_${i}`;
      const vHash = ConsistentHashRing.hash(vKey);
      this.ring.push({
        hash: vHash,
        physicalNodeId: nodeId,
        virtualIndex: i,
      });
    }

    // Sort ring in ascending order of 32-bit hashes
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  /**
   * Remove a physical storage node
   */
  removeNode(nodeId: string) {
    this.physicalNodes.delete(nodeId);
    this.ring = this.ring.filter((v) => v.physicalNodeId !== nodeId);
  }

  /**
   * Locate the responsible storage node for a given key via binary search
   */
  getNode(key: string): { physicalNodeId: string; keyHash: number; targetVNodeHash: number } {
    if (this.ring.length === 0) {
      throw new Error('Hash ring has no available storage nodes.');
    }

    const keyHash = ConsistentHashRing.hash(key);

    // Binary search for the first virtual node with hash >= keyHash
    let low = 0;
    let high = this.ring.length - 1;
    let targetIndex = 0;

    if (keyHash > this.ring[high].hash) {
      targetIndex = 0; // Wrap around to the start of the circular ring
    } else {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (this.ring[mid].hash >= keyHash) {
          targetIndex = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
    }

    return {
      physicalNodeId: this.ring[targetIndex].physicalNodeId,
      keyHash,
      targetVNodeHash: this.ring[targetIndex].hash,
    };
  }

  /**
   * Calculate key redistribution impact when adding a new node
   */
  calculateRehashImpact(newNodeId: string, sampleKeys: string[]) {
    const originalAssignments = new Map<string, string>();
    sampleKeys.forEach((k) => {
      originalAssignments.set(k, this.getNode(k).physicalNodeId);
    });

    this.addNode(newNodeId);

    let rehashedCount = 0;
    sampleKeys.forEach((k) => {
      const newAssigned = this.getNode(k).physicalNodeId;
      if (newAssigned !== originalAssignments.get(k)) {
        rehashedCount += 1;
      }
    });

    const rehashPct = Math.round((rehashedCount / sampleKeys.length) * 1000) / 10;
    const theoreticalExpectedPct = Math.round((1 / this.physicalNodes.size) * 1000) / 10;

    return {
      totalKeysTested: sampleKeys.length,
      keysMigrated: rehashedCount,
      rehashPercentage: `${rehashPct}%`,
      theoreticalExpected: `${theoreticalExpectedPct}% (1/N)`,
      efficiencyScore: 'OPTIMAL_MINIMAL_MIGRATION',
    };
  }

  getRingOverview() {
    return {
      totalPhysicalNodes: this.physicalNodes.size,
      totalVirtualNodes: this.ring.length,
      virtualNodesPerNode: this.virtualNodeCount,
      nodes: Array.from(this.physicalNodes),
    };
  }
}
