export interface Song {
  id: string;
  title: string;
  artist: string;
  src: string;
}

export const defaultSongs: Song[] = [
  {
    id: '1',
    title: 'ミカヅキ BIGWAVE',
    artist: 'YUME DIARY',
    src: 'https://music.361533.xyz/background%20music/BIGWAVE.mp3'
  },
  {
    id: '2',
    title: '萌系少女直球法则',
    artist: 'mayauzz,Zy',
    src: 'https://music.361533.xyz/background%20music/mayauzz%2CZy%20-%20%E8%90%8C%E7%B3%BB%E5%B0%91%E5%A5%B3%E7%9B%B4%E7%90%83%E6%B3%95%E5%88%99.mp3'
  },
  {
    id: '3',
    title: 'Sample this',
    artist: 'RJ Pasin',
    src: 'https://music.361533.xyz/background%20music/RJ%20Pasin%20-%20Sample%20this.mp3'
  },
  {
    id: '4',
    title: 'Gone',
    artist: 'Vanished',
    src: 'https://music.361533.xyz/background%20music/Vanished%20-%20Gone.mp3'
  },
  {
    id: '5',
    title: 'Neon Love',
    artist: 'Vanished',
    src: 'https://music.361533.xyz/background%20music/Vanished%20-%20Neon%20Love.mp3'
  },
  {
    id: '6',
    title: 'Blush',
    artist: 'Fusq,MYLK',
    src: 'https://music.361533.xyz/background%20music/Fusq%2CMYLK%20-%20Blush.flac'
  },
];