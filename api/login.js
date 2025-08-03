const { mockUsers } = require('./shared-users');

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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }
    
    // Kullanıcıyı bul
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    // Debug için geçici log
    console.log('🔍 Login Debug:', {
      username,
      password,
      foundUser: user,
      userPermissions: user?.permissions
    });
    
    if (user) {
      res.status(200).json({
        success: true,
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        message: 'Giriş başarılı'
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Sunucu hatası' 
    });
  }
}; 