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

  // Mock data for users
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      created_at: new Date()
    },
    {
      id: 2,
      username: 'Ferhat Yilmaz',
      email: 'ferhat@example.com',
      role: 'user',
      created_at: new Date()
    },
    {
      id: 3,
      username: 'emrah',
      email: 'emrah@example.com',
      role: 'user',
      created_at: new Date()
    },
    {
      id: 4,
      username: 'Yasin Yıldız',
      email: 'yasin@example.com',
      role: 'user',
      created_at: new Date()
    },
    {
      id: 5,
      username: 'Abdullah Özdemir',
      email: 'abdullah@example.com',
      role: 'user',
      created_at: new Date()
    }
  ];

  if (req.method === 'GET') {
    res.status(200).json(mockUsers);
  } else if (req.method === 'POST') {
    const newUser = {
      id: Date.now(),
      ...req.body,
      created_at: new Date()
    };
    res.status(201).json(newUser);
  } else if (req.method === 'PUT') {
    const userId = req.url.split('/').pop();
    const updatedUser = {
      id: parseInt(userId),
      ...req.body,
      created_at: new Date()
    };
    res.status(200).json(updatedUser);
  } else if (req.method === 'DELETE') {
    res.status(200).json({ message: 'User deleted successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 