import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApexCache | Distributed In-Memory Key-Value Store & LSM-Tree Storage Engine',
  description:
    'Ultra-low latency distributed in-memory key-value database featuring Log-Structured Merge-Tree (LSM-Tree) SSTable compaction, Consistent Hashing with virtual nodes, Raft consensus replication, and multi-policy LRU/LFU/TTL eviction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c16] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
