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
      sender: 'Yasin Yıldız',
      createdAt: new Date()
    },
    {
      _id: '2',
      date: '2024-01-20',
      totalCount: 150,
      pulledCount: 120,
      description: 'Haftalık mesaj raporu',
      account: 'admin',
      sender: 'Bağcılar Belediyesi',
      createdAt: new Date()
    }
  ];

  if (req.method === 'GET') {
    console.log('GET /messages - Returning messages:', mockMessages);
    res.status(200).json(mockMessages);
  } else if (req.method === 'POST') {
    console.log('POST /messages - Request body:', req.body);
    console.log('POST /messages - Sender from request:', req.body.sender);
    
    const newMessage = {
      _id: Date.now().toString(),
      ...req.body,
      sender: req.body.sender || 'Belirtilmemiş',
      createdAt: new Date()
    };
    
    console.log('POST /messages - Created message:', newMessage);
    res.status(201).json(newMessage);
  } else if (req.method === 'PUT') {
    const messageId = req.url.split('/').pop();
    console.log('PUT /messages - Request body:', req.body);
    console.log('PUT /messages - Sender from request:', req.body.sender);
    
    const updatedMessage = {
      _id: messageId,
      ...req.body,
      sender: req.body.sender || 'Belirtilmemiş',
      createdAt: new Date()
    };
    
    console.log('PUT /messages - Updated message:', updatedMessage);
    res.status(200).json(updatedMessage);
  } else if (req.method === 'DELETE') {
    res.status(200).json({ message: 'Message deleted successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 