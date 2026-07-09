import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

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

    // Get bucket reference
    const bucket = adminStorage.bucket();
    const storageFile = bucket.file(destinationPath);

    // Save to Firebase Storage
    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Construct download link
    const encodedPath = encodeURIComponent(destinationPath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

    return NextResponse.json({
      success: true,
      url: downloadUrl,
      fileName: file.name
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 });
  }
}
