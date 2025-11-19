// src/app/devtool/user-management/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSpinner,
  faSearch,
  faUser,
  faEnvelope,
  faLock,
  faUserTag
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useDialog } from '@/app/contexts/DialogContext';
import { useAuth } from '@/app/contexts/AuthContext';

interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { showConfirm, showSuccess, showError } = useDialog();
  const { user: currentUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'user',
  });

  // ตรวจสอบ role
  const allowedRoles = ['dev', 'superadmin', 'admin'];
  const canAccess = currentUser && allowedRoles.includes(currentUser.role);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        showError('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถโหลดข้อมูล users ได้');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูล users ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  // ถ้าไม่มีสิทธิ์เข้าถึง
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
        </div>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'user',
    });
    setIsCreating(false);
    setIsEditing(null);
    setEditingUser(null);
  };

  // Create user
  const handleCreate = async () => {
    if (!formData.username || !formData.password) {
      showError('ข้อมูลไม่ครบ', 'กรุณากรอก Username และ Password');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('สร้าง User สำเร็จ', `สร้าง User "${formData.username}" สำเร็จแล้ว`);
        resetForm();
        fetchUsers();
      } else {
        showError('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถสร้าง User ได้');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง User ได้');
    }
  };

  // Edit user
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '', // ไม่แสดง password เดิม
      name: user.name,
      role: user.role,
    });
    setIsEditing(user.id);
  };

  // Update user
  const handleUpdate = async () => {
    if (!editingUser) return;

    if (!formData.username) {
      showError('ข้อมูลไม่ครบ', 'กรุณากรอก Username');
      return;
    }

    try {
      const updateData: {
        username: string;
        email: string | null;
        name: string;
        role: string;
        password?: string;
      } = {
        username: formData.username,
        email: formData.email || null,
        name: formData.name,
        role: formData.role,
      };

      // ถ้ามี password ใหม่ ให้เพิ่มเข้าไป
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('อัปเดต User สำเร็จ', `อัปเดต User "${formData.username}" สำเร็จแล้ว`);
        resetForm();
        fetchUsers();
      } else {
        showError('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถอัปเดต User ได้');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดต User ได้');
    }
  };

  // Delete user
  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      showError('ไม่สามารถลบได้', 'ไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }

    showConfirm(
      'ยืนยันการลบ',
      `คุณต้องการลบ User "${user.username}" ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถยกเลิกได้`,
      async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (result.success) {
            showSuccess('ลบ User สำเร็จ', `ลบ User "${user.username}" สำเร็จแล้ว`);
            fetchUsers();
          } else {
            showError('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถลบ User ได้');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบ User ได้');
        }
      }
    );
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'dev':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'superadmin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-3 text-blue-600" />
            จัดการ Users
          </motion.h1>
          <motion.p
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            จัดการ users ทั้งหมดในระบบ
          </motion.p>
        </div>

        {/* Search and Create Button */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="ค้นหา username, name, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <motion.button
            onClick={() => setIsCreating(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            สร้าง User ใหม่
          </motion.button>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isEditing ? 'แก้ไข User' : 'สร้าง User ใหม่'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faLock} className="mr-2" />
                  Password {isEditing ? '(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faUserTag} className="mr-2" />
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="dev">Dev</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <motion.button
                onClick={isEditing ? handleUpdate : handleCreate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {isEditing ? 'อัปเดต' : 'สร้าง'}
              </motion.button>
              <motion.button
                onClick={resetForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ยกเลิก
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูล</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString('th-TH')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <motion.button
                            onClick={() => handleEdit(user)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="แก้ไข"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </motion.button>
                          {user.id !== currentUser?.id && (
                            <motion.button
                              onClick={() => handleDelete(user)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="ลบ"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          แสดง {filteredUsers.length} จาก {users.length} users
        </div>
      </div>
    </div>
  );
}

