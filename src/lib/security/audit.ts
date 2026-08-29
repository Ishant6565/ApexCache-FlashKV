import { prisma } from '../db';

export async function logSecurityAuditEvent(data: {
  action: string;
  targetResource: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  payloadSnippet?: string;
  ipAddress?: string;
}) {
  try {
    return await prisma.securityAuditEvent.create({
      data: {
        action: data.action,
        targetResource: data.targetResource,
        riskLevel: data.riskLevel,
        payloadSnippet: data.payloadSnippet ? data.payloadSnippet.slice(0, 500) : undefined,
        ipAddress: data.ipAddress || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('[SECURITY_AUDIT_LOG_ERROR]', err);
  }
}
