
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Song, defaultPlaylist, getSongs, saveSong } from '../lib/utils';

interface LobbyProps {
  onSelectSong: (song: Song) => void;
  isLoadingSong: boolean;
}

export function Lobby({ onSelectSong, isLoadingSong }: LobbyProps) {
  const [currentTab, setCurrentTab] = useState<'playlist' | 'favorite' | 'myMusic'>('playlist');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [myMusicList, setMyMusicList] = useState<Song[]>([]);

  useEffect(() => {
    const savedFavs = localStorage.getItem('rhythm_favorites');
    if (savedFavs) {
      try { 
        const parsed = JSON.parse(savedFavs);
        setTimeout(() => setFavorites(parsed), 0);
      } catch(e){}
    }
    getSongs().then((songs) => {
      setTimeout(() => setMyMusicList(songs), 0);
    }).catch(console.error);
  }, []);

  const toggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
       const next = prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId];
       localStorage.setItem('rhythm_favorites', JSON.stringify(next));
       return next;
    });
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
       await saveSong(file);
       const updated = await getSongs();
       setMyMusicList(updated);
    } catch (err) {
       console.error(err);
    }
  };

  const renderSongItem = (song: Song) => {
    const isFav = favorites.includes(song.id);
    return (
       <div key={song.id} 
            className="flex items-center justify-between p-4 bg-neutral-800/80 hover:bg-neutral-700/80 rounded-xl cursor-pointer transition-colors border border-white/5 active:scale-[0.99] group"
            onClick={() => onSelectSong(song)}>
          <span className="font-bold text-slate-200 text-lg truncate max-w-[80%] group-hover:text-white transition-colors">{song.title}</span>
          <button 
             onClick={(e) => toggleFavorite(song.id, e)}
             className={`p-2 rounded-full transition-colors ${isFav ? 'text-rose-500 hover:bg-rose-500/10' : 'text-neutral-500 hover:text-slate-300 hover:bg-white/10'}`}>
              <Heart fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} size={24} />
          </button>
       </div>
    );
  };

  const renderSongList = () => {
    let list: Song[] = [];
    if (currentTab === 'playlist') list = defaultPlaylist;
    else if (currentTab === 'myMusic') list = myMusicList;
    else if (currentTab === 'favorite') {
       list = [...defaultPlaylist, ...myMusicList].filter(s => favorites.includes(s.id));
    }

    if (currentTab === 'myMusic') {
       return (
          <>
            <label className="flex items-center justify-center p-6 rounded-xl border-2 border-dashed border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer text-emerald-400 font-bold mb-4 transition-all">
               <span>+ Upload New Song (MP3)</span>
               <input type="file" accept="audio/*" className="hidden" onChange={handleLocalUpload} />
            </label>
            {list.length === 0 && <p className="text-center text-neutral-500 mt-8">No uploaded songs yet.</p>}
            {list.map(s => renderSongItem(s))}
          </>
       )
    }

    if (list.length === 0) {
        return <p className="text-center text-neutral-500 mt-8">No songs found.</p>;
    }

    return list.map(s => renderSongItem(s));
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center overflow-auto selection:bg-emerald-500/30">
        <div className="w-full p-6 text-center pt-12 md:pt-16 pb-8">
            <h1 className="text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                Rhytmika
            </h1>
            <p className="text-emerald-500/60 font-bold tracking-[0.2em] text-sm mt-3 uppercase">Drop the beat.</p>
        </div>

        <div className="w-full max-w-2xl px-4 pb-24 flex flex-col gap-6">
            <div className="bg-neutral-800/50 p-1 flex rounded-xl border border-white/5">
                {(['playlist', 'favorite', 'myMusic'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        className={`flex-1 py-3 text-sm font-bold tracking-wide rounded-lg transition-all capitalize ${
                            currentTab === tab 
                                ? 'bg-neutral-700/80 text-white shadow-sm border border-white/5' 
                                : 'text-neutral-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab === 'myMusic' ? 'My Music' : tab}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                {renderSongList()}
            </div>
        </div>
    </div>
  );
}
