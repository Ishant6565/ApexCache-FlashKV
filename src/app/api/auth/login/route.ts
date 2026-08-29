import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signSessionToken, COOKIE_NAME } from '@/lib/security/auth';
import { LoginSchema } from '@/lib/security/validation';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`auth:login:${ip}`, { maxRequests: 10, windowMs: 60000 });
    if (!rate.success) {
      return NextResponse.json({ error: `Too many login attempts. Retry in ${rate.resetInSeconds}s.` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

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
