module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Mock data for messages
  const mockMessages = [
    {
      _id: '1',
      date: '2024-01-15',
      totalCount: 100,
      pulledCount: 85,
      description: 'Günlük mesaj raporu',
      account: 'admin',
      createdAt: new Date()
    },
    {
      _id: '2',
      date: '2024-01-20',
      totalCount: 150,
      pulledCount: 120,
      description: 'Haftalık mesaj raporu',
      account: 'admin',
      createdAt: new Date()
    }
  ];

  if (req.method === 'GET') {
    res.status(200).json(mockMessages);
  } else if (req.method === 'POST') {
    const newMessage = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    res.status(201).json(newMessage);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 