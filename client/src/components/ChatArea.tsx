import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { socketService } from '@/services/socketService';
import Avatar from './ui/Avatar';
import EmojiPicker from 'emoji-picker-react';
import { format, isToday, isYesterday } from 'date-fns';

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function formatMessageTime(dateStr: string) {
  return format(new Date(dateStr), 'HH:mm');
}

export default function ChatArea() {
  const { activeChat, messages, loadMessages, sendMessage, sendFile, typingUsers } = useChatStore();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const currentMessages = activeChat ? messages[activeChat.id] || [] : [];
  const typingKey = `${activeChat?.type}:${activeChat?.id}`;
  const typingUserIds = typingUsers[typingKey] || [];
  const isTyping = typingUserIds.length > 0;

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.type, activeChat.id);
      if (activeChat.type === 'conversation') {
        socketService.joinConversation(activeChat.id);
      } else {
        socketService.joinGroup(activeChat.id);
      }
    }
    return () => {
      if (activeChat) {
        if (activeChat.type === 'conversation') {
          socketService.leaveConversation(activeChat.id);
        } else {
          socketService.leaveGroup(activeChat.id);
        }
      }
    };
  }, [activeChat?.id, activeChat?.type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !activeChat) return;
    sendMessage(input.trim());
    setInput('');
    socketService.stopTyping(activeChat.type, activeChat.id);
    inputRef.current?.focus();
  }, [input, activeChat, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (activeChat) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketService.startTyping(activeChat.type, activeChat.id);
      typingTimeoutRef.current = setTimeout(() => {
        if (activeChat) socketService.stopTyping(activeChat.type, activeChat.id);
      }, 1000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      sendFile(files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      sendFile(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[];
      sendFile(files);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">Welcome to TeamChat</h2>
          <p className="text-dark-textMuted text-sm max-w-xs mx-auto">
            Select a conversation or channel from the sidebar to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col bg-gray-50 dark:bg-dark-bg relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-primary font-semibold">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {currentMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-dark-textMuted text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {currentMessages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showAvatar = !isOwn && (
                index === 0 || currentMessages[index - 1]?.sender_id !== message.sender_id
              );
              const showDate =
                index === 0 ||
                formatMessageDate(currentMessages[index - 1]?.created_at) !==
                  formatMessageDate(message.created_at);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                      <span className="text-xs text-dark-textMuted px-2">
                        {formatMessageDate(message.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                    </div>
                  )}
                  <div
                    className={`flex gap-3 group animate-slide-up ${isOwn ? 'flex-row-reverse' : ''} ${
                      !showAvatar && !showDate ? 'mt-0.5' : 'mt-3'
                    }`}
                  >
                    {showAvatar ? (
                      <Avatar user={message.sender} size="sm" className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-medium text-dark-text">{message.sender?.display_name}</span>
                          <span className="text-[10px] text-dark-textMuted">{formatMessageTime(message.created_at)}</span>
                        </div>
                      )}
                      {message.is_pinned === 1 && !isOwn && (
                        <div className="flex items-center gap-1 text-[10px] text-primary mb-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          Pinned
                        </div>
                      )}
                      {message.file_url && (
                        <FilePreview message={message} />
                      )}
                      {message.content && (
                        <div className={`chat-bubble ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'} ${
                          showAvatar ? '' : (isOwn ? 'rounded-r-md' : 'rounded-l-md')
                        }`}>
                          {message.content}
                        </div>
                      )}
                      {!showAvatar && (
                        <span className={`text-[10px] text-dark-textMuted mt-0.5 ${isOwn ? 'text-right' : 'text-left'} ${isOwn ? 'mr-1' : 'ml-1'}`}>
                          {formatMessageTime(message.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-3 mt-3 animate-slide-up">
            <Avatar name={typingUserIds[0]} size="sm" />
            <div className="chat-bubble chat-bubble-other">
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="flex items-end gap-2">
          {/* Attachments */}
          <div className="relative">
            <button
              className="btn-icon btn-ghost flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
            />
          </div>

          {/* Emoji picker */}
          <div className="relative">
            <button
              className="btn-icon btn-ghost flex-shrink-0"
              onClick={() => setShowEmoji(!showEmoji)}
              title="Emoji"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <div
                  className="fixed inset-0 z-[-1]"
                  onClick={() => setShowEmoji(false)}
                />
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={320}
                  height={350}
                />
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="input resize-none py-2.5 max-h-32 min-h-[42px] leading-relaxed"
              placeholder={`Message ${activeChat.type === 'group' ? '#' + activeChat.name : activeChat.name}`}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows={1}
            />
          </div>

          {/* Send button */}
          <button
            className={`btn-icon flex-shrink-0 ${input.trim() ? 'btn-primary' : 'btn-ghost opacity-50'}`}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilePreview({ message }: { message: any }) {
  const isImage = message.file_type?.startsWith('image/');

  if (isImage) {
    return (
      <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="block max-w-sm">
        <img
          src={message.file_url}
          alt={message.file_name}
          className="rounded-xl max-w-xs max-h-64 object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={message.file_url}
      download={message.file_name}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border transition-colors max-w-xs"
    >
      <FileIcon type={message.file_type} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-dark-text truncate">{message.file_name}</p>
        <p className="text-xs text-dark-textMuted">{message.file_type?.split('/')[1]?.toUpperCase()}</p>
      </div>
    </a>
  );
}

function FileIcon({ type }: { type?: string }) {
  const iconClass = 'w-8 h-8 flex-shrink-0';
  if (type?.includes('pdf')) {
    return (
      <div className={`${iconClass} rounded-lg bg-danger/10 flex items-center justify-center`}>
        <svg className="w-4 h-4 text-danger" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${iconClass} rounded-lg bg-primary/10 flex items-center justify-center`}>
      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}
