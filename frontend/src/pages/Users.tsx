import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, UserCheck, UserX, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { formatDate, cn } from '../lib/utils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data.items);  // ✅ fixed
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      toast.success('Role updated successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}`, { is_active: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch {
        toast.error('Failed to delete user');
      }
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    analysts: users.filter(u => u.role === 'analyst').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">User Management</h2>
        <p className="text-slate-400 text-sm mt-1">Manage system access and user roles.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center text-slate-400 mb-2">
            <UsersIcon className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center text-emerald-400 mb-2">
            <UserCheck className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Active Users</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.active}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center text-rose-400 mb-2">
            <ShieldAlert className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Admins</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.admins}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center text-cyan-400 mb-2">
            <ShieldCheck className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Analysts</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.analysts}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Member Since</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <LoadingSpinner size={32} className="mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <UsersIcon className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium text-slate-400">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user: User) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border',
                        user.role === 'admin'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : user.role === 'analyst'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={cn(
                          'w-2 h-2 rounded-full mr-2',
                          user.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                        )} />
                        <span className={user.is_active ? 'text-emerald-400' : 'text-rose-400'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-3">
                        {/* Role Selector */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-md py-1 px-2 text-xs text-slate-300 focus:ring-1 focus:ring-cyan-500 outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="analyst">Analyst</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Toggle Active */}
                        <button
                          onClick={() => handleStatusToggle(user.id, user.is_active)}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            user.is_active
                              ? 'text-emerald-400 hover:text-rose-400 hover:bg-slate-800'
                              : 'text-rose-400 hover:text-emerald-400 hover:bg-slate-800'
                          )}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active
                            ? <UserX className="w-4 h-4" />
                            : <UserCheck className="w-4 h-4" />
                          }
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};