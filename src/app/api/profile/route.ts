import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  let user = await db.user.findUnique({ where: { id: payload.id } });
  if (!user && payload.email) {
    user = await db.user.findUnique({ where: { email: payload.email } });
  }
  return user;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Format first name and last name fallback if missing
  let firstName = user.firstName || '';
  let lastName = user.lastName || '';
  if (!firstName && !lastName && user.name) {
    const parts = user.name.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  return NextResponse.json({
    id: user.id,
    displayId: (user as any).displayId || `M-${user.id.slice(-6).toUpperCase()}`,
    firstName,
    lastName,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    addressLine1: user.addressLine1 || '',
    addressLine2: user.addressLine2 || '',
    city: user.city || '',
    postCode: user.postCode || '',
    country: user.country || 'United Kingdom',
    role: user.role,
  });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, phone, addressLine1, addressLine2, city, postCode, country } = body;

    const updatedFirstName = (firstName || '').trim();
    const updatedLastName = (lastName || '').trim();
    const fullName = `${updatedFirstName} ${updatedLastName}`.trim() || user.name;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: updatedFirstName,
        lastName: updatedLastName,
        name: fullName,
        phone: (phone || '').trim(),
        addressLine1: (addressLine1 || '').trim(),
        addressLine2: (addressLine2 || '').trim(),
        city: (city || '').trim(),
        postCode: (postCode || '').trim(),
        country: (country || 'United Kingdom').trim(),
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: fullName,
        email: user.email,
        phone: (phone || '').trim(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
