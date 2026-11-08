import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  Shield,
  Database,
  KeyRound,
  Check,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Clock
} from 'lucide-react';

export default function AdminModal({ isOpen, onClose, authFetch }) {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'stats' | 'password'
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'sessions') {
        const res = await authFetch('/api/admin/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } else if (activeTab === 'stats') {
        const res = await authFetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (token) => {
    if (!confirm('Are you sure you want to disconnect this device?')) return;
    try {
      const res = await authFetch(`/api/admin/sessions/${token}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMsg('Device revoked successfully.');
        setTimeout(() => setActionMsg(''), 3000);
        loadData();
      }
    } catch (err) {
      setErrorMsg('Failed to revoke: ' + err.message);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm('Disconnect all other devices except this one?')) return;
    try {
      const res = await authFetch('/api/admin/sessions/revoke-others', { method: 'POST' });
      if (res.ok) {
        setActionMsg('All other devices have been disconnected.');
        setTimeout(() => setActionMsg(''), 3000);
        loadData();
      }
    } catch (err) {
      setErrorMsg('Failed to revoke others: ' + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      const res = await authFetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setActionMsg('Password updated successfully! Keep it safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Unknown';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Active just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-xl flex-col rounded-2xl border border-gray-700 bg-[#26272b] shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10a37f]/20 text-[#10a37f]">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Admin & Device Portal</h2>
              <p className="text-xs text-gray-400">Manage sessions, security, and SQLite database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700/60 bg-[#1e1f23] px-5">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'border-[#10a37f] text-[#10a37f]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Connected Devices ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-medium transition-colors ${
              activeTab === 'stats'
                ? 'border-[#10a37f] text-[#10a37f]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Database size={14} />
            <span>Database & Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-medium transition-colors ${
              activeTab === 'password'
                ? 'border-[#10a37f] text-[#10a37f]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <KeyRound size={14} />
            <span>Security</span>
          </button>
        </div>

        {/* Status Banners */}
        {actionMsg && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/40 px-5 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <Check size={14} />
            <span>{actionMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-950/40 border-b border-red-500/40 px-5 py-2 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: CONNECTED DEVICES */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase text-gray-400">
                  Active Logged-in Devices
                </span>
                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeOthers}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-900/40 transition-colors"
                  >
                    <LogOut size={12} />
                    <span>Kick All Other Devices</span>
                  </button>
                )}
              </div>

              {sessions.map((sess) => {
                const isPhone = /iPhone|Android|iPad/i.test(sess.device_name);
                return (
                  <div
                    key={sess.token}
                    className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                      sess.isCurrent
                        ? 'border-[#10a37f]/50 bg-[#10a37f]/5'
                        : 'border-gray-700/60 bg-[#202124]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        sess.isCurrent ? 'bg-[#10a37f]/20 text-[#10a37f]' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {isPhone ? <Smartphone size={20} /> : <Laptop size={20} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{sess.device_name}</span>
                          {sess.isCurrent && (
                            <span className="rounded-full bg-[#10a37f]/20 px-2 py-0.5 text-[10px] font-semibold text-[#10a37f]">
                              This Device
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Globe size={11} /> {sess.ip} ({sess.country})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formatTime(sess.last_active)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.token)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-950/50 hover:text-red-400 transition-colors"
                        title="Disconnect this device"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: DATABASE & STATS */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-700/60 bg-[#202124] p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stats.conversations}</div>
                  <div className="text-xs text-gray-400 mt-1">Total Conversations</div>
                </div>

                <div className="rounded-xl border border-gray-700/60 bg-[#202124] p-4 text-center">
                  <div className="text-2xl font-bold text-[#10a37f]">{stats.messages}</div>
                  <div className="text-xs text-gray-400 mt-1">Total Messages Saved</div>
                </div>

                <div className="rounded-xl border border-gray-700/60 bg-[#202124] p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.activeSessions}</div>
                  <div className="text-xs text-gray-400 mt-1">Active Device Sessions</div>
                </div>

                <div className="rounded-xl border border-gray-700/60 bg-[#202124] p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.databaseSizeKB} KB</div>
                  <div className="text-xs text-gray-400 mt-1">SQLite Database Size</div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700/60 bg-[#202124] p-4 text-xs space-y-2">
                <div className="font-semibold text-gray-300">File Storage Location:</div>
                <div className="font-mono text-gray-400 bg-black/40 p-2 rounded break-all select-all">
                  {stats.databasePath}
                </div>
                <p className="text-gray-500 text-[11px] mt-2">
                  To back up your chats, simply copy this single file to any drive.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CHANGE MASTER PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  Current Master Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password..."
                  className="w-full rounded-xl border border-gray-700 bg-[#202124] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#10a37f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  New Master Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password (min 4 characters)..."
                  className="w-full rounded-xl border border-gray-700 bg-[#202124] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#10a37f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  Confirm New Master Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password..."
                  className="w-full rounded-xl border border-gray-700 bg-[#202124] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#10a37f] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full rounded-xl bg-[#10a37f] py-2.5 text-sm font-semibold text-white hover:bg-[#0e8e6e] transition-colors disabled:opacity-50"
              >
                {pwLoading ? 'Updating Password...' : 'Update Master Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
