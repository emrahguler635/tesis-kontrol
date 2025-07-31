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
      date: '2025-07-31',
      totalCount: 12,
      pulledCount: 11,
      description: 'Test mesajı',
      account: 'Yasin Yıldız',
      sender: 'Yasin Yıldız',
      createdAt: new Date()
    },
    {
      _id: '2',
      date: '2025-07-31',
      totalCount: 123,
      pulledCount: 110,
      description: 'Test mesajı 2',
      account: 'Abdullah Özdemir',
      sender: 'Abdullah Özdemir',
      createdAt: new Date()
    }
  ];

  if (req.method === 'GET') {
    res.status(200).json(mockMessages);
  } else if (req.method === 'POST') {
    const newMessage = {
      _id: Date.now().toString(),
      ...req.body,
      sender: req.body.sender || 'Belirtilmemiş',
      createdAt: new Date()
    };
    res.status(201).json(newMessage);
  } else if (req.method === 'PUT') {
    const messageId = req.url.split('/').pop();
    const updatedMessage = {
      _id: messageId,
      ...req.body,
      sender: req.body.sender || 'Belirtilmemiş',
      createdAt: new Date()
    };
    res.status(200).json(updatedMessage);
  } else if (req.method === 'DELETE') {
    res.status(200).json({ message: 'Message deleted successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 