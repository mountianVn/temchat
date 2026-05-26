import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import Avatar from './ui/Avatar';
import Modal from './ui/Modal';
import type { ActiveChat, GroupMember } from '@/types';
import { api } from '@/api';

export default function Sidebar() {
  const { conversations, groups, loadConversations, loadGroups, setActiveChat, activeChat, createConversation, createGroup } = useChatStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dms' | 'groups'>('dms');
  const [search, setSearch] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadConversations();
    loadGroups();
  }, []);

  const filteredDMs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectChat = async (conv: any) => {
    setActiveChat({
      type: 'conversation',
      id: conv.id,
      name: conv.name,
      avatar: conv.avatar,
      status: conv.status,
    });
  };

  const handleSelectGroup = async (group: any) => {
    const fullGroup = await api.groups.get(group.id);
    setActiveChat({
      type: 'group',
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      myRole: group.myRole,
      members: fullGroup.members,
    });
  };

  const handleNewChat = async (targetUser: any) => {
    try {
      const conv = await createConversation(targetUser.id);
      setActiveChat({
        type: 'conversation',
        id: conv.id,
        name: conv.name,
        avatar: conv.avatar,
        status: conv.status,
      });
      setShowNewChat(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setCreating(true);
    try {
      const group = await createGroup({ name: groupName, memberIds: selectedMembers });
      setActiveChat({
        type: 'group',
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        myRole: 'admin',
        members: group.members,
      });
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-60 bg-dark-surface border-r border-dark-border flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-dark-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span className="ml-2 font-bold text-dark-text text-base">TeamChat</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            className="search-input text-sm py-1.5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 mb-1">
        <button
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'dms' ? 'bg-dark-active text-dark-text' : 'text-dark-textMuted hover:text-dark-text'}`}
          onClick={() => setActiveTab('dms')}
        >
          DMs
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'groups' ? 'bg-dark-active text-dark-text' : 'text-dark-textMuted hover:text-dark-text'}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {activeTab === 'dms' ? (
          <>
            <div className="flex justify-between items-center px-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-textMuted">Direct Messages</span>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-dark-hover text-dark-textMuted hover:text-dark-text transition-colors"
                onClick={async () => {
                  const users = await api.users.list();
                  setAllUsers(users);
                  setShowNewChat(true);
                }}
                title="New conversation"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {filteredDMs.length === 0 ? (
              <div className="text-center py-8 text-dark-textMuted text-xs">
                <p>No conversations yet</p>
                <p className="mt-1">Start a new chat!</p>
              </div>
            ) : (
              filteredDMs.map((conv) => (
                <ChatItem
                  key={conv.id}
                  name={conv.name}
                  avatar={conv.avatar}
                  lastMessage={conv.lastMessage}
                  time={conv.lastMessageAt}
                  unread={conv.unreadCount}
                  isActive={activeChat?.type === 'conversation' && activeChat?.id === conv.id}
                  status={conv.status as any}
                  onClick={() => handleSelectChat(conv)}
                />
              ))
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center px-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-textMuted">Channels</span>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-dark-hover text-dark-textMuted hover:text-dark-text transition-colors"
                onClick={() => setShowCreateGroup(true)}
                title="Create group"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-dark-textMuted text-xs">
                <p>No groups yet</p>
                <p className="mt-1">Create your first group!</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <ChatItem
                  key={group.id}
                  name={group.name}
                  avatar={group.avatar}
                  lastMessage={group.lastMessage}
                  time={group.lastMessageAt}
                  isActive={activeChat?.type === 'group' && activeChat?.id === group.id}
                  isGroup
                  memberCount={group.memberCount}
                  onClick={() => handleSelectGroup(group)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal isOpen={showNewChat} onClose={() => setShowNewChat(false)} title="New Conversation" size="md">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search people..."
            className="input"
            onChange={async (e) => {
              if (e.target.value) {
                const users = await api.users.list({ search: e.target.value });
                setAllUsers(users);
              } else {
                const users = await api.users.list();
                setAllUsers(users);
              }
            }}
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {allUsers.filter(u => u.id !== user?.id).map((u) => (
              <button
                key={u.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-hover transition-colors"
                onClick={() => handleNewChat(u)}
              >
                <Avatar user={u} size="sm" showStatus />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-dark-text truncate">{u.display_name}</p>
                  <p className="text-xs text-dark-textMuted truncate">@{u.username} · {u.department}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <Modal isOpen={showCreateGroup} onClose={() => { setShowCreateGroup(false); setGroupName(''); setSelectedMembers([]); }} title="Create Channel" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-textSecondary mb-1">Channel Name</label>
            <input
              className="input"
              placeholder="e.g. engineering"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-textSecondary mb-1">Add Members</label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {allUsers.filter(u => u.id !== user?.id).map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-hover cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, u.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-dark-border text-primary focus:ring-primary"
                  />
                  <Avatar user={u} size="sm" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-dark-text truncate">{u.display_name}</p>
                    <p className="text-xs text-dark-textMuted truncate">{u.role} · {u.department}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            className="btn-primary w-full"
            disabled={!groupName.trim() || selectedMembers.length === 0 || creating}
            onClick={handleCreateGroup}
          >
            {creating ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

interface ChatItemProps {
  name: string;
  avatar?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  isActive?: boolean;
  isGroup?: boolean;
  memberCount?: number;
  status?: string;
  onClick: () => void;
}

function ChatItem({ name, avatar, lastMessage, time, unread, isActive, isGroup, memberCount, status, onClick }: ChatItemProps) {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-0.5 group ${
        isActive ? 'bg-dark-active' : 'hover:bg-dark-hover'
      }`}
    >
      {isGroup ? (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-sm">#</span>
        </div>
      ) : (
        <Avatar name={name} src={avatar} size="md" showStatus status={status as any} />
      )}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium truncate ${isActive ? 'text-dark-text' : 'text-dark-textSecondary group-hover:text-dark-text'}`}>
            {isGroup ? name.replace(/^#\s*/, '') : name}
          </span>
          {time && <span className="text-[10px] text-dark-textMuted flex-shrink-0">{formatTime(time)}</span>}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-dark-textMuted truncate">
            {isGroup && memberCount ? `${memberCount} members · ` : ''}
            {lastMessage ? (lastMessage.length > 40 ? lastMessage.substring(0, 40) + '...' : lastMessage) : 'No messages yet'}
          </p>
          {unread && unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
