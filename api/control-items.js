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

  // Mock data for control items
  const mockControlItems = [
    {
      _id: '1',
      title: 'Günlük Kontrol',
      description: 'Günlük sistem kontrolü',
      period: 'Günlük',
      date: '2024-01-15',
      facilityId: '1',
      workDone: 'Tamamlandı',
      user: 'admin',
      status: 'Tamamlandı',
      createdAt: new Date()
    },
    {
      _id: '2',
      title: 'Haftalık Kontrol',
      description: 'Haftalık sistem kontrolü',
      period: 'Haftalık',
      date: '2024-01-20',
      facilityId: '2',
      workDone: 'Devam ediyor',
      user: 'admin',
      status: 'Devam ediyor',
      createdAt: new Date()
    }
  ];

  if (req.method === 'GET') {
    res.status(200).json(mockControlItems);
  } else if (req.method === 'POST') {
    const newItem = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    res.status(201).json(newItem);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 