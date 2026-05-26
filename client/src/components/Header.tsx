import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import Avatar from './ui/Avatar';
import Modal from './ui/Modal';
import { api } from '@/api';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, updateAvatar } = useAuthStore();
  const { activeChat } = useChatStore();
  const { theme, toggleTheme, rightPanelOpen, toggleRightPanel, setMobileView } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const result = await api.users.uploadAvatar(user.id, file);
      updateAvatar(result.avatar);
    } catch (err) {
      console.error('Avatar upload failed', err);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!user) return;
    try {
      await api.users.updateStatus(user.id, status);
      useAuthStore.getState().updateStatus(status as any);
      setStatusMenuOpen(false);
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border flex items-center px-4 gap-3">
      {/* Mobile menu toggle */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-dark-hover text-dark-textSecondary"
        onClick={() => setMobileView('sidebar')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Back to chat on mobile */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-dark-hover text-dark-textSecondary mr-2"
        onClick={() => setMobileView('chat')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Active chat info */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {activeChat ? (
          <>
            <Avatar name={activeChat.name} src={activeChat.avatar} size="md" status={activeChat.status as any} showStatus={activeChat.type === 'conversation'} />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">{activeChat.name}</h1>
              <p className="text-xs text-dark-textMuted">
                {activeChat.type === 'group'
                  ? `${activeChat.members?.length || 0} members`
                  : activeChat.status || 'offline'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-dark-text">TeamChat</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="relative">
          <button
            className="btn-icon btn-ghost"
            onClick={() => setShowSearch(!showSearch)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {showSearch && (
            <div className="absolute right-0 top-full mt-2 w-72 z-50">
              <input
                autoFocus
                type="text"
                placeholder="Search messages..."
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              />
            </div>
          )}
        </div>

        {/* Call button */}
        {activeChat && (
          <button className="btn-icon btn-ghost hidden sm:flex">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        )}

        {/* Right panel toggle */}
        <button
          className={`btn-icon btn-ghost hidden lg:flex ${rightPanelOpen ? 'text-primary' : ''}`}
          onClick={toggleRightPanel}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>

        {/* Theme toggle */}
        <button className="btn-icon btn-ghost" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-dark-hover transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar user={user ?? undefined} size="sm" showStatus status={user?.status} />
          </button>

          {showUserMenu && (
            <div className="dropdown right-0 top-full mt-2 animate-scale-in">
              {/* Status selector */}
              <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar user={user ?? undefined} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{user?.display_name}</p>
                    <p className="text-xs text-dark-textMuted truncate">@{user?.username}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-hover text-xs text-dark-textSecondary"
                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  >
                    <span className={`status-dot ${user?.status === 'online' ? 'bg-success' : user?.status === 'away' ? 'bg-warning' : user?.status === 'busy' ? 'bg-danger' : 'bg-dark-textMuted'}`} />
                    {user?.status || 'offline'}
                    <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {statusMenuOpen && (
                    <div className="absolute bottom-full mb-1 left-0 w-full bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50">
                      {(['online', 'away', 'busy', 'offline'] as const).map((s) => (
                        <button
                          key={s}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-hover ${user?.status === s ? 'text-primary' : 'text-dark-text'}`}
                          onClick={() => handleStatusChange(s)}
                        >
                          <span className={`status-dot ${s === 'online' ? 'bg-success' : s === 'away' ? 'bg-warning' : s === 'busy' ? 'bg-danger' : 'bg-dark-textMuted'}`} />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button className="dropdown-item w-full" onClick={() => { setShowSettings(true); setShowUserMenu(false); }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>

              <div className="dropdown-divider" />
              <button className="dropdown-item w-full text-danger" onClick={handleLogout}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" size="lg">
        <Settings user={user} onAvatarChange={handleAvatarChange} onClose={() => setShowSettings(false)} />
      </Modal>
    </header>
  );
}

function Settings({ user, onAvatarChange, onClose }: { user: any; onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onClose: () => void }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [role, setRole] = useState(user?.role || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { updateProfile } = useAuthStore();
  const { addToast } = useUIStore();

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.users.update(user.id, { display_name: displayName, role, department, bio });
      updateProfile(updated);
      addToast({ type: 'success', title: 'Profile updated' });
    } catch {
      addToast({ type: 'error', title: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return;
    setSaving(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      addToast({ type: 'success', title: 'Password changed' });
    } catch {
      addToast({ type: 'error', title: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar user={user} size="xl" />
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </label>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-dark-text">{user?.display_name}</p>
          <p className="text-sm text-dark-textMuted">@{user?.username}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-dark-textSecondary mb-1">Display Name</label>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textSecondary mb-1">Role</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Developer" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textSecondary mb-1">Department</label>
          <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-textSecondary mb-1">Bio</label>
          <textarea className="input resize-none" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
        </div>
        <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Password change */}
      <div className="border-t border-gray-100 dark:border-dark-border pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">Change Password</h3>
        <input type="password" className="input" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input type="password" className="input" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button className="btn-secondary w-full" onClick={handlePasswordChange} disabled={saving || !currentPassword || !newPassword}>
          Change Password
        </button>
      </div>
    </div>
  );
}
