
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
  customBeatmap?: {
    bpm: number;
    speeds: Record<string, number>;
    tracks? : Record<string, { hard: string; extreme: string }>; // instrument -> format
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
    },
    customBeatmap: {
      bpm: 103,
      speeds: { easy: 400, extreme: 1100, hard: 800, normal: 600 },
      tracks: {
        other: {
          hard: "0:1.06,3:1.45,4:1.64,1:1.76,1:2.02,2:2.21,4:2.33,4:2.59,0:2.78,2:2.9,2:3.16,3:3.35,0:3.47,1:3.73,3:4.11,0:4.49,1:4.68,2:4.8,3:5.06,4:5.25,0:5.37,1:5.63,2:5.82,3:5.94,4:6.2,0:6.39,2:6.7,0:6.77,4:7.08,0:7.15,1:7.53,2:7.72,4:8.1,0:8.29,2:8.67,3:8.86,0:9.24,1:9.43,4:9.74,3:9.81,1:10.19,4:10.76,2:11.33,0:11.9,0:12.27,3:12.47,1:13.22,3:13.6,4:13.79,0:13.91,1:14.17,2:14.36,3:14.48,4:14.74,0:14.93,2:15.31,3:15.5,0:15.88,3:16.19,2:16.26,0:16.5,4:16.64,0:16.83,2:16.95,2:17.21,3:17.4,0:17.78,1:17.97,3:18.35,4:18.54,1:18.66,2:18.92,4:19.3,1:19.68,2:19.87,4:20.25,0:20.44,3:21.01,4:21.38,1:21.58,0:22.34,1:22.71,3:22.91,4:23.28,2:23.85,4:24.16,0:24.42,1:24.79,4:25.36,1:25.56,0:26.32,2:26.7,2:27.46,4:27.84,3:28.02,2:30.86,0:31.43,2:32.39,2:32.57,4:32.77,4:32.95,3:33.53,0:33.91,4:34.85,1:35.23,3:35.43,0:41.5,0:41.68,4:42.44,1:42.64,0:43.58,1:44.54,4:44.92,1:45.3,3:45.68,0:46.06,3:47.58,2:48.52,1:48.7,3:49.08,1:50.41,4:51.93,3:56.3,4:60.47,2:63.89,1:64.46,2:68.63,4:79.45,0:79.64,1:79.83,2:80.02,3:80.21,3:81.16,3:82.87,4:83.06,1:84.39,3:84.77,0:88.18,4:91.6,0:91.79,1:91.98,2:92.17,0:96.54,1:100.52,1:101.47,1:110.01,1:110.96,4:111.53,0:112.67,4:113.43,4:121.02,2:126.33,3:129.37,3:134.11,0:134.31,0:135.44,3:136.96,4:137.73,2:140.38,2:147.21,1:155.56,0:157.27,3:166.19,0:173.4,2:176.44,1:177.2,0:185.55,3:187.07,1:188.59,3:188.97,0:189.35,0:203.58,1:203.77",
          extreme: "0:0.04,2:0.13,3:0.54,0:1.06,4:1.38,3:1.45,4:1.64,1:1.76,2:1.95,1:2.02,2:2.21,4:2.33,0:2.44,1:2.52,4:2.59,0:2.78,2:2.9,2:3.16,3:3.35,0:3.47,1:3.66,0:3.73,3:4.04,0:4.11,0:4.35,1:4.49,1:4.68,2:4.8,3:4.99,0:5.06,4:5.25,0:5.37,1:5.63,2:5.82,3:5.94,0:6.06,4:6.2,0:6.39,1:6.51,2:6.7,0:6.77,0:7.01,4:7.08,1:7.15,2:7.39,1:7.53,2:7.72,4:7.84,0:8.03,4:8.1,0:8.29,2:8.41,3:8.6,2:8.67,3:8.86,0:8.98,1:9.17,0:9.24,1:9.43,3:9.55,4:9.74,3:9.81,1:10.05,0:10.12,2:10.19,3:10.43,0:10.5,1:10.57,4:10.76,0:10.88,1:11.07,4:11.13,2:11.33,3:11.45,4:11.64,2:11.7,0:11.9,1:12.01,2:12.21,0:12.27,3:12.47,0:12.58,0:12.78,4:12.84,1:13.08,2:13.16,0:13.22,4:13.46,3:13.6,4:13.79,0:13.91,3:14.08,1:14.17,2:14.36,3:14.48,4:14.67,0:14.74,0:14.93,1:15.05,3:15.17,2:15.24,0:15.31,3:15.5,4:15.62,0:15.81,1:15.88,3:16.12,0:16.19,2:16.26,0:16.5,4:16.64,0:16.83,2:16.95,0:17.12,2:17.21,3:17.4,0:17.52,1:17.71,0:17.78,1:17.97,3:18.09,4:18.28,3:18.35,4:18.54,1:18.66,2:18.85,0:18.92,4:19.16,0:19.23,1:19.3,0:19.53,1:19.61,0:19.68,2:19.87,3:19.99,4:20.18,0:20.25,0:20.44,1:20.56,2:20.75,0:20.81,3:21.01,4:21.13,0:21.32,4:21.38,1:21.58,0:21.69,3:21.89,0:21.96,1:22.2,0:22.27,2:22.34,2:22.57,1:22.64,0:22.71,3:22.91,0:23.02,4:23.21,0:23.28,0:23.47,1:23.59,4:23.79,2:23.85,3:24.04,4:24.16,0:24.42,0:24.6,3:24.73,1:24.79,0:24.97,1:25.3,4:25.36,1:25.56,1:25.74,2:25.93,3:26.12,0:26.32,0:26.5,2:26.7,2:26.88,4:27.08,4:27.26,2:27.46,1:27.64,3:27.69,4:27.84,3:28.02,3:28.2,4:28.39,1:28.59,1:28.77,2:28.96,4:29.16,2:29.36,0:29.47,1:29.53,4:29.74,2:29.91,0:30.11,4:30.29,2:30.49,4:30.62,1:30.67,2:30.86,3:31.05,1:31.25,0:31.43,1:31.62,2:31.81,4:32,1:32.2,2:32.39,2:32.57,4:32.77,4:32.95,1:33.15,2:33.27,1:33.33,3:33.53,3:33.71,0:33.91,0:34.09,2:34.29,1:34.46,4:34.85,0:35.04,1:35.23,3:35.43,3:35.61,0:35.81,0:35.99,2:36.37,3:37.51,4:37.7,0:37.89,1:38.08,2:38.27,0:38.47,3:38.64,1:38.84,0:39.02,3:39.22,2:39.4,1:39.61,4:39.78,2:39.98,1:40.16,2:40.35,3:40.54,2:40.75,1:40.92,3:41.3,0:41.5,0:41.68,2:41.88,2:42.06,4:42.26,4:42.44,1:42.64,1:42.82,2:43.01,3:43.2,3:43.38,0:43.58,1:43.77,2:43.96,4:44.16,4:44.34,1:44.54,0:44.71,4:44.92,2:45.09,1:45.3,0:45.48,3:45.68,2:45.86,0:46.06,4:46.24,4:46.42,0:46.61,4:47,0:47.19,4:47.37,3:47.58,1:47.75,4:47.95,3:48.13,2:48.52,1:48.7,3:49.08,1:49.46,0:49.71,4:49.85,1:49.9,0:50.04,1:50.41,4:50.47,3:50.61,0:50.88,4:50.98,1:51.18,3:51.56,3:51.74,4:51.93,1:52.02,1:52.31,4:52.88,0:53.07,1:53.26,2:53.45,3:53.64,0:54.02,1:54.21,0:54.6,1:55.23,0:55.73,3:56.12,3:56.3,2:56.48,0:56.68,3:57.25,2:57.43,1:57.82,2:58.01,3:58.2,4:58.57,4:59.34,0:59.38,0:59.53,3:60.1,3:60.28,4:60.47,1:60.85,4:60.91,0:61.02,3:61.23,2:61.99,0:62.19,0:62.56,1:62.75,3:63.13,1:63.33,4:63.5,4:63.72,2:63.89,1:63.95,1:64.46,2:64.51,0:64.64,3:64.84,4:65.03,1:65.23,1:65.41,0:65.59,3:65.79,0:66.17,1:66.36,3:66.92,4:67.11,1:67.31,1:67.49,2:67.68,3:68.31,1:68.44,2:68.63,3:68.82,0:68.91,2:69.58,0:70.15,3:70.72,4:71.49,3:71.67,4:71.71,4:71.86,3:72.62,1:72.82,1:73,0:73.18,1:73.37,3:73.75,3:74.33,2:75.09,1:76.03,0:76.79,1:77.2,3:77.36,4:77.95,2:78.12,3:79.26,4:79.45,0:79.64,1:79.83,2:80.02,3:80.21,4:80.4,2:80.6,3:81.16,4:81.42,2:81.55,2:81.73,2:82.68,3:82.87,4:83.06,0:83.25,1:83.44,1:83.7,1:84.39,0:84.6,3:84.77,1:85.34,1:86.47,4:87.99,0:88.18,1:88.37,4:88.94,0:89.35,0:90.08,1:90.27,1:91.03,3:91.41,4:91.6,0:91.79,1:91.98,2:92.17,3:92.36,4:92.55,3:93.31,4:93.5,0:93.69,1:93.88,2:94.51,0:94.65,1:94.83,2:95.02,2:95.2,3:95.39,1:95.96,3:96.34,0:96.54,0:96.72,4:97.73,1:97.86,1:98.33,0:98.65,1:98.81,3:99,1:99.06,0:99.38,2:100.2,1:100.34,1:100.52,2:100.75,0:101.06,4:101.2,0:101.32,1:101.47,3:101.85,4:102.04,1:103.55,3:104.15,3:104.33,4:105.07,3:105.57,1:105.92,4:106.31,2:106.59,4:106.97,1:107.97,3:108.31,4:109.63,1:110.01,4:110.58,1:110.63,1:110.96,2:111.15,4:111.53,0:111.72,3:112.14,4:112.48,0:112.67,1:112.86,1:113.04,4:113.1,3:113.24,0:113.31,4:113.43,2:115.71,0:115.81,0:116.06,1:116.25,0:116.29,4:117.22,0:117.63,3:117.8,4:117.99,4:118.39,2:118.74,3:118.93,0:119.02,4:119.12,0:119.49,2:119.69,2:119.87,0:120.26,4:120.65,0:120.84,4:121.02,3:121.23,3:121.41,4:121.97,0:122.16,2:122.54,4:123.1,0:123.29,4:123.68,2:124.07,3:124.81,2:125.64,2:126.33,2:127.1,1:127.24,4:127.48,4:127.66,3:128.24,0:128.8,1:128.99,3:129.37,1:129.79,1:129.94,2:130.13,1:130.52,4:130.91,2:131.08,3:131.27,3:131.52,1:131.65,2:131.84,3:132.4,3:132.98,4:133.17,0:133.4,1:133.55,0:133.98,3:134.11,0:134.31,1:134.5,1:134.68,0:135.44,2:136.22,3:136.96,4:137.73,2:138.67,2:138.89,4:139.05,1:139.61,1:140.19,2:140.38,2:141.15,3:141.52,3:141.92,0:142.67,1:143.04,4:143.79,0:143.98,1:144.17,2:144.36,4:144.74,0:144.93,0:146.83,2:147.21,1:148.59,0:148.73,2:148.92,0:150.08,1:150.63,3:151.01,1:151.76,2:151.95,3:152.14,0:152.34,1:152.53,1:152.71,3:152.91,4:153.1,4:154.05,1:154.43,2:154.62,2:154.8,4:155.25,2:155.38,1:155.56,2:155.75,0:155.95,1:156.14,0:156.32,4:156.82,4:157.08,0:157.27,1:157.49,3:157.65,0:159.02,4:159.19,2:159.36,0:160.88,1:161.07,2:161.26,3:161.63,0:162.23,2:162.39,0:163.91,2:164.29,0:164.86,0:165.04,0:165.26,3:165.43,2:165.71,2:166.04,3:166.19,0:166.23,4:166.38,1:166.58,3:166.78,2:166.95,0:167.05,4:167.37,0:167.52,1:167.71,2:167.9,3:168.09,4:168.32,3:168.71,0:168.87,0:169.24,0:169.42,4:170.18,2:170.75,0:171.21,1:171.32,0:171.54,2:171.7,4:171.75,1:171.91,2:172.46,3:173.09,2:173.23,0:173.4,1:173.59,0:173.65,4:173.79,1:174.17,0:174.35,4:174.74,4:174.92,0:174.97,1:175.3,3:175.5,2:176.44,3:176.96,0:177.07,1:177.2,0:177.96,4:179.67,0:180.99,3:181.19,4:181.42,1:182.75,2:183.27,3:183.53,2:184.03,1:184.61,2:184.65,0:185.04,3:185.17,0:185.55,1:185.74,0:185.81,2:185.93,3:186.12,1:186.18,4:186.31,1:186.51,3:186.56,2:186.88,3:187.07,1:187.64,4:188.5,1:188.59,2:188.78,3:188.97,3:189.15,0:189.35,0:190.11,1:190.89,3:191.01,0:193.14,1:194.17,3:194.66,0:194.86,2:195.42,4:195.8,1:196.18,0:196.43,0:197.96,2:198.27,4:199.67,3:202.03,4:202.77,2:203.01,3:203.2,4:203.39,0:203.58,1:203.77,4:206.24,2:206.73,2:207.57,1:209.46,3:209.66,2:210.6,1:211.62,0:212.19,1:213.26,0:213.51,1:214.21,2:214.4,1:221.87"
        }
      }
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
