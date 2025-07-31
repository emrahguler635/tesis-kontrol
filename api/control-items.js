// In-memory storage for control items
let mockControlItems = [
  {
    id: 1,
    title: 'Günlük Test İş 1',
    description: 'Günlük test açıklama',
    period: 'Günlük',
    date: '2025-07-31',
    facilityId: '1',
    workDone: 'Test iş yapıldı',
    user: 'admin',
    status: 'Tamamlandı',
    created_at: new Date()
  },
  {
    id: 2,
    title: 'Haftalık Test İş 1',
    description: 'Haftalık test açıklama',
    period: 'Haftalık',
    date: '2025-07-31',
    facilityId: '2',
    workDone: 'Test iş yapıldı',
    user: 'user1',
    status: 'İşlemde',
    created_at: new Date()
  },
  {
    id: 3,
    title: '1112222',
    description: 'aaaaaa',
    period: 'Günlük',
    date: '2025-07-31',
    facilityId: '2',
    workDone: '',
    user: 'emrah',
    status: 'İşlemde',
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
    res.status(200).json(mockControlItems);
  } else if (req.method === 'POST') {
    const newItem = {
      id: Date.now(),
      ...req.body,
      created_at: new Date()
    };
    mockControlItems.push(newItem);
    res.status(201).json(newItem);
  } else if (req.method === 'PUT') {
    console.log('PUT request received:', req.url);
    console.log('Request body:', req.body);
    
    // URL'den ID'yi çıkar
    const urlParts = req.url.split('/');
    const itemId = parseInt(urlParts[urlParts.length - 1]);
    console.log('Extracted itemId:', itemId);
    
    const itemIndex = mockControlItems.findIndex(item => item.id === itemId);
    console.log('Found itemIndex:', itemIndex);
    
    if (itemIndex !== -1) {
      const updatedItem = {
        ...mockControlItems[itemIndex],
        ...req.body,
        id: itemId,
        created_at: new Date()
      };
      mockControlItems[itemIndex] = updatedItem;
      console.log('Updated item:', updatedItem);
      res.status(200).json(updatedItem);
    } else {
      console.log('Item not found for id:', itemId);
      res.status(404).json({ error: 'Control item not found' });
    }
  } else if (req.method === 'DELETE') {
    const itemId = parseInt(req.url.split('/').pop());
    const itemIndex = mockControlItems.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      mockControlItems.splice(itemIndex, 1);
      res.status(200).json({ message: 'Control item deleted successfully' });
    } else {
      res.status(404).json({ error: 'Control item not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 