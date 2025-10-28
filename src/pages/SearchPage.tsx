import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Play, Music, Mic, Disc, List, BookOpen, Heart, Music2, Mic2, Sparkles } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import SEOHead from '@/components/SEO/SEOHead';
import { generateWebsiteSchema } from '@/utils/schemaGenerator';
import { advancedSearch, type HymnSearchResult, type ComposerSearchResult, type AlbumSearchResult, type PlaylistSearchResult } from '@/lib/mockApis';

const SearchPage: React.FC = () => {
  const { play } = usePlayerStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hymns, setHymns] = useState<HymnSearchResult[]>([]);
  const [composers, setComposers] = useState<ComposerSearchResult[]>([]);
  const [albums, setAlbums] = useState<AlbumSearchResult[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSearchResult[]>([]);

  const schema = generateWebsiteSchema();

  const recentSearches = [
    'Hino 100',
    'Vencendo Vem Jesus',
    'Coral CCB',
    'Hinos de Louvor'
  ];

  const popularSearches = [
    { term: 'Hinos Clássicos', icon: BookOpen },
    { term: 'Louvor', icon: Sparkles },
    { term: 'Adoração', icon: Heart },
    { term: 'Instrumental', icon: Music2 },
    { term: 'Coral', icon: Mic2 },
    { term: 'Oração', icon: Heart }
  ];

  const filters = [
    { id: 'all', label: 'Tudo', icon: List },
    { id: 'songs', label: 'Hinos', icon: Music },
    { id: 'artists', label: 'Compositores', icon: Mic },
    { id: 'albums', label: 'Álbuns', icon: Disc },
    { id: 'playlists', label: 'Playlists', icon: Disc }
  ];

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!searchQuery.trim()) {
        setHymns([]);
        setComposers([]);
        setAlbums([]);
        setPlaylists([]);
        return;
      }
      setIsLoading(true);
      try {
        const type =
          activeFilter === 'songs' ? 'hymns' :
          activeFilter === 'artists' ? 'composers' :
          activeFilter === 'albums' ? 'albums' :
          activeFilter === 'playlists' ? 'playlists' : 'all';
        const { hymns: h, composers: c, albums: a, playlists: p } = await advancedSearch({ query: searchQuery, type, limit: 50 });
        if (!isMounted) return;
        setHymns(h);
        setComposers(c);
        setAlbums(a || []);
        setPlaylists(p || []);
      } catch (err) {
        console.error('SearchPage - advancedSearch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    // Debounce leve
    const t = setTimeout(run, 250);
    return () => {
      isMounted = false;
      clearTimeout(t);
    };
  }, [searchQuery, activeFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (query.trim()) next.set('q', query);
      else next.delete('q');
      return next;
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    });
  };

  const hasResults = searchQuery && ((hymns.length > 0) || (composers.length > 0) || (albums.length > 0) || (playlists.length > 0));

  return (
    <>
      <SEOHead
        title="Buscar Hinos, Compositores, Álbuns e Playlists"
        description="Encontre hinos, descubra compositores, explore álbuns e playlists na plataforma CCB."
        keywords="buscar hinos, busca ccb, compositores ccb, álbuns ccb, playlists ccb"
        canonical="/search"
        schemaData={schema}
      />
      
      <div className="p-6 min-h-screen">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Digite um título, número, compositor, álbum ou playlist"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-background-tertiary border border-gray-700 rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-background-hover transition-colors">
              <X className="w-5 h-5 text-text-muted hover:text-white" />
            </button>
          )}
        </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 justify-center min-w-max px-4 md:px-0">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === (filter.id as any);
              return (
                <button
                  key={filter.id}
                  className={`px-4 py-2 rounded-full border ${active ? 'bg-primary-600 text-white border-transparent' : 'bg-background-tertiary text-text-primary border-gray-700'} flex items-center gap-2 whitespace-nowrap flex-shrink-0`}
                  onClick={() => setActiveFilter(filter.id as any)}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center text-text-muted">Carregando resultados...</div>
        )}

        {/* Results or Suggestions */}
        {hasResults ? (
          <div className="space-y-12">
            {/* Songs / Hymns */}
            {(activeFilter !== 'artists' && hymns.length > 0) && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Hinos</h2>
                <div className="space-y-2">
                  {hymns.map((song) => (
                    <div key={song.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full">
                      <img src={song.cover_url || 'https://picsum.photos/seed/search1/100/100'} alt={song.title} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1">
                        <div className="text-white font-medium">{(() => {
                          const t = String(song.title || '');
                          const n = Number(song.number || 0);
                          const lower = t.toLowerCase();
                          const hasNum = n > 0 && (
                            lower.includes(`hino ${n}`) ||
                            lower.startsWith(`${n} -`) ||
                            lower.includes(`${n} -`) ||
                            lower.includes(`#${n}`) ||
                            lower.includes(`nº ${n}`)
                          );
                          return n > 0 && !hasNum ? `${n} - ${t}` : t;
                        })()}</div>
                        <div className="text-text-muted text-sm">{song.composer_name || song.category || 'Hino'}</div>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-background-tertiary"
                        onClick={() => {
                          const fallback = 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';
                          play({ id: song.id, title: song.title, artist: song.composer_name || 'Coral CCB', coverUrl: song.cover_url || '', audioUrl: fallback } as any)
                        }}
                      >
                        <Play className="w-5 h-5 text-white" />
                      </button>
                      <Link to={`/hino/${song.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-background-tertiary text-text-muted hover:text-white">
                        Ver
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Artists / Composers */}
            {(activeFilter !== 'songs' && composers.length > 0) && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Compositores</h2>
                <div className="space-y-2">
                  {composers.map((artist) => (
                    <Link key={artist.id} to={`/compositor/${artist.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full">
                      <div className="w-12 h-12 bg-background-tertiary rounded flex items-center justify-center overflow-hidden">
                        <img src={artist.photo_url || 'https://picsum.photos/seed/artist1/150/150'} className="w-12 h-12 object-cover" alt={artist.name} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{artist.name}</div>
                        <div className="text-text-muted text-sm">{artist.total_hymns ? `${artist.total_hymns} hinos` : 'Compositor'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {(activeFilter !== 'artists' && activeFilter !== 'songs' && albums.length > 0 || (activeFilter === 'albums' && albums.length > 0)) && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Álbuns</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albums.map((album) => (
                    <Link key={album.id} to={`/album/${album.id}`} className="p-3 rounded-lg hover:bg-background-hover transition-colors">
                      <img src={album.cover_url || 'https://picsum.photos/seed/album1/200/200'} alt={album.title} className="w-full h-36 object-cover rounded mb-3" />
                      <div className="text-white font-medium truncate">{album.title}</div>
                      <div className="text-text-muted text-sm truncate">{album.artist || 'Álbum'}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Playlists */}
            {(activeFilter !== 'artists' && activeFilter !== 'songs' && playlists.length > 0 || (activeFilter === 'playlists' && playlists.length > 0)) && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Playlists</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playlists.map((pl) => (
                    <Link key={pl.id} to={`/playlist/${pl.id}`} className="p-3 rounded-lg hover:bg-background-hover transition-colors">
                      <img src={pl.cover_url || 'https://picsum.photos/seed/playlist1/200/200'} alt={pl.name} className="w-full h-36 object-cover rounded mb-3" />
                      <div className="text-white font-medium truncate">{pl.name}</div>
                      <div className="text-text-muted text-sm truncate">{pl.hymns_count ? `${pl.hymns_count} hinos` : (pl.description || 'Playlist')}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Recent Searches */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Buscas recentes</h2>
              <div className="space-y-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(term)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full text-left"
                  >
                    <div className="w-12 h-12 bg-background-tertiary rounded flex items-center justify-center">
                      <Search className="w-5 h-5 text-text-muted" />
                    </div>
                    <span className="text-white font-medium flex-1">{term}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-5 h-5 text-text-muted hover:text-white" />
                    </button>
                  </button>
                ))}
              </div>
            </section>

            {/* Popular Searches */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Busque por categoria</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {popularSearches.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSearch(item.term)}
                      className="p-6 bg-gradient-to-br from-primary-900/40 to-background-secondary rounded-xl hover:from-primary-900/60 hover:to-background-hover transition-all group"
                    >
                      <div className="mb-3 flex justify-center">
                        <Icon className="w-12 h-12 text-primary-400" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">{item.term}</h3>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchPage;
