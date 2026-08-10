export interface Song {
  id: string;
  title: string;
  artist: string;
  src: string;
}

// 音乐文件托管：域名与目录由环境变量注入（构建时），不再写死
const musicBase = [process.env.MUSIC_ACCESS_HOST, process.env.MUSIC_FOLDER]
  .filter(Boolean)
  .join('/')
  .replace(/\/+$/, '');

export const defaultSongs: Song[] = [
  {
    id: '1',
    title: 'ミカヅキ BIGWAVE',
    artist: 'YUME DIARY',
    src: `${musicBase}/BIGWAVE.mp3`
  },
  {
    id: '2',
    title: '萌系少女直球法则',
    artist: 'mayauzz,Zy',
    src: `${musicBase}/mayauzz%2CZy%20-%20%E8%90%8C%E7%B3%BB%E5%B0%91%E5%A5%B3%E7%9B%B4%E7%90%83%E6%B3%95%E5%88%99.mp3`
  },
  {
    id: '3',
    title: 'Sample this',
    artist: 'RJ Pasin',
    src: `${musicBase}/RJ%20Pasin%20-%20Sample%20this.mp3`
  },
  {
    id: '4',
    title: 'Gone',
    artist: 'Vanished',
    src: `${musicBase}/Vanished%20-%20Gone.mp3`
  },
  {
    id: '5',
    title: 'Neon Love',
    artist: 'Vanished',
    src: `${musicBase}/Vanished%20-%20Neon%20Love.mp3`
  },
  {
    id: '6',
    title: 'Blush',
    artist: 'Fusq,MYLK',
    src: `${musicBase}/Fusq%2CMYLK%20-%20Blush.flac`
  },
];
