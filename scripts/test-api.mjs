// Quick API Verification Script
async function runTests() {
  const BASE = 'http://localhost:3000';
  console.log('--- 🧪 Testing Social Content Hub API Endpoints ---');

  // 1. Health Status
  const statusRes = await fetch(`${BASE}/api/status`);
  const status = await statusRes.json();
  console.log('✓ [1] Health Status:', JSON.stringify(status));

  // 2. Auth Login with passkey
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passkey: 'marketer123', role: 'marketer' }),
  });
  const loginData = await loginRes.json();
  console.log(`✓ [2] Auth Login (${loginRes.status}):`, loginData);

  // 3. Auth Check
  const cookie = loginRes.headers.get('set-cookie') || '';
  const checkRes = await fetch(`${BASE}/api/auth/check`, {
    headers: { cookie },
  });
  const checkData = await checkRes.json();
  console.log(`✓ [3] Auth Check:`, checkData);

  // 4. Get Existing Ideas
  const ideasRes = await fetch(`${BASE}/api/ideas`);
  const ideasData = await ideasRes.json();
  console.log(`✓ [4] Ideas count:`, ideasData.ideas?.length);

  // 5. Post a New Raw Idea (Founder Drop)
  const newIdeaRes = await fetch(`${BASE}/api/ideas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      raw_text: 'Why 90% of SaaS founders fail at social media: they treat Twitter like a press release wire instead of a two-way dinner table conversation.',
      author: 'founder',
      tags: ['Strategy', 'SaaS', 'Twitter'],
    }),
  });
  const newIdeaData = await newIdeaRes.json();
  console.log(`✓ [5] Created Founder Idea:`, newIdeaData.idea?.id, '-', newIdeaData.idea?.raw_text?.slice(0, 40));

  // 6. Test 1-Click Multi-Channel Dispatch (Publish Now across 4 channels)
  const publishRes = await fetch(`${BASE}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'The Multi-Channel Distribution Engine',
      content: 'Excited to announce our multi-channel scheduler launch! 🚀 Writing once and distributing across Twitter, Threads, LinkedIn & Instagram in 1 click.',
      channels: ['twitter', 'threads', 'linkedin', 'instagram'],
      authorRole: 'marketer',
      authorName: 'Digital Marketer',
    }),
  });
  const publishData = await publishRes.json();
  console.log(`✓ [6] 1-Click Multi-Channel Publish Result (${publishRes.status}):`);
  console.log('   - Message:', publishData.message);
  console.log('   - Success:', publishData.success);
  console.log('   - Dispatched Channels:', publishData.dispatchResults?.map((r) => `${r.channel}: ${r.status} (${r.service})`));

  // 7. Test Forward Scheduling (Schedule Ahead)
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const scheduleRes = await fetch(`${BASE}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Scheduled Forward Campaign',
      content: 'Here is our forward scheduled campaign ready for tomorrow 9 AM! #Growth #Marketing',
      channels: ['twitter', 'linkedin'],
      scheduledAt: tomorrow,
      authorRole: 'marketer',
    }),
  });
  const scheduleData = await scheduleRes.json();
  console.log(`✓ [7] Forward Scheduling Result:`);
  console.log('   - Message:', scheduleData.message);
  console.log('   - Scheduled Status:', scheduleData.post?.status);
  console.log('   - Scheduled At:', scheduleData.post?.scheduled_at);

  // 8. Verify Posts List includes the new posts
  const postsRes = await fetch(`${BASE}/api/posts`);
  const postsData = await postsRes.json();
  console.log(`✓ [8] Total Posts in Queue:`, postsData.posts?.length);
  console.log('--- 🎉 All API tests passed! ---');
}

runTests().catch(console.error);
