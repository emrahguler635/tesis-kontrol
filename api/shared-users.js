// Merkezi kullanıcı listesi - Hem api/login.js hem de api/users.js tarafından kullanılır
let mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@admin.com',
    role: 'admin', // Admin kullanıcısı admin rolünde
    password: 'admin123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Toplam Yapılan İşler', 'Raporlar', 'Mesaj Yönetimi', 'BağTV Yönetim', 'YBS İş Programı', 'YBS Onay Ekranları', 'Veri Kontrol', 'Onay Yönetimi', 'Yapılan İşler', 'Kullanıcı Yönetimi', 'Ayarlar'],
    created_at: new Date('2025-07-29')
  },
  {
    id: 999, // ID'yi değiştirdim
    username: 'emrah',
    email: 'emrah@test.com',
    role: 'user', // Normal kullanıcı user rolünde
    password: 'emrah123',
    permissions: ['Ana Sayfa'], // SADECE ANA SAYFA - TAMAMEN YENİ
    created_at: new Date('2025-08-08') // Tarihi de güncelledim
  },
  {
    id: 3,
    username: 'Ferhat',
    email: 'ferhat.yilmaz@bagcilar.bel.tr',
    role: 'user', // Normal kullanıcı user rolünde
    password: 'ferhat123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı'],
    created_at: new Date('2025-07-30')
  },
  {
    id: 4,
    username: 'emrah1',
    email: 'test@hotmail.com',
    role: 'user', // Normal kullanıcı user rolünde
    password: 'emrah123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Raporlar'],
    created_at: new Date('2025-08-03')
  },
  {
    id: 5,
    username: 'emrah2',
    email: 'emrah@test.com.tr',
    role: 'user', // Normal kullanıcı user rolünde
    password: 'emrah123',
    permissions: ['Ana Sayfa', 'Tesisler'],
    created_at: new Date('2025-08-03')
  }
];

module.exports = {
  mockUsers,
  updateUser: (userId, updatedUser) => {
    try {
      if (!userId || isNaN(userId)) {
        console.log(`❌ Geçersiz kullanıcı ID: ${userId}`);
        return false;
      }

      const parsedUserId = parseInt(userId);
      const userIndex = mockUsers.findIndex(user => user.id === parsedUserId);
      
      console.log(`🔍 Aranan kullanıcı ID: ${parsedUserId}`);
      console.log(`🔍 Mevcut kullanıcılar:`, mockUsers.map(u => ({ id: u.id, username: u.username })));
      console.log(`🔍 Bulunan index: ${userIndex}`);
      
      if (userIndex !== -1) {
        // Mevcut kullanıcının bilgilerini koru, sadece güncellenen alanları değiştir
        const existingUser = mockUsers[userIndex];
        mockUsers[userIndex] = {
          ...existingUser,
          username: updatedUser.username || existingUser.username,
          email: updatedUser.email || existingUser.email,
          password: updatedUser.password || existingUser.password,
          // created_at'i koru, sadece güncellenen alanları değiştir
          created_at: existingUser.created_at,
          // Role'ü güncelle - admin veya user
          role: updatedUser.role || existingUser.role || 'user',
          // Yetkileri doğru şekilde kaydet
          permissions: updatedUser.permissions || existingUser.permissions || ['Ana Sayfa']
        };
        
        console.log(`✅ Kullanıcı ${parsedUserId} güncellendi:`, mockUsers[userIndex]);
        return true;
      }
      console.log(`❌ Kullanıcı ${parsedUserId} bulunamadı`);
      return false;
    } catch (error) {
      console.error(`❌ Kullanıcı ${userId} güncellenirken hata:`, error);
      return false;
    }
  },
  addUser: (newUser) => {
    // Yeni kullanıcılar varsayılan olarak user rolünde
    const userToAdd = {
      ...newUser,
      role: newUser.role || 'user', // Varsayılan olarak user
      permissions: newUser.permissions || ['Ana Sayfa']
    };
    
    mockUsers.push(userToAdd);
    console.log(`✅ Yeni kullanıcı eklendi:`, userToAdd);
  },
  deleteUser: (userId) => {
    const parsedUserId = parseInt(userId);
    const userIndex = mockUsers.findIndex(user => user.id === parsedUserId);
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
      return true;
    }
    return false;
  }
}; 