const { mockUsers, updateUser, addUser, deleteUser } = require('./shared-users');

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

  console.log('🔍 users.js - Method:', req.method);
  console.log('🔍 users.js - URL:', req.url);
  console.log('🔍 users.js - Query:', req.query);
  console.log('🔍 users.js - Body:', req.body);

  if (req.method === 'GET') {
    res.status(200).json(mockUsers);
  } else if (req.method === 'POST') {
    const newUser = {
      id: Date.now(),
      ...req.body,
      // Role'ü doğru şekilde kaydet
      role: req.body.role || 'user',
      // Yetkileri doğru şekilde kaydet
      permissions: req.body.permissions || ['Ana Sayfa'],
      created_at: new Date()
    };
    
    console.log('🔧 Yeni kullanıcı oluşturuldu:', newUser);
    console.log('📋 Yeni kullanıcı bilgileri:');
    console.log(`   - ID: ${newUser.id}`);
    console.log(`   - Kullanıcı Adı: ${newUser.username}`);
    console.log(`   - E-posta: ${newUser.email}`);
    console.log(`   - Rol: ${newUser.role}`);
    console.log(`   - Yetkiler: ${JSON.stringify(newUser.permissions)}`);
    
    addUser(newUser);
    res.status(201).json(newUser);
  } else if (req.method === 'PUT') {
    try {
      // ID'yi query parametresinden al
      const userId = req.query.id;
      console.log('🔍 PUT isteği - Query ID:', userId);
      
      if (!userId || isNaN(parseInt(userId))) {
        console.log('❌ Geçersiz kullanıcı ID:', userId);
        res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
        return;
      }

      const parsedUserId = parseInt(userId);
      console.log('🔍 Güncellenecek kullanıcı ID:', parsedUserId);

      // Body'den gelen verileri kontrol et
      if (!req.body || !req.body.username || !req.body.email) {
        console.log('❌ Eksik kullanıcı bilgileri');
        res.status(400).json({ error: 'Eksik kullanıcı bilgileri' });
        return;
      }

      const updatedUser = {
        id: parsedUserId,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password || undefined,
        // Role'ü doğru şekilde kaydet
        role: req.body.role || 'user',
        // Yetkileri doğru şekilde kaydet
        permissions: req.body.permissions || ['Ana Sayfa']
      };
      
      // Kullanıcı güncellemesi yapıldığında console'a detaylı log yazdır
      console.log('🔧 Kullanıcı güncellendi:', updatedUser);
      console.log('📋 Güncellenen kullanıcı bilgileri:');
      console.log(`   - ID: ${updatedUser.id}`);
      console.log(`   - Kullanıcı Adı: ${updatedUser.username}`);
      console.log(`   - E-posta: ${updatedUser.email}`);
      console.log(`   - Rol: ${updatedUser.role}`);
      console.log(`   - Yetkiler: ${JSON.stringify(updatedUser.permissions)}`);
      
      // Merkezi listeyi güncelle
      const success = updateUser(parsedUserId, updatedUser);
      if (success) {
        console.log('✅ Merkezi kullanıcı listesi güncellendi');
        console.log('🔄 Hem api/login.js hem de api/users.js aynı listeyi kullanıyor');
        res.status(200).json(updatedUser);
      } else {
        console.log('❌ Kullanıcı güncellenemedi - kullanıcı bulunamadı');
        res.status(404).json({ error: 'Kullanıcı bulunamadı veya güncellenemedi' });
      }
    } catch (error) {
      console.error('❌ Kullanıcı güncelleme hatası:', error);
      res.status(500).json({ error: 'Sunucu hatası: Kullanıcı güncellenemedi' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // ID'yi query parametresinden al
      const userId = req.query.id;
      console.log('🔍 DELETE isteği - Query ID:', userId);
      
      if (!userId || isNaN(parseInt(userId))) {
        console.log('❌ Geçersiz kullanıcı ID:', userId);
        res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
        return;
      }

      const parsedUserId = parseInt(userId);
      const success = deleteUser(parsedUserId);
      if (success) {
        res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
      } else {
        res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
    } catch (error) {
      console.error('❌ Kullanıcı silme hatası:', error);
      res.status(500).json({ error: 'Sunucu hatası: Kullanıcı silinemedi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 