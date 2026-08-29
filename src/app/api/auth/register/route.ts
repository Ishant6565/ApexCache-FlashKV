import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signSessionToken, COOKIE_NAME } from '@/lib/security/auth';
import { RegisterSchema } from '@/lib/security/validation';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`auth:register:${ip}`, { maxRequests: 5, windowMs: 60000 });
    if (!rate.success) {
      return NextResponse.json({ error: `Too many registrations. Retry in ${rate.resetInSeconds}s.` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        apiKey: `apk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      },
    });

    const token = signSessionToken({ userId: user.id, email: user.email, name: user.name });
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, apiKey: user.apiKey },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
