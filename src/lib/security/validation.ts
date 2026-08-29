import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const KvSetSchema = z.object({
  keyspaceName: z.string().min(1, 'Keyspace name is required'),
  key: z.string().min(1, 'Key is required').max(256, 'Key size must not exceed 256 bytes'),
  value: z.string().min(1, 'Value is required').max(2097152, 'Value size must not exceed 2MB'),
  ttlSeconds: z.number().int().min(1).max(31536000).optional(),
});

export const KvGetSchema = z.object({
  keyspaceName: z.string().min(1, 'Keyspace name is required'),
  key: z.string().min(1, 'Key is required'),
});

export const KvDelSchema = z.object({
  keyspaceName: z.string().min(1, 'Keyspace name is required'),
  key: z.string().min(1, 'Key is required'),
});

export const RingNodeSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  host: z.string().optional(),
  port: z.number().optional(),
});
