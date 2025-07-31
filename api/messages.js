// In-memory storage for messages
let mockMessages = [
  {
    id: 1,
    date: '2025-07-31',
    totalCount: 12,
    pulledCount: 11,
    description: 'Test mesajı',
    account: 'Yasin Yıldız',
    sender: 'Yasin Yıldız',
    created_at: new Date()
  },
  {
    id: 2,
    date: '2025-07-31',
    totalCount: 123,
    pulledCount: 110,
    description: 'Test mesajı 2',
    account: 'Abdullah Özdemir',
    sender: 'Abdullah Özdemir',
    created_at: new Date()
  }
];

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

  if (req.method === 'GET') {
    res.status(200).json(mockMessages);
  } else if (req.method === 'POST') {
    const newMessage = {
      id: Date.now(),
      ...req.body,
      sender: req.body.sender || 'admin',
      created_at: new Date()
    };
    mockMessages.push(newMessage);
    res.status(201).json(newMessage);
  } else if (req.method === 'PUT') {
    const messageId = parseInt(req.url.split('/').pop());
    const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      const updatedMessage = {
        id: messageId,
        ...req.body,
        sender: req.body.sender || 'admin',
        created_at: new Date()
      };
      mockMessages[messageIndex] = updatedMessage;
      res.status(200).json(updatedMessage);
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } else if (req.method === 'DELETE') {
    const messageId = parseInt(req.url.split('/').pop());
    const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      mockMessages.splice(messageIndex, 1);
      res.status(200).json({ message: 'Message deleted successfully' });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 