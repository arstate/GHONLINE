
export type Song = {
  id: string;
  title: string;
  type: 'remote' | 'local';
  url?: string;
  stems?: {
    vocals: string;
    other: string; // guitar etc
    drums: string;
    bass: string;
    metronome?: string;
  };
  dbId?: number;
};

export const defaultPlaylist: Song[] = [
  { 
    id: '1', 
    title: "Ghea Indrawari - Teramini (Multitrack)", 
    type: 'remote', 
    stems: {
      vocals: "https://ia600702.us.archive.org/6/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-vocals-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-vocals-Ab%20major-158bpm-441hz.mp3",
      other: "https://ia600607.us.archive.org/1/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-other-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-other-Ab%20major-158bpm-441hz.mp3",
      drums: "https://ia903200.us.archive.org/31/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-drums-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-drums-Ab%20major-158bpm-441hz.mp3",
      bass: "https://ia601906.us.archive.org/12/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-bass-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-bass-Ab%20major-158bpm-441hz.mp3"
    } 
  },
  {
    id: '9',
    title: "KARNAMEREKA - Tante Kesepian (Multitrack)",
    type: 'remote',
    stems: {
      vocals: "https://ia902900.us.archive.org/24/items/karnamereka-tante-kesepian-video-lirik-karnamereka-vocals-c-major-220bpm-441hz/KARNAMEREKA%20-%20Tante%20Kesepian%20%28%20video%20lirik%20%29%20-%20KARNAMEREKA-vocals-C%20major-220bpm-441hz.mp3",
      other: "https://ia601508.us.archive.org/26/items/karnamereka-tante-kesepian-video-lirik-karnamereka-other-c-major-220bpm-441hz/KARNAMEREKA%20-%20Tante%20Kesepian%20%28%20video%20lirik%20%29%20-%20KARNAMEREKA-other-C%20major-220bpm-441hz.mp3",
      drums: "https://ia600507.us.archive.org/28/items/karnamereka-tante-kesepian-video-lirik-karnamereka-drums-c-major-220bpm-441hz/KARNAMEREKA%20-%20Tante%20Kesepian%20%28%20video%20lirik%20%29%20-%20KARNAMEREKA-drums-C%20major-220bpm-441hz.mp3",
      bass: "https://ia601007.us.archive.org/10/items/karnamereka-tante-kesepian-video-lirik-karnamereka-bass-c-major-220bpm-441hz/KARNAMEREKA%20-%20Tante%20Kesepian%20%28%20video%20lirik%20%29%20-%20KARNAMEREKA-bass-C%20major-220bpm-441hz.mp3"
    }
  },
  { 
    id: '2', 
    title: "Dewi (Multitrack)", 
    type: 'remote', 
    stems: {
      vocals: "https://ia601608.us.archive.org/5/items/dewi-vocals-c-major-198bpm-441hz/Dewi-vocals-C%20major-198bpm-441hz.mp3",
      other: "https://ia800406.us.archive.org/0/items/dewi-other-c-major-198bpm-441hz/Dewi-other-C%20major-198bpm-441hz.mp3",
      drums: "https://ia600702.us.archive.org/31/items/dewi-drums-c-major-198bpm-441hz/Dewi-drums-C%20major-198bpm-441hz.mp3",
      bass: "https://ia601007.us.archive.org/9/items/dewi-bass-c-major-198bpm-441hz/Dewi-bass-C%20major-198bpm-441hz.mp3",
      metronome: "https://ia800408.us.archive.org/29/items/dewi-metronome-c-major-198bpm-441hz/Dewi-metronome-C%20major-198bpm-441hz.mp3"
    }
  },
  { 
    id: '3', 
    title: "Threesixty - Dewi (Pop Punk Cover) (Multitrack)", 
    type: 'remote', 
    stems: {
      vocals: "https://ia601906.us.archive.org/23/items/threesixty-dewi-pop-punk-cover-lyric-video-vocals-c-major-203bpm-441hz/Threesixty%20-%20Dewi%EF%BD%9C%20Pop%20Punk%20Cover%20%28Lyric%20Video%29-vocals-C%20major-203bpm-441hz.mp3",
      other: "https://ia600507.us.archive.org/13/items/threesixty-dewi-pop-punk-cover-lyric-video-other-c-major-203bpm-441hz/Threesixty%20-%20Dewi%EF%BD%9C%20Pop%20Punk%20Cover%20%28Lyric%20Video%29-other-C%20major-203bpm-441hz.mp3",
      drums: "https://ia600601.us.archive.org/4/items/threesixty-dewi-pop-punk-cover-lyric-video-drums-c-major-203bpm-441hz/Threesixty%20-%20Dewi%EF%BD%9C%20Pop%20Punk%20Cover%20%28Lyric%20Video%29-drums-C%20major-203bpm-441hz.mp3",
      bass: "https://ia601502.us.archive.org/21/items/threesixty-dewi-pop-punk-cover-lyric-video-bass-c-major-203bpm-441hz/Threesixty%20-%20Dewi%EF%BD%9C%20Pop%20Punk%20Cover%20%28Lyric%20Video%29-bass-C%20major-203bpm-441hz.mp3"
    } 
  },
  { id: '4', title: "Hindia - everything u are", type: 'remote', url: "https://ia601507.us.archive.org/4/items/hindia-everything-u-are/Hindia%20-%20everything%20u%20are.mp3" },
  { id: '5', title: ".Feast - Nina", type: 'remote', url: "https://ia600704.us.archive.org/33/items/feast-nina-official-lyric-video/Feast%20-%20Nina%20%28Official%20Lyric%20Video%29.mp3" },
  { id: '6', title: "Sampai Nanti - Threesixty Skatepunk", type: 'remote', url: "https://ia600900.us.archive.org/13/items/sampai-nanti-threesixty-skatepunk/Sampai%20Nanti%20-%20Threesixty%20Skatepunk.mp3" },
  { 
    id: '7', 
    title: "DRAGONFORCE - Through the Fire and Flames (Multitrack)", 
    type: 'remote', 
    stems: {
      vocals: "https://dn711202.ca.archive.org/0/items/dragonforce-through-the-fire-and-flames-official-video-dragon-force-youtube-voca/DRAGONFORCE%20-%20Through%20the%20Fire%20and%20Flames%20%28Official%20Video%29%20-%20DragonForce%20%28youtube%29-vocals-C%20minor-200bpm-441hz.mp3",
      other: "https://dn711202.ca.archive.org/0/items/dragonforce-through-the-fire-and-flames-official-video-dragon-force-youtube-othe/DRAGONFORCE%20-%20Through%20the%20Fire%20and%20Flames%20%28Official%20Video%29%20-%20DragonForce%20%28youtube%29-other-C%20minor-200bpm-441hz.mp3",
      drums: "https://dn711202.ca.archive.org/0/items/dragonforce-through-the-fire-and-flames-official-video-dragon-force-youtube-drum/DRAGONFORCE%20-%20Through%20the%20Fire%20and%20Flames%20%28Official%20Video%29%20-%20DragonForce%20%28youtube%29-drums-C%20minor-200bpm-441hz.mp3",
      bass: "https://dn711202.ca.archive.org/0/items/dragonforce-through-the-fire-and-flames-official-video-dragon-force-youtube-bass/DRAGONFORCE%20-%20Through%20the%20Fire%20and%20Flames%20%28Official%20Video%29%20-%20DragonForce%20%28youtube%29-bass-C%20minor-200bpm-441hz.mp3"
    } 
  },
  { id: '8', title: "Tulus - Andai Aku Bisa (Chrisye Cover)", type: 'remote', url: "https://ia601600.us.archive.org/11/items/tulus-andai-aku-bisa-chrisye-cover-lirik-vero-april-youtube/Tulus%20-%20Andai%20Aku%20Bisa%20%28Chrisye%20Cover%29%20%20Lirik%20-%20Vero%20April%20%28youtube%29.mp3" },
  {
    id: '10',
    title: "Avenged Sevenfold - Cosmic (Multitrack)",
    type: 'remote',
    stems: {
      vocals: "https://ia600102.us.archive.org/15/items/avenged-sevenfold-cosmic-official-visualizer-avenged-sevenfold-vocals-e-minor-127bpm-440hz/Avenged%20Sevenfold%20-%20Cosmic%20%28Official%20Visualizer%29%20-%20Avenged%20Sevenfold-vocals-E%20minor-127bpm-440hz.mp3",
      other: "https://ia600702.us.archive.org/17/items/avenged-sevenfold-cosmic-official-visualizer-avenged-sevenfold-other-e-minor-127bpm-440hz/Avenged%20Sevenfold%20-%20Cosmic%20%28Official%20Visualizer%29%20-%20Avenged%20Sevenfold-other-E%20minor-127bpm-440hz.mp3",
      drums: "https://ia600609.us.archive.org/35/items/avenged-sevenfold-cosmic-official-visualizer-avenged-sevenfold-drums-e-minor-127bpm-440hz/Avenged%20Sevenfold%20-%20Cosmic%20%28Official%20Visualizer%29%20-%20Avenged%20Sevenfold-drums-E%20minor-127bpm-440hz.mp3",
      bass: "https://ia601608.us.archive.org/18/items/avenged-sevenfold-cosmic-official-visualizer-avenged-sevenfold-bass-e-minor-127bpm-440hz/Avenged%20Sevenfold%20-%20Cosmic%20%28Official%20Visualizer%29%20-%20Avenged%20Sevenfold-bass-E%20minor-127bpm-440hz.mp3",
      metronome: "https://ia600507.us.archive.org/19/items/avenged-sevenfold-cosmic-official-visualizer-avenged-sevenfold-metronome-e-minor-127bpm-440hz/Avenged%20Sevenfold%20-%20Cosmic%20%28Official%20Visualizer%29%20-%20Avenged%20Sevenfold-metronome-E%20minor-127bpm-440hz.mp3"
    }
  },
  {
    id: '11',
    title: "Dewa 19 - Aku Milikmu (Multitrack)",
    type: 'remote',
    stems: {
      vocals: "https://ia801500.us.archive.org/25/items/dewa-19-aku-milikmu-official-music-video-aquarius-musikindo-vocals-e-major-135bpm-441hz/Dewa%2019%20-%20Aku%20Milikmu%20Official%20Music%20Video%20-%20Aquarius%20Musikindo-vocals-E%20major-135bpm-441hz.mp3",
      other: "https://ia902808.us.archive.org/12/items/dewa-19-aku-milikmu-official-music-video-aquarius-musikindo-other-e-major-135bpm-441hz/Dewa%2019%20-%20Aku%20Milikmu%20Official%20Music%20Video%20-%20Aquarius%20Musikindo-other-E%20major-135bpm-441hz.mp3",
      drums: "https://ia601905.us.archive.org/31/items/dewa-19-aku-milikmu-official-music-video-aquarius-musikindo-drums-e-major-135bpm-441hz/Dewa%2019%20-%20Aku%20Milikmu%20Official%20Music%20Video%20-%20Aquarius%20Musikindo-drums-E%20major-135bpm-441hz.mp3",
      bass: "https://ia601406.us.archive.org/27/items/dewa-19-aku-milikmu-official-music-video-aquarius-musikindo-bass-e-major-135bpm-441hz/Dewa%2019%20-%20Aku%20Milikmu%20Official%20Music%20Video%20-%20Aquarius%20Musikindo-bass-E%20major-135bpm-441hz.mp3",
      metronome: "https://ia600505.us.archive.org/12/items/dewa-19-aku-milikmu-official-music-video-aquarius-musikindo-metronome-e-major-135bpm-441hz/Dewa%2019%20-%20Aku%20Milikmu%20Official%20Music%20Video%20-%20Aquarius%20Musikindo-metronome-E%20major-135bpm-441hz.mp3"
    }
  }
];

const DB_NAME = 'RhythmGameDB';
const STORE_NAME = 'myMusic';

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSong = async (file: File): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({
      title: file.name.replace(/\.[^/.]+$/, ""),
      file: file,
      timestamp: Date.now()
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSongs = async (): Promise<Song[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            resolve(request.result.map((item: any) => ({
                id: `local_${item.id}`,
                dbId: item.id,
                title: item.title,
                type: 'local'
            })));
        };
        request.onerror = () => reject(request.error);
    });
};

export const getSongBuffer = async (dbId: number): Promise<ArrayBuffer> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(dbId);
        request.onsuccess = async () => {
            if (request.result && request.result.file) {
                resolve(await request.result.file.arrayBuffer());
            } else {
                reject(new Error("File not found"));
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
