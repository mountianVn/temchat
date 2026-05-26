import { useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import RightPanel from './RightPanel';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { socketService } from '@/services/socketService';

export default function Layout() {
  const { loadConversations, loadGroups } = useChatStore();
  const { sidebarOpen, mobileView } = useUIStore();

  useEffect(() => {
    loadConversations();
    loadGroups();
    socketService.updateStatus('online');

    const handleVisibility = () => {
      if (document.hidden) {
        socketService.updateStatus('away');
      } else {
        socketService.updateStatus('online');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      socketService.updateStatus('offline');
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-60 flex-shrink-0' : 'w-0'} transition-all duration-250 hide-mobile ${
          mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <Sidebar />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
        <Header />
        <ChatArea />
      </div>

      {/* Right Panel */}
      <div className="hide-mobile">
        <RightPanel />
      </div>
    </div>
  );
}
