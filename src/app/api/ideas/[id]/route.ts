import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/store/repository';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await repository.updateIdea(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, idea: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await repository.deleteIdea(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Idea deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
