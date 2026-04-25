import fetch from 'node-fetch';

async function testCreateQuote() {
  const quoteData = {
    customerId: "8a79f704-13a5-4a34-87e3-b113cd369749",
    reference: "QT-TEST-" + Date.now(),
    amount: 128.78,
    description: "test creation from script",
    billingAddress: "Test Address",
    expiryDays: 30,
    items: [
      {
        itemId: "ce222738-425e-4652-b934-043c1e6efb13",
        qty: 1,
        unitPrice: 111,
        totalAmount: 111
      }
    ]
  };

  try {
    const res = await fetch('http://localhost:3001/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData)
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Quote created successfully:', data);
    } else {
      const errorText = await res.text();
      console.error('Failed to create quote:', errorText);
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}

testCreateQuote();
