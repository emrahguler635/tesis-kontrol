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

  // Mock data for BagTV facilities
  const mockBagTVFacilities = [
    {
      _id: '1',
      name: 'BagTV Merkez',
      tvCount: 5,
      description: 'Merkez BagTV tesisleri',
      status: 'Aktif',
      createdAt: new Date()
    },
    {
      _id: '2',
      name: 'BagTV Şube',
      tvCount: 3,
      description: 'Şube BagTV tesisleri',
      status: 'Aktif',
      createdAt: new Date()
    }
  ];

  if (req.method === 'GET') {
    res.status(200).json(mockBagTVFacilities);
  } else if (req.method === 'POST') {
    const newFacility = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    res.status(201).json(newFacility);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 