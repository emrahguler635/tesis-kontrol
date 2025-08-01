// In-memory storage for messages (same as messages.js)
let mockMessages = [
  {
    id: 1,
    date: '2025-07-31',
    totalCount: 13333,
    pulledCount: 13333,
    description: 'Günlük mesaj raporu',
    account: 'Yasin Yıldız',
    sender: 'Yasin Yıldız',
    created_at: new Date()
  },
  {
    id: 2,
    date: '2025-07-31',
    totalCount: 12,
    pulledCount: 12,
    description: 'Haftalık özet',
    account: 'Bağcılar Belediyesi',
    sender: 'Emrah GÜLER',
    created_at: new Date()
  },
  {
    id: 3,
    date: '2025-07-31',
    totalCount: 2,
    pulledCount: 2,
    description: 'Aylık rapor',
    account: 'Abdullah Özdemir',
    sender: 'Abdullah Özdemir',
    created_at: new Date()
  },
  {
    id: 4,
    date: '2025-07-31',
    totalCount: 1,
    pulledCount: 1,
    description: 'Test mesajı',
    account: 'Emrah GÜLER',
    sender: 'Emrah GÜLER',
    created_at: new Date()
  },
  {
    id: 5,
    date: '2025-07-31',
    totalCount: 12,
    pulledCount: 11,
    description: 'Eksik mesaj',
    account: 'Abdurrahman ERDEM',
    sender: 'Abdurrahman ERDEM',
    created_at: new Date()
  }
];

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const totalMessages = mockMessages.length;
    const totalCount = mockMessages.reduce((sum, msg) => sum + (msg.totalCount || 0), 0);
    const pulledCount = mockMessages.reduce((sum, msg) => sum + (msg.pulledCount || 0), 0);
    const successRate = totalCount > 0 ? parseFloat(((pulledCount / totalCount) * 100).toFixed(1)) : 0;
    
    res.status(200).json({
      totalMessages,
      totalCount,
      pulledCount,
      successRate,
      messageLog: totalMessages
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 