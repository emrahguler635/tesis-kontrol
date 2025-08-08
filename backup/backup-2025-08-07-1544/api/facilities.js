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

  // Mock data for facilities
  const mockFacilities = [
    {
      _id: '1',
      name: 'Merkez Ofis',
      description: 'Ana merkez ofis',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: 'Şube Ofis',
      description: 'Şube ofis',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  if (req.method === 'GET') {
    res.status(200).json(mockFacilities);
  } else if (req.method === 'POST') {
    const newFacility = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    res.status(201).json(newFacility);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 