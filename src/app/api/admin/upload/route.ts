import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Size limit verification: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    // Allowed MIME types whitelist
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only JPEG, PNG, WEBP, GIF, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique randomized filename to prevent collisions and directory traversal
    const fileExtension = file.name.split('.').pop() || 'bin';
    const cleanExtension = fileExtension.replace(/[^a-zA-Z0-9]/g, '');
    const randomName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${cleanExtension}`;
    const destinationPath = `receipts/${randomName}`;

    // Upload to Supabase Storage bucket 'receipts'
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(destinationPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Construct download link
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(destinationPath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 });
  }
}
