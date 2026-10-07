import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    // Quick, lightweight database query to verify connection and keep pool warm
    const userCount = await db.user.count();

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp,
      records: { userCount }
    });
  } catch (error: any) {
    console.error('Health check database query error:', error);
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'error',
        error: error?.message || 'Database unavailable',
        timestamp
      },
      { status: 503 }
    );
  }
}
