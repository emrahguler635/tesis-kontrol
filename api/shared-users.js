// Merkezi kullanıcı listesi - Hem api/login.js hem de api/users.js tarafından kullanılır
let mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    password: 'admin123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Haftalık İşler', 'Raporlar', 'Mesaj Yönetimi', 'BağTV', 'Veri Kontrol', 'Ayarlar', 'Kullanıcı Yönetimi'],
    created_at: new Date()
  },
  {
    id: 2,
    username: 'Ferhat Yilmaz',
    email: 'ferhat@example.com',
    role: 'admin',
    password: 'ferhat123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Haftalık İşler', 'Raporlar'],
    created_at: new Date()
  },
  {
    id: 3,
    username: 'emrah',
    email: 'emrah@example.com',
    role: 'admin',
    password: 'emrah123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Haftalık İşler', 'Raporlar', 'Mesaj Yönetimi'],
    created_at: new Date()
  },
  {
    id: 4,
    username: 'Yasin Yıldız',
    email: 'yasin@example.com',
    role: 'admin',
    password: 'yasin123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Haftalık İşler'],
    created_at: new Date()
  },
  {
    id: 5,
    username: 'Abdullah Özdemir',
    email: 'abdullah@example.com',
    role: 'admin',
    password: 'abdullah123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Haftalık İşler', 'Raporlar'],
    created_at: new Date()
  },
  {
    id: 6,
    username: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    role: 'admin',
    password: 'ahmet123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Haftalık İşler', 'Raporlar', 'Mesaj Yönetimi'],
    created_at: new Date()
  },
  {
    id: 7,
    username: 'test',
    email: 'test@example.com',
    role: 'admin',
    password: 'test123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Haftalık İşler', 'Raporlar'],
    created_at: new Date()
  },
  {
    id: 8,
    username: 'emrah1',
    email: 'test@hotmail.com',
    role: 'admin',
    password: 'emrah123',
    permissions: ['Ana Sayfa', 'Tesisler', 'Günlük İş Programı', 'Raporlar'],
    created_at: new Date()
  }
];

module.exports = {
  mockUsers,
  updateUser: (userId, updatedUser) => {
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updatedUser,
        created_at: mockUsers[userIndex].created_at
      };
      return true;
    }
    return false;
  },
  addUser: (newUser) => {
    mockUsers.push(newUser);
  },
  deleteUser: (userId) => {
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
      return true;
    }
    return false;
  }
}; 