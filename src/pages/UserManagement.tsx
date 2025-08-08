import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, UserCheck, UserX } from 'lucide-react';
import { apiService } from '../services/api';
import { Card } from '../components/Card';
import { useAuthStore } from '../store';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
  created_at?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user', // Varsayılan olarak user
    permissions: ['Ana Sayfa']
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Kullanıcıları yükle
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData = await apiService.getUsers();
        
        // Permissions'ları doğru şekilde parse et
        const processedUsers = usersData.map((user: any) => {
          let userPermissions = ['Ana Sayfa'];
          if (user.permissions) {
            if (typeof user.permissions === 'string') {
              try {
                userPermissions = JSON.parse(user.permissions);
              } catch (error) {
                console.error('Permissions parse error:', error);
                userPermissions = ['Ana Sayfa'];
              }
            } else if (Array.isArray(user.permissions)) {
              userPermissions = user.permissions;
            }
          }
          
          return {
            ...user,
            permissions: userPermissions
          };
        });
        
        setUsers(processedUsers);
      } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await apiService.createUser({
        username: editItem.username,
        email: editItem.email,
        password: editItem.password,
        role: editItem.role, // Kullanıcının seçtiği role'ü kullan
        permissions: Array.isArray(editItem.permissions) ? editItem.permissions : ['Ana Sayfa']
      });
      
      // Verileri otomatik yenile
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const usersData = await apiService.getUsers();
          
          // Permissions'ları doğru şekilde parse et
          const processedUsers = usersData.map((user: any) => {
            let userPermissions = ['Ana Sayfa'];
            if (user.permissions) {
              if (typeof user.permissions === 'string') {
                try {
                  userPermissions = JSON.parse(user.permissions);
                } catch (error) {
                  console.error('Permissions parse error:', error);
                  userPermissions = ['Ana Sayfa'];
                }
              } else if (Array.isArray(user.permissions)) {
                userPermissions = user.permissions;
              }
            }
            
            return {
              ...user,
              permissions: userPermissions
            };
          });
          
          setUsers(processedUsers);
        } catch (error) {
          console.error('Kullanıcılar yüklenirken hata:', error);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchUsers();
      setModalOpen(false);
      setEditItem({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'user', // Varsayılan olarak user
        permissions: ['Ana Sayfa']
      });
    } catch (error) {
      console.error('Kullanıcı kaydedilirken hata:', error);
      alert('Kullanıcı kaydedilirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteUser(id);
      
      // Verileri otomatik yenile
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const usersData = await apiService.getUsers();
          
          // Permissions'ları doğru şekilde parse et
          const processedUsers = usersData.map((user: any) => {
            let userPermissions = ['Ana Sayfa'];
            if (user.permissions) {
              if (typeof user.permissions === 'string') {
                try {
                  userPermissions = JSON.parse(user.permissions);
                } catch (error) {
                  console.error('Permissions parse error:', error);
                  userPermissions = ['Ana Sayfa'];
                }
              } else if (Array.isArray(user.permissions)) {
                userPermissions = user.permissions;
              }
            }
            
            return {
              ...user,
              permissions: userPermissions
            };
          });
          
          setUsers(processedUsers);
        } catch (error) {
          console.error('Kullanıcılar yüklenirken hata:', error);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchUsers();
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    
    // Permissions'ları doğru şekilde parse et
    let userPermissions = ['Ana Sayfa'];
    if (user.permissions) {
      if (typeof user.permissions === 'string') {
        try {
          userPermissions = JSON.parse(user.permissions);
        } catch (error) {
          console.error('Permissions parse error:', error);
          userPermissions = ['Ana Sayfa'];
        }
      } else if (Array.isArray(user.permissions)) {
        userPermissions = user.permissions;
      }
    }
    
    setEditItem({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role, // Kullanıcının mevcut role'ünü kullan
      permissions: userPermissions
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const updatedUser = await apiService.updateUser(editingUser.id, {
        username: editItem.username,
        email: editItem.email,
        password: editItem.password || undefined,
        role: editItem.role, // Kullanıcının seçtiği role'ü kullan
        permissions: Array.isArray(editItem.permissions) ? editItem.permissions : ['Ana Sayfa']
      });
      
      // Store'u güncelle - eğer güncellenen kullanıcı mevcut kullanıcı ise
      const { user, updateUser } = useAuthStore.getState();
      if (user && String(user.id) === String(editingUser.id)) {
        const updatedUserData = {
          username: editItem.username,
          email: editItem.email,
          role: editItem.role,
          permissions: Array.isArray(editItem.permissions) ? editItem.permissions : ['Ana Sayfa']
        };
        updateUser(updatedUserData);
        console.log('🔍 Store güncellendi:', updatedUserData);
      }
      
      // Verileri otomatik yenile
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const usersData = await apiService.getUsers();
          
          // Permissions'ları doğru şekilde parse et
          const processedUsers = usersData.map((user: any) => {
            let userPermissions = ['Ana Sayfa'];
            if (user.permissions) {
              if (typeof user.permissions === 'string') {
                try {
                  userPermissions = JSON.parse(user.permissions);
                } catch (error) {
                  console.error('Permissions parse error:', error);
                  userPermissions = ['Ana Sayfa'];
                }
              } else if (Array.isArray(user.permissions)) {
                userPermissions = user.permissions;
              }
            }
            
            return {
              ...user,
              permissions: userPermissions
            };
          });
          
          setUsers(processedUsers);
        } catch (error) {
          console.error('Kullanıcılar yüklenirken hata:', error);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchUsers();
      setEditModalOpen(false);
      setEditingUser(null);
      setEditItem({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'user', // Varsayılan olarak user
        permissions: ['Ana Sayfa']
      });
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata:', error);
      // Daha detaylı hata mesajı
      let errorMessage = 'Bilinmeyen hata';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      alert(`❌ Kullanıcı güncellenirken bir hata oluştu.\n\nHata detayı: ${errorMessage}\n\nLütfen tekrar deneyin.`);
    }
  };

  const activeUsers = users.filter(user => user.role !== 'deleted').length;
  const adminUsers = users.filter(user => user.role === 'admin').length;

  const modulePermissions = [
    { key: 'Ana Sayfa', value: 'Ana Sayfa' },
    { key: 'Günlük İş Programı', value: 'Günlük İş Programı' },
    { key: 'Raporlar', value: 'Raporlar' },
    { key: 'BağTV Yönetim', value: 'BağTV Yönetim' },
    { key: 'YBS Onay Ekranları', value: 'YBS Onay Ekranları' },
    { key: 'Onay Yönetimi', value: 'Onay Yönetimi' },
    { key: 'Kullanıcı Yönetimi', value: 'Kullanıcı Yönetimi' },
    { key: 'Tesisler', value: 'Tesisler' },
    { key: 'Toplam Yapılan İşler', value: 'Toplam Yapılan İşler' },
    { key: 'Mesaj Yönetimi', value: 'Mesaj Yönetimi' },
    { key: 'YBS İş Programı', value: 'YBS İş Programı' },
    { key: 'Veri Kontrol', value: 'Veri Kontrol' },
    { key: 'Yapılan İşler', value: 'Yapılan İşler' },
    { key: 'Ayarlar', value: 'Ayarlar' }
  ];

  return (
    <div className="space-y-6 h-screen overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Kullanıcı hesapları ve yetki yönetimi - Tüm kullanıcılar Admin rolünde</p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{adminUsers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Kontroller */}
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Kullanıcı Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Yükleniyor...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {user.username}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                    
                    {/* Yetkiler */}
                    {user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Yetkiler ({user.permissions.length}):
                        </p>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {user.permissions.slice(0, 4).map((permission, index) => (
                            <span key={index} className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                              {permission}
                            </span>
                          ))}
                          {user.permissions.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{user.permissions.length - 4} daha
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => handleEdit(user)}
                    title="Düzenle"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => handleDelete(user.id)}
                    title="Sil"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                {user.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Kayıt Tarihi</span>
                    <span className="text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && users.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kullanıcı yok</h3>
            <p className="text-gray-500">İlk kullanıcınızı eklemek için yukarıdaki butonu kullanın.</p>
          </div>
        </Card>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Yeni Kullanıcı Ekle</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  name="username"
                  value={editItem.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  value={editItem.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  name="role"
                  value={editItem.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  name="password"
                  value={editItem.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">ℹ️ Bilgi</p>
                <p className="text-xs text-blue-700">
                  <strong>Admin</strong> rolündeki kullanıcılar tüm modülleri görebilir. 
                  <strong>User</strong> rolündeki kullanıcılar sadece aşağıda seçilen modül yetkilerine sahip olur.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modül Yetkileri
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {modulePermissions.map(({ key, value }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(editItem.permissions) && editItem.permissions.includes(value)}
                        onChange={(e) => {
                          const currentPermissions = Array.isArray(editItem.permissions) ? editItem.permissions : [];
                          if (e.target.checked) {
                            setEditItem(prev => ({
                              ...prev,
                              permissions: [...currentPermissions, value]
                            }));
                          } else {
                            setEditItem(prev => ({
                              ...prev,
                              permissions: currentPermissions.filter(p => p !== value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Kullanıcı Düzenle</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  name="username"
                  value={editItem.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  value={editItem.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  name="role"
                  value={editItem.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre (Boş bırakılırsa değişmez)
                </label>
                <input
                  type="password"
                  name="password"
                  value={editItem.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Yeni şifre girin..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">ℹ️ Bilgi</p>
                <p className="text-xs text-blue-700">
                  <strong>Admin</strong> rolündeki kullanıcılar tüm modülleri görebilir. 
                  <strong>User</strong> rolündeki kullanıcılar sadece aşağıda seçilen modül yetkilerine sahip olur.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modül Yetkileri
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {modulePermissions.map(({ key, value }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(editItem.permissions) && editItem.permissions.includes(value)}
                        onChange={(e) => {
                          const currentPermissions = Array.isArray(editItem.permissions) ? editItem.permissions : [];
                          if (e.target.checked) {
                            setEditItem(prev => ({
                              ...prev,
                              permissions: [...currentPermissions, value]
                            }));
                          } else {
                            setEditItem(prev => ({
                              ...prev,
                              permissions: currentPermissions.filter(p => p !== value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 