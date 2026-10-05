import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/store/repository';

export async function GET() {
  try {
    const posts = await repository.getPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      channels = ['twitter'],
      status = 'draft',
      scheduled_at = null,
      media_urls = [],
      author_role = 'marketer',
      author_name = 'Marketer',
      notes = '',
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = await repository.createPost({
      title: title || content.slice(0, 40),
      content,
      channels,
      status,
      scheduled_at,
      published_at: null,
      media_urls,
      author_role,
      author_name,
      notes,
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
