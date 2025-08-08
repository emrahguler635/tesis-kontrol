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
      userRole: user?.role,
      userPermissions: user?.permissions,
      allUsers: mockUsers.map(u => ({ username: u.username, role: u.role, permissions: u.permissions }))
    });
    
    // emrah kullanıcısı için özel debug
    if (username === 'emrah') {
      console.log('🔍 EMRAH KULLANICISI DEBUG:', {
        foundUser: user,
        userRole: user?.role,
        userPermissions: user?.permissions,
        permissionsLength: user?.permissions?.length || 0,
        permissionsArray: user?.permissions || []
      });
    }
    
    if (user) {
      // emrah kullanıcısı için özel kontrol - AGGRESIF
      if (username === 'emrah') {
        // emrah kullanıcısının yetkilerini zorla sıfırla
        user.permissions = ['Ana Sayfa'];
        user.role = 'user';
        user.id = 999; // ID'yi de zorla güncelle
        console.log('🔍 EMRAH KULLANICISI ZORLA SIFIRLANDI:', {
          username: user.username,
          role: user.role,
          permissions: user.permissions,
          id: user.id
        });
      }
      
      // Kullanıcının gerçek role'ünü kullan
      const responseData = {
        success: true,
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // Gerçek role'ü kullan
        permissions: user.permissions,
        message: 'Giriş başarılı'
      };
      
      // emrah için özel debug
      if (username === 'emrah') {
        console.log('🔍 EMRAH RESPONSE DATA:', responseData);
      }
      
      res.status(200).json(responseData);
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