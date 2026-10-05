import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/store/repository';

export async function GET() {
  try {
    const ideas = await repository.getIdeas();
    return NextResponse.json({ success: true, ideas });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raw_text, author = 'founder', tags = [] } = body;

    if (!raw_text || !raw_text.trim()) {
      return NextResponse.json({ error: 'Idea content is required' }, { status: 400 });
    }

    const idea = await repository.createIdea({
      raw_text,
      author,
      tags,
      status: 'inbox',
      converted_post_id: null,
    });

    return NextResponse.json({ success: true, idea }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
  }
}
