import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.role === 'ADMIN';
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const records = await db.deletedRecord.findMany({
      orderBy: { deletedAt: 'desc' }
    });
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch deleted records' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      await db.deletedRecord.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Record permanently deleted.' });
    } else {
      await db.deletedRecord.deleteMany({});
      return NextResponse.json({ success: true, message: 'Archive cleared.' });
    }
  } catch (err: any) {
    console.error('Error deleting records:', err);
    return NextResponse.json({ error: 'Failed to delete record(s).' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== 'RESTORE') {
      return NextResponse.json({ error: 'Invalid restore request.' }, { status: 400 });
    }

    const record = await db.deletedRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: 'Record not found in archive.' }, { status: 404 });
    }

    const data = record.originalData as any;

    if (record.type === 'USER' || record.type === 'MEMBER') {
      // Check if user already exists
      if (data.email) {
        const existing = await db.user.findUnique({ where: { email: data.email } });
        if (existing) {
          await db.user.update({
            where: { id: existing.id },
            data: { isActive: true }
          });
        } else {
          await db.user.create({
            data: {
              id: data.id,
              email: data.email,
              name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Restored User',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              phone: data.phone || '',
              role: data.role || 'MEMBER',
              isActive: true,
              passwordHash: data.passwordHash || 'RESTORED_DUMMY_HASH'
            }
          });
        }
      }
    } else if (record.type === 'SAVINGS COMMITMENT' || record.type === 'COMMITMENT') {
      if (data.id) {
        const existing = await db.commitment.findUnique({ where: { id: data.id } });
        if (!existing) {
          await db.commitment.create({
            data: {
              id: data.id,
              memberId: data.memberId,
              memberName: data.memberName || 'Member',
              amount: Number(data.amount) || 100,
              goal: data.goal || 'Savings',
              collectionMonth: data.collectionMonth || 'January',
              collectionYear: Number(data.collectionYear) || 2026,
              endDate: data.endDate || new Date().toISOString(),
              status: 'ACTIVE'
            }
          });
        }
      }
    }

    // Remove from deleted records archive
    await db.deletedRecord.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Record restored successfully.' });
  } catch (err: any) {
    console.error('Error restoring record:', err);
    return NextResponse.json({ error: 'Failed to restore record.' }, { status: 500 });
  }
}
