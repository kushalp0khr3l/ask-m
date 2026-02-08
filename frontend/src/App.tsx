import { useEffect, useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { SearchInput } from './components/SearchInput';
import { ProfileSettings } from './components/ProfileSettings';
import { LogoutModal } from './components/LogoutModal';
import { LoginPage } from './components/LoginPage';
import { SearchProgressBar } from './components/SearchProgressBar';
import { Menu } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeSearchMode, setActiveSearchMode] = useState<'exam' | 'guided'>('guided');
  const [isSearching, setIsSearching] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null means loading
  const [user, setUser] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  const isSynced = useRef(false);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthEvent(session);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        isSynced.current = false;
        setSearchHistory([]);
        setActiveChatId(null);
        setMessages([]);
      }
      handleAuthEvent(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchChats = async (session: any) => {
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const backendUrl = rawBackendUrl.replace(/\/$/, '');
    try {
      const response = await fetch(`${backendUrl}/chats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return;

    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const backendUrl = rawBackendUrl.replace(/\/$/, '');
    try {
      const response = await fetch(`${backendUrl}/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleAuthEvent = async (session: any) => {
    if (session) {
      setIsLoggedIn(true);
      setUser(session.user);
      fetchChats(session);

      if (isSynced.current) return;
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const backendUrl = rawBackendUrl.replace(/\/$/, '');
      try {
        await fetch(`${backendUrl}/auth/verify`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        isSynced.current = true;
      } catch (err) {
        console.error('Backend sync failed:', err);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const handleNewSearch = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  const handleSearch = async (query: string, mode: 'exam' | 'guided' = 'guided') => {
    setIsSearching(true);
    try {
      let chatId = activeChatId;
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setIsSearching(false);
        return;
      }

      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const backendUrl = rawBackendUrl.replace(/\/$/, '');

      // 1. Create chat if not exists
      if (!chatId) {
        try {
          const chatResponse = await fetch(`${backendUrl}/chats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ title: query.substring(0, 40) }),
          });
          if (chatResponse.ok) {
            const chat = await chatResponse.json();
            chatId = chat.id;
            setActiveChatId(chatId);
            setSearchHistory(prev => [chat, ...prev]);
          }
        } catch (err) {
          console.error('Failed to create chat:', err);
          // Don't return, allow user to see message but maybe AI response will fail later or work if chatId exists
        }
      }

      // 2. Add user message locally and to DB
      const userMsg = { role: 'user', content: query };
      setMessages(prev => [...prev, userMsg]);

      if (chatId) {
        try {
          await fetch(`${backendUrl}/chats/${chatId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(userMsg),
          });
        } catch (err) {
          console.error('Failed to save user message:', err);
        }
      }

      // 3. Trigger AI response (this will be handled by the Streaming UI component which we'll update)
      setActiveSearchMode(mode);
    } catch (err) {
      console.error('Search failed:', err);
      setIsSearching(false);
    }
  };

  const handleHistoryClick = (item: any) => {
    setActiveChatId(item.id);
    loadChatMessages(item.id);
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
    // Handle OCR processing here
  };

  const handleLogoutConfirm = async () => {
    await supabase.auth.signOut();
    setShowLogoutModal(false);
  };

  const handleLogin = () => {
    // This is now handled by onAuthStateChange
  };

  // Loading state
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="animate-pulse text-xl">Loading Ask-M...</div>
      </div>
    );
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      {/* Search Progress Bar */}
      <SearchProgressBar isSearching={isSearching} />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-[#1E1F20] rounded-lg border border-[#2D2E30]"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 z-30"
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-40 h-full
        transition-transform duration-300
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNewSearch={handleNewSearch}
          searchHistory={searchHistory}
          onHistoryClick={handleHistoryClick}
          onOpenProfileSettings={() => setShowProfileSettings(true)}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          onLogout={() => setShowLogoutModal(true)}
          user={user}
        />
      </div>

      <div className="flex-1 flex flex-col relative w-full">
        <MainContent
          chatId={activeChatId}
          messages={messages}
          setMessages={setMessages}
          activeSearchMode={activeSearchMode}
          onQuickStart={handleSearch}
          setIsSearching={setIsSearching}
        />

        <SearchInput
          onSearch={handleSearch}
          onFileUpload={handleFileUpload}
          isSearching={isSearching}
        />
      </div>

      {showProfileSettings && (
        <ProfileSettings
          onClose={() => setShowProfileSettings(false)}
          user={user}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
          userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}
