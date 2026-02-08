import { useState } from 'react';
import { Plus, Menu, X, Settings, LogOut, User, ChevronDown, PanelLeftClose } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewSearch: () => void;
  searchHistory: Array<{ id: string; title: string; updated_at: string }>;
  onHistoryClick: (item: any) => void;
  onOpenProfileSettings: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
  user?: any;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  onNewSearch,
  searchHistory,
  onHistoryClick,
  onOpenProfileSettings,
  onMobileClose,
  onLogout,
  user
}: SidebarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCollapseButton, setShowCollapseButton] = useState(false);

  const userName = user?.user_metadata?.full_name || user?.email || "Guest User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleNewSearch = () => {
    onNewSearch();
    onMobileClose();
  };

  const handleHistoryClick = (item: any) => {
    onHistoryClick(item);
    onMobileClose();
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    onLogout();
  };

  return (
    <>
      <div
        className={`bg-[#1E1F20] h-full flex flex-col transition-all duration-300 
          w-72 ${isCollapsed ? 'md:w-16' : 'md:w-72'} 
          border-r border-[#2D2E30] ${isCollapsed ? 'md:cursor-pointer' : ''}`}
        onClick={(e) => {
          // Only expand when collapsed and clicked on desktop (not on buttons)
          if (isCollapsed && window.innerWidth >= 768) {
            const target = e.target as HTMLElement;
            // Check if clicked element is not a button or inside a button
            if (!target.closest('button')) {
              onToggleCollapse();
            }
          }
        }}
      >
        {/* Header with Logo and Toggle */}
        <div
          className="p-4 flex items-center justify-between"
          onMouseEnter={() => isCollapsed && setShowCollapseButton(true)}
          onMouseLeave={() => isCollapsed && setShowCollapseButton(false)}
        >
          {/* Mobile - Always show full logo */}
          <button
            onClick={onToggleCollapse}
            className="md:hidden flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src={logoImage} alt="Ask-M Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl">Ask-M</span>
          </button>

          {/* Desktop - Conditional based on collapsed state */}
          {!isCollapsed ? (
            <>
              <div className="hidden md:flex items-center gap-3">
                <img src={logoImage} alt="Ask-M Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl">Ask-M</span>
              </div>
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-2 hover:bg-[#2D2E30] rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-[#A0A0A0]" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="hidden md:block hover:opacity-80 transition-opacity cursor-pointer mx-auto"
            >
              <img src={logoImage} alt="Ask-M Logo" className="w-10 h-10 object-contain" />
            </button>
          )}
        </div>

        {/* New Search Button */}
        <div className="px-4 mb-6">
          {/* Mobile - Always show full button */}
          <button
            onClick={handleNewSearch}
            className="md:hidden w-full bg-[#3D3E40] hover:bg-[#4D4E50] transition-all rounded-xl py-3 flex items-center justify-center gap-2 px-4"
          >
            <Plus className="w-5 h-5" />
            <span>New Search</span>
          </button>

          {/* Desktop - Conditional based on collapsed state */}
          <button
            onClick={handleNewSearch}
            className={`hidden md:flex w-full bg-[#3D3E40] hover:bg-[#4D4E50] transition-all ${isCollapsed
              ? 'h-10 w-10 rounded-full items-center justify-center mx-auto'
              : 'rounded-xl py-3 items-center justify-center gap-2 px-4'
              }`}
          >
            <Plus className="w-5 h-5" />
            {!isCollapsed && <span>New Search</span>}
          </button>
        </div>

        {/* Recent Study Sessions */}
        {/* Mobile - Always show */}
        <div className="md:hidden flex-1 overflow-y-auto px-4">
          <h3 className="text-[#A0A0A0] text-sm mb-3">Recent Study Sessions</h3>
          <div className="space-y-1">
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleHistoryClick(item)}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-[#2D2E30] transition-colors group"
              >
                <div className="text-sm text-white truncate">{item.title}</div>
                <div className="text-xs text-[#A0A0A0] mt-1">
                  {new Date(item.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop - Only when expanded */}
        {!isCollapsed && (
          <div className="hidden md:block flex-1 overflow-y-auto px-4">
            <h3 className="text-[#A0A0A0] text-sm mb-3">Recent Study Sessions</h3>
            <div className="space-y-1">
              {searchHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-[#2D2E30] transition-colors group"
                >
                  <div className="text-sm text-white truncate">{item.title}</div>
                  <div className="text-xs text-[#A0A0A0] mt-1">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Profile Section */}
        <div className="mt-auto p-4 border-t border-[#2D2E30] relative">
          {/* Mobile - Always show expanded */}
          <div className="md:hidden">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#2D2E30] transition-colors"
            >
              <div className="w-10 h-10 bg-[#3D3E40] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-white text-sm truncate">{userName}</span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#2D2E30] rounded-lg border border-[#3D3E40] shadow-2xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfileSettings();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#3D3E40] transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-[#A0A0A0]" />
                  <span className="text-white text-sm">Profile Settings</span>
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#3D3E40] transition-colors text-left border-t border-[#3D3E40]"
                >
                  <LogOut className="w-4 h-4 text-[#A0A0A0]" />
                  <span className="text-white text-sm">Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop - Conditional based on collapsed state */}
          {!isCollapsed ? (
            <div className="hidden md:block">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#2D2E30] transition-colors"
              >
                <div className="w-10 h-10 bg-[#3D3E40] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-white text-sm truncate">{userName}</span>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#2D2E30] rounded-lg border border-[#3D3E40] shadow-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenProfileSettings();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#3D3E40] transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-[#A0A0A0]" />
                    <span className="text-white text-sm">Profile Settings</span>
                  </button>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#3D3E40] transition-colors text-left border-t border-[#3D3E40]"
                  >
                    <LogOut className="w-4 h-4 text-[#A0A0A0]" />
                    <span className="text-white text-sm">Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex w-full items-center justify-center p-2">
              <div className="w-10 h-10 bg-[#3D3E40] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}