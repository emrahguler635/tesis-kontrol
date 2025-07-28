module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only handle POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }
    
    // Basit kontrol
    if (username === 'admin' && password === 'admin123') {
      console.log('Login successful for user:', username);
      res.status(200).json({
        id: 'admin-id',
        username: 'admin',
        email: 'admin@admin.com',
        role: 'admin'
      });
    } else {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}; 