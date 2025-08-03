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

  if (req.method === 'GET') {
    res.status(200).json(mockUsers);
  } else if (req.method === 'POST') {
    const newUser = {
      id: Date.now(),
      ...req.body,
      created_at: new Date()
    };
    addUser(newUser);
    res.status(201).json(newUser);
  } else if (req.method === 'PUT') {
    const userId = req.url.split('/').pop();
    const updatedUser = {
      id: parseInt(userId),
      ...req.body,
      created_at: new Date()
    };
    
    // Kullanıcı güncellemesi yapıldığında console'a detaylı log yazdır
    console.log('🔧 Kullanıcı güncellendi:', updatedUser);
    console.log('✅ Merkezi kullanıcı listesi güncellendi');
    console.log('📋 Güncellenen kullanıcı bilgileri:');
    console.log(`   - ID: ${updatedUser.id}`);
    console.log(`   - Kullanıcı Adı: ${updatedUser.username}`);
    console.log(`   - E-posta: ${updatedUser.email}`);
    console.log(`   - Rol: ${updatedUser.role}`);
    console.log(`   - Yetkiler: ${JSON.stringify(updatedUser.permissions)}`);
    
    // Merkezi listeyi güncelle
    const success = updateUser(parseInt(userId), updatedUser);
    if (success) {
      console.log('✅ Merkezi kullanıcı listesi güncellendi');
      console.log('🔄 Hem api/login.js hem de api/users.js aynı listeyi kullanıyor');
    }
    
    res.status(200).json(updatedUser);
  } else if (req.method === 'DELETE') {
    const userId = req.url.split('/').pop();
    const success = deleteUser(parseInt(userId));
    res.status(200).json({ message: 'User deleted successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 