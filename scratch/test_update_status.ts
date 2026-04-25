import fetch from 'node-fetch';

async function testUpdateStatus() {
  const quoteId = "29f700e7-77bb-481d-8c8a-e29ecd92bb1b";
  const newStatus = "Accepted";

  try {
    const res = await fetch(`http://localhost:3001/api/quotes/${quoteId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Status updated successfully:', data);
    } else {
      const errorText = await res.text();
      console.error('Failed to update status:', errorText);
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}

testUpdateStatus();
