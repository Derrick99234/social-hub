const token = '-Ik2urUrHBKNMrHFWN-fMSz_m7spqZ313lqFL-DbzOH';

async function testBuffer() {
  const orgId = '6a18089de1826ac0e1ee44dc';
  const query = `
    query GetChannels {
      channels(input: { organizationId: "${orgId}" }) {
        id
        name
        service
        serviceId
        avatar
      }
    }
  `;

  const res = await fetch('https://api.buffer.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  console.log('Channels Result:', JSON.stringify(data, null, 2));
}

testBuffer().catch(console.error);
