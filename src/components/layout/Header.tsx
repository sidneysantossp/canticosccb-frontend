import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, User, Heart, LogOut, ChevronDown, Mic, Shield, Music, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import UserMobileSidebar from './UserMobileSidebar';
import { buildAvatarUrl } from '@/lib/media-helper';
import ComposerMobileSidebar from './ComposerMobileSidebar';
import AdminMobileSidebar from './AdminMobileSidebar';
import PublicMobileSidebar from './PublicMobileSidebar';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const { user, profile, signOut, isAdmin, isComposer } = useAuth();
  const { isMenuOpen, openMenu, closeMenu } = useMobileMenu();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug: Log profile data e flags de autorização
  React.useEffect(() => {
    if (user && profile) {
      console.log('🔐 PROFILE DEBUG:', {
        name: (profile as any)?.name || (profile as any)?.nome,
        email: profile.email,
        is_admin: profile.is_admin,
        is_composer: profile.is_composer,
        avatar_url: profile.avatar_url,
        '---': '---',
        'isAdmin (computed)': isAdmin,
        'isComposer (computed)': isComposer
      });
      
      // Alerta crítico se compositor tiver is_admin = true
      if (profile.is_composer && profile.is_admin) {
        console.error('🚨 ERRO DE SEGURANÇA: Usuário tem is_admin E is_composer = true!');
        console.error('Isso pode ser um erro de dados no banco. Verifique a tabela users.');
      }
    }
  }, [user, profile, isAdmin, isComposer]);
  
  // Detectar tipo de área
  const isAdminPanel = location.pathname.startsWith('/admin/');
  const isComposerPanel = location.pathname.startsWith('/composer/');
  
  // Rotas do dashboard do usuário
  const userDashboardRoutes = ['/profile', '/edit-profile', '/settings', '/subscription'];
  const isUserDashboard = userDashboardRoutes.some(route => location.pathname.startsWith(route));
  
  const isPublicArea = !isAdminPanel && !isComposerPanel && !isUserDashboard;

  // Função de busca com debounce manual
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Limpar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim()) {
      setIsSearching(true);
      
      // Criar novo timeout
      searchTimeout.current = setTimeout(async () => {
        try {
          // TODO: Implement search functionality
          // const results = await quickSearch(query);
          setSearchResults([]);
          setShowResults(false);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleLogout = async () => {
    console.log('🚪 Logout - Starting logout process...');
    
    try {
      setShowUserMenu(false);
      setShowMobileMenu(false);
      
      console.log('🚪 Logout - Calling signOut...');
      
      // Timeout reduzido para 1 segundo
      const logoutPromise = signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
      console.log('✅ Logout - Success! Redirecting...');
      
      // Limpar tudo
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirecionar e forçar reload
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Logout - Error:', error);
      
      // Mesmo com erro, forçar logout local
      console.log('🔄 Logout - Forcing local logout...');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background-primary shadow-lg" style={{ boxShadow: '0 6px 25px -2px rgba(0, 0, 0, 0.6)' }}>
      <div className="flex items-center justify-between lg:justify-start pl-3 pr-6 lg:pl-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center lg:w-[240px] lg:shrink-0">
          <img
            src="https://canticosccb.com.br/logo-canticos-ccb.png"
            alt="Cânticos CCB"
            className="h-10 md:h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:block flex-1 max-w-xl ml-0 lg:ml-4 relative">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Busque por hinos ou compositores"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full pl-10 pr-12 py-2 bg-background-tertiary border border-gray-700 rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-background-hover transition-colors">
                <Mic className="w-4 h-4 text-text-muted hover:text-white" />
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              {searchResults.slice(0, 6).map((result) => (
                <Link
                  key={result.id}
                  to={result.url}
                  className="flex items-center gap-3 p-3 hover:bg-background-hover transition-colors"
                  onClick={() => setShowResults(false)}
                >
                  <img 
                    src={result.imageUrl || 'https://via.placeholder.com/40'} 
                    alt={result.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium truncate">
                      {result.title}
                    </p>
                    <p className="text-text-muted text-sm flex items-center gap-1">
                      {result.type === 'hymn' && '🎵'}
                      {result.type === 'composer' && '👤'}
                      {result.type === 'album' && '💿'}
                      {result.type === 'playlist' && '📋'}
                      <span>{result.subtitle}</span>
                    </p>
                  </div>
                </Link>
              ))}
              {searchResults.length > 6 && (
                <Link
                  to={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="block p-3 text-center text-primary-500 hover:bg-background-hover transition-colors border-t border-gray-700"
                  onClick={() => setShowResults(false)}
                >
                  Ver todos os resultados
                </Link>
              )}
            </div>
          )}
          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center">
              <p className="text-text-muted text-sm">Buscando...</p>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4 lg:ml-auto">
          {/* Notification Bell - Desktop */}
          {user && (
            <Link
              to={isComposer ? "/composer/notifications" : "/notifications"}
              className="hidden md:inline-flex items-center justify-center relative p-2.5 rounded-full hover:bg-green-500/10 transition-colors group"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-black text-[11px] rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Register Button */}
          {!user && (
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center rounded-full border-2 border-green-500 text-green-500 px-6 py-2 font-semibold hover:bg-green-500/10 transition-colors"
            >
              Registrar
            </Link>
          )}

          {/* User Menu - Desktop Only */}
          {user ? (
            <div
              className="relative hidden md:flex items-center gap-3"
            >
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-background-hover transition-colors bg-background-secondary/50 backdrop-blur-sm border border-gray-700/50"
              >
                <img
                  key={(profile as any)?.avatar_url || (user as any)?.id}
                  src={buildAvatarUrl({
                    id: String((user as any)?.id || ''),
                    avatar_url: (profile as any)?.avatar_url || '',
                    name: (profile as any)?.name || (profile as any)?.nome || user?.email || 'Usuário'
                  })}
                  alt={(profile as any)?.name || (profile as any)?.nome || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const name = (profile as any)?.name || (profile as any)?.nome || user?.email || 'Usuário';
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff&size=200`;
                  }}
                />
                <span className="text-sm font-medium text-text-primary">
                  {(profile as any)?.name || (profile as any)?.nome || user.email?.split('@')[0] || 'Usuário'}
                </span>
                <ChevronDown className="hidden sm:block w-4 h-4 text-text-muted" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 py-2"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white truncate">
                      {(profile as any)?.name || (profile as any)?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {profile?.email || user?.email}
                    </p>
                    {profile?.plan === 'premium' && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-full">
                        ⭐ Premium
                      </span>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <Link
                      to="/favoritos"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart className="w-4 h-4" />
                      Meus Favoritos
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configurações
                    </Link>
                    
                    {/* Premium Link */}
                    {profile?.plan !== 'premium' && (
                      <Link
                        to="/premium"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-yellow-500"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Assinar Premium
                      </Link>
                    )}
                    
                    {profile?.plan === 'premium' && (
                      <Link
                        to="/subscription"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                        Minha Assinatura
                      </Link>
                    )}
                  </div>
                  
                  {/* Panel Links */}
                  {(isAdmin || isComposer) && (
                    <div className="border-t border-gray-700 my-1"></div>
                  )}
                  
                  {/* Admin Panel Link */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-red-400"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Painel Admin
                    </Link>
                  )}
                  
                  {/* Composer Panel Link - Mostra mesmo se for Admin */}
                  {isComposer && (
                    <Link
                      to="/composer"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-purple-400"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/composer');
                        setShowUserMenu(false);
                      }}
                    >
                      <Music className="w-4 h-4" />
                      Painel Compositor
                    </Link>
                  )}
                  
                  {/* Logout */}
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-background-hover transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex items-center rounded-full bg-white border-2 border-white text-black px-6 py-2 font-semibold hover:bg-gray-100 transition-colors"
            >
              Entrar
            </Link>
          )}

          {/* Notification Bell - Mobile */}
          {user && (
            <Link
              to={isComposer ? "/composer/notifications" : "/notifications"}
              className="lg:hidden relative p-2 rounded-full hover:bg-green-500/10 transition-colors group"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Registrar - Mobile (ao lado do menu) */}
          {!user && (
            <Link
              to="/register"
              className="lg:hidden inline-flex items-center px-4 py-2 rounded-full bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition-colors"
              aria-label="Registrar"
            >
              Registrar
            </Link>
          )}

          {/* Mobile Menu Button - Abre Sidebar */}
          <button
            onClick={openMenu}
            className="lg:hidden p-3 rounded-full hover:bg-background-hover transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-7 h-7 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isPublicArea ? (
        <PublicMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      ) : (
        <>
          {isAdminPanel && (
            <AdminMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
          )}
          {isComposerPanel && (
            <ComposerMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
          )}
          {isUserDashboard && (
            <UserMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
          )}
        </>
      )}

      {/* Mobile Fullscreen Menu (Antigo - pode manter ou remover) */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 md:hidden flex items-end"
            onClick={() => setShowMobileMenu(false)}
          >
            <div 
              className="w-full bg-gradient-to-b from-green-900 to-black rounded-t-3xl h-[calc(100vh-64px)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Menu */}
              <div className="p-4 border-b border-white/10">
              {user ? (
                <div className="flex items-center gap-3">
                  <img
                    src={buildAvatarUrl({
                      id: String((user as any)?.id || ''),
                      avatar_url: (profile as any)?.avatar_url || '',
                      name: (profile as any)?.nome || (profile as any)?.name || user?.email || 'Usuário'
                    })}
                    alt={(profile as any)?.nome || (profile as any)?.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center';
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-muted"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                      img.parentElement?.insertBefore(fallback, img);
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold">{(profile as any)?.nome || user.email?.split('@')[0] || 'Usuário'}</p>
                    <p className="text-gray-300 text-sm">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-gray-300 mb-3">Faça login para continuar</p>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full rounded-full bg-white border-2 border-white text-black px-6 py-2 font-semibold hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center w-full rounded-full border-2 border-green-500 text-green-500 px-6 py-2 font-semibold hover:bg-green-500/10 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Registrar
                  </Link>
                </div>
              )}
            </div>

            {/* Menu Items */}
            {user && (
              <div className="p-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-hover transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-5 h-5 text-primary-500" />
                  <span className="text-text-primary">Meu Perfil</span>
                </Link>
                <Link
                  to="/favoritos"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-hover transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Heart className="w-5 h-5 text-primary-500" />
                  <span className="text-text-primary">Meus Favoritos</span>
                </Link>
                <hr className="my-2 border-gray-700" />
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-hover transition-colors w-full text-left"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Sair</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </>
      )}

      {/* Click outside to close dropdowns */}
      {(showResults || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowResults(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
