import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'media';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${Date.now()}-${cleanFileName}`;

    const supabase = getSupabaseServerClient();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            storage: 'supabase',
            path: storagePath,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        }
        console.warn('Supabase storage upload error:', uploadError?.message);
      } catch (storageErr) {
        console.warn('Supabase storage exception:', storageErr);
      }
    }

    // Fallback: create base64 data URI for instant client preview & testing
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUri,
      storage: 'local_preview',
      path: storagePath,
      name: file.name,
      size: file.size,
      type: file.type,
      notice: 'Served via local fallback preview. Add Supabase keys to save directly to Supabase Media bucket.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, path: inputPath } = body;

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'media';
    let storagePath = inputPath;

    if (!storagePath && url && typeof url === 'string') {
      // If it's a Supabase storage public URL, extract the relative path
      // Pattern: .../storage/v1/object/public/{bucketName}/{path}
      const marker = `/${bucketName}/`;
      if (url.includes(marker)) {
        storagePath = url.split(marker)[1];
      } else if (url.includes('uploads/')) {
        const match = url.match(/uploads\/[a-zA-Z0-9._-]+/);
        if (match) storagePath = match[0];
      }
    }

    if (storagePath) {
      const supabase = getSupabaseServerClient();
      if (supabase && isSupabaseConfigured()) {
        const { error: removeError } = await supabase.storage
          .from(bucketName)
          .remove([storagePath]);

        if (removeError) {
          console.warn('Supabase storage remove error:', removeError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Media deleted from storage',
      path: storagePath || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown delete error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
