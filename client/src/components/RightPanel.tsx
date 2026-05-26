import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Avatar from './ui/Avatar';
import Modal from './ui/Modal';
import { api } from '@/api';
import { format } from 'date-fns';

export default function RightPanel() {
  const { activeChat, groups, updateGroup, addGroupMember, removeGroupMember, pinMessage, messages } = useChatStore();
  const { user } = useAuthStore();
  const { rightPanelOpen, activeRightTab, setActiveRightTab, addToast } = useUIStore();

  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeChat?.type === 'group' && activeRightTab === 'pinned') {
      api.messages.getPinned(activeChat.id).then(setPinnedMessages).catch(() => setPinnedMessages([]));
    }
  }, [activeChat?.id, activeRightTab]);

  useEffect(() => {
    if (activeChat?.type === 'group') {
      setGroupName(activeChat.name || '');
    }
  }, [activeChat?.name]);

  if (!rightPanelOpen) return null;

  const members = activeChat?.members || [];
  const currentMessages = activeChat ? messages[activeChat.id] || [] : [];
  const fileMessages = currentMessages.filter(m => m.file_url);

  return (
    <div className="w-72 bg-dark-surface border-l border-dark-border flex flex-col h-full animate-slide-left">
      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        {(['members', 'files', 'pinned'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveRightTab(tab)}
            className={`flex-1 py-3 text-xs font-medium capitalize transition-colors relative ${
              activeRightTab === tab ? 'text-dark-text' : 'text-dark-textMuted hover:text-dark-text'
            }`}
          >
            {tab === 'members' ? `Members (${members.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeRightTab === tab && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeChat?.type === 'conversation' && (
          <div className="p-4">
            <div className="text-center">
              <Avatar name={activeChat.name} src={activeChat.avatar} size="xl" showStatus status={activeChat.status as any} />
              <h3 className="mt-3 font-semibold text-dark-text">{activeChat.name}</h3>
              <p className="text-xs text-dark-textMuted capitalize">{activeChat.status || 'offline'}</p>
            </div>
          </div>
        )}

        {activeChat?.type === 'group' && activeRightTab === 'members' && (
          <div className="p-3">
            {/* Group info */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-dark-textMuted uppercase tracking-wider">Group Info</span>
              {activeChat.myRole === 'admin' && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={async () => {
                    if (!activeChat) return;
                    setSaving(true);
                    try {
                      await updateGroup(activeChat.id, { name: groupName });
                      addToast({ type: 'success', title: 'Group name updated' });
                    } catch {
                      addToast({ type: 'error', title: 'Failed to update group' });
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save
                </button>
              )}
            </div>

            {activeChat.myRole === 'admin' && (
              <input
                className="input text-sm mb-3"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
              />
            )}

            <div className="flex items-center gap-2 mb-4">
              <Avatar name={activeChat.name} src={activeChat.avatar} size="md" />
              <div>
                <p className="text-sm font-medium text-dark-text">{activeChat.name}</p>
                <p className="text-xs text-dark-textMuted">{members.length} members</p>
              </div>
            </div>

            {/* Members */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-textMuted uppercase tracking-wider">Members</span>
              {activeChat.myRole === 'admin' && (
                <button
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-dark-hover text-dark-textMuted hover:text-primary transition-colors"
                  onClick={async () => {
                    const users = await api.users.list();
                    setAllUsers(users);
                    setShowAddMember(true);
                  }}
                  title="Add member"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-dark-hover transition-colors group"
                >
                  <Avatar user={member} size="sm" showStatus />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-text truncate">{member.display_name}</p>
                    <p className="text-xs text-dark-textMuted truncate">{member.role}</p>
                  </div>
                  {member.member_role === 'admin' && (
                    <span className="badge-primary text-[10px]">admin</span>
                  )}
                  {activeChat.myRole === 'admin' && member.id !== user?.id && (
                    <button
                      className="opacity-0 group-hover:opacity-100 text-dark-textMuted hover:text-danger transition-all p-1"
                      onClick={async () => {
                        try {
                          await removeGroupMember(activeChat.id, member.id);
                          addToast({ type: 'success', title: `${member.display_name} removed` });
                        } catch {
                          addToast({ type: 'error', title: 'Failed to remove member' });
                        }
                      }}
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChat?.type === 'group' && activeRightTab === 'files' && (
          <div className="p-3">
            <div className="text-xs font-semibold text-dark-textMuted uppercase tracking-wider mb-3">Shared Files</div>
            {fileMessages.length === 0 ? (
              <p className="text-sm text-dark-textMuted text-center py-8">No shared files yet</p>
            ) : (
              <div className="space-y-2">
                {fileMessages.map((msg) => {
                  const isImage = msg.file_type?.startsWith('image/');
                  return (
                    <a
                      key={msg.id}
                      href={msg.file_url}
                      download={msg.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover transition-colors"
                    >
                      {isImage ? (
                        <img src={msg.file_url} alt={msg.file_name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-dark-text truncate">{msg.file_name}</p>
                        <p className="text-xs text-dark-textMuted">
                          {msg.sender?.display_name} · {format(new Date(msg.created_at), 'MMM d')}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeChat?.type === 'group' && activeRightTab === 'pinned' && (
          <div className="p-3">
            <div className="text-xs font-semibold text-dark-textMuted uppercase tracking-wider mb-3">Pinned Messages</div>
            {pinnedMessages.length === 0 ? (
              <p className="text-sm text-dark-textMuted text-center py-8">No pinned messages</p>
            ) : (
              <div className="space-y-2">
                {pinnedMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-lg bg-dark-surface2 border border-dark-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar user={msg} size="xs" />
                      <span className="text-xs font-medium text-dark-text">{msg.display_name}</span>
                      <span className="text-[10px] text-dark-textMuted">
                        {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-dark-textSecondary truncate-2">{msg.content}</p>
                    {activeChat.myRole === 'admin' && (
                      <button
                        className="text-xs text-danger mt-1 hover:underline"
                        onClick={async () => {
                          await pinMessage(msg.id, activeChat.id);
                          setPinnedMessages(prev => prev.filter(m => m.id !== msg.id));
                        }}
                      >
                        Unpin
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add member modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member" size="md">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search people..."
            className="input"
            onChange={async (e) => {
              const users = e.target.value
                ? await api.users.list({ search: e.target.value })
                : await api.users.list();
              setAllUsers(users);
            }}
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {allUsers
              .filter((u) => u.id !== user?.id && !members.some((m: any) => m.id === u.id))
              .map((u) => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-hover transition-colors"
                  onClick={async () => {
                    try {
                      await addGroupMember(activeChat!.id, u.id);
                      addToast({ type: 'success', title: `${u.display_name} added` });
                      setShowAddMember(false);
                    } catch {
                      addToast({ type: 'error', title: 'Failed to add member' });
                    }
                  }}
                >
                  <Avatar user={u} size="sm" />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark-text truncate">{u.display_name}</p>
                    <p className="text-xs text-dark-textMuted truncate">{u.role} · {u.department}</p>
                  </div>
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
