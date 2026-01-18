import { useEffect, useRef, useState } from 'react';
import { Song } from '../types/music';

type ThemeMode = 'light' | 'dark' | 'system';

interface MusicPlayerProps {
  src?: string; // 音乐文件 URL
  title?: string; // 歌曲名称
  artist?: string; // 艺术家
  autoPlay?: boolean; // 是否自动播放
  compact?: boolean; // 紧凑横条模式
  songs?: Song[]; // 歌曲列表
}

export function MusicPlayer({ 
  src = '', 
  title = '未知歌曲', 
  artist = '未知艺术家',
  autoPlay = true, // 默认值改为true，确保自动播放
  compact = true,
  songs = []
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [modeState, setModeState] = useState<ThemeMode>('system');

  // 初始化主题模式
  useEffect(() => {
    const mode = localStorage.getItem('theme') as ThemeMode || 'system';
    setModeState(mode);
    setMode(mode);
  }, [])

  const setMode = (mode: ThemeMode) => {
    setModeState(mode);
    localStorage.setItem('theme', mode);

    if (mode !== 'system' || (!('theme' in localStorage) && window.matchMedia(`(prefers-color-scheme: ${mode})`).matches)) {
      document.documentElement.setAttribute('data-color-mode', mode);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (mediaQuery.matches) {
        document.documentElement.setAttribute('data-color-mode', 'dark');
      } else {
        document.documentElement.setAttribute('data-color-mode', 'light');
      }
    }
    window.dispatchEvent(new Event("colorSchemeChange"));
  };

  // 初始化当前歌曲
  useEffect(() => {
    if (songs.length > 0) {
      // 随机选择一首歌曲作为初始播放歌曲
      const randomIndex = Math.floor(Math.random() * songs.length);
      const initialSong = songs[randomIndex];
      setCurrentSongIndex(randomIndex);
      setCurrentSong(initialSong);
    } else if (src) {
      setCurrentSong({
        id: '1',
        title,
        artist,
        src
      });
    }
  }, [songs, src, title, artist]);

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      // 自动播放下一首
      if (songs.length > 0) {
        const newIndex = currentSongIndex === songs.length - 1 
          ? 0 
          : currentSongIndex + 1;
        
        setCurrentSongIndex(newIndex);
        setCurrentSong(songs[newIndex]);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [songs, currentSongIndex]);

  // 当当前歌曲变化时更新音频源
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.src = currentSong.src;
    audio.load(); // 确保音频被重新加载
    
    // 当音频元素准备就绪后尝试播放
    const handleCanPlay = () => {
      // 尝试播放
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // 自动播放失败，这是正常的，因为浏览器可能会阻止
      });
    };

    audio.addEventListener('canplay', handleCanPlay);

    // 清理函数
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // 播放失败，可能是因为浏览器阻止了自动播放
        setIsPlaying(true);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const playPrevious = () => {
    if (songs.length === 0) return;
    
    const newIndex = currentSongIndex === 0 
      ? songs.length - 1 
      : currentSongIndex - 1;
    
    setCurrentSongIndex(newIndex);
    setCurrentSong(songs[newIndex]);
    setIsPlaying(true); // 确保点击上一曲时更新状态
  };

  const playNext = () => {
    if (songs.length === 0) return;
    
    const newIndex = currentSongIndex === songs.length - 1 
      ? 0 
      : currentSongIndex + 1;
    
    setCurrentSongIndex(newIndex);
    setCurrentSong(songs[newIndex]);
    setIsPlaying(true); // 确保点击下一曲时更新状态
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 如果没有音乐源，仍然显示播放器但禁用播放功能（便于占位/调试）
  const hasMusic = !!src || !!currentSong?.src;

  const displayTitle = currentSong?.title || title;
  const displayArtist = currentSong?.artist || artist;
  const displaySrc = currentSong?.src || src;

  const rootClassName = compact
    ? "w-full max-w-4xl mx-auto mt-3 px-3 py-2 bg-w dark:bg-neutral-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm"
    : "w-full max-w-2xl mx-auto mt-4 p-4 bg-w dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm";

  return (
    <div className={rootClassName}>
      <audio
        ref={audioRef}
        src={displaySrc}
        preload="metadata"
        autoPlay={autoPlay}
      />
      
      {compact ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* 第一行：控制按钮和歌曲信息 */}
          <div className="flex items-center gap-2 flex-1">
            {/* 上一曲/下一曲 */}
            <div className="flex items-center gap-1">
              <button
                onClick={playPrevious}
                disabled={songs.length <= 1}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  songs.length > 1
                    ? "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    : "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                }`}
                aria-label="上一曲"
              >
                <i className="ri-skip-back-fill text-xs" />
              </button>

              {/* 播放/暂停 */}
              <button
                onClick={hasMusic ? togglePlay : undefined}
                disabled={!hasMusic}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  hasMusic
                    ? "bg-theme text-white hover:bg-theme-hover"
                    : "bg-neutral-300 text-white dark:bg-neutral-700 cursor-not-allowed"
                }`}
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                <i className={isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} />
              </button>

              <button
                onClick={playNext}
                disabled={songs.length <= 1}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  songs.length > 1
                    ? "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    : "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                }`}
                aria-label="下一曲"
              >
                <i className="ri-skip-forward-fill text-xs" />
              </button>
            </div>

            {/* 标题/艺人 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black dark:text-white truncate leading-5">
                {displayTitle}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate leading-4 hidden sm:block">
                {displayArtist}
              </p>
            </div>

            {/* 音量控制（仅在大屏幕显示） */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={hasMusic ? toggleMute : undefined}
                disabled={!hasMusic}
                className={`w-7 h-7 flex items-center justify-center transition-colors ${
                  hasMusic
                    ? "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    : "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                }`}
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                <i className={isMuted ? 'ri-volume-mute-fill text-xs' : volume > 0.5 ? 'ri-volume-up-fill text-xs' : 'ri-volume-down-fill text-xs'} />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={hasMusic ? handleVolumeChange : undefined}
                disabled={!hasMusic}
                className={`w-16 h-1 rounded-lg appearance-none accent-theme ${
                  hasMusic ? "cursor-pointer bg-neutral-200 dark:bg-neutral-700" : "cursor-not-allowed bg-neutral-200 dark:bg-neutral-700 opacity-60"
                }`}
              />
            </div>

            {/* 主题切换按钮 */}
            <div className="inline-flex rounded-full border border-zinc-200 p-[2px] dark:border-zinc-700 bg-white/80 dark:bg-neutral-900/80 shadow-sm">
              <button 
                onClick={() => setMode('light')}
                aria-label="Toggle light mode"
                className={`rounded-inherit inline-flex h-[24px] w-[24px] items-center justify-center border-0 transition-colors ${
                  modeState === 'light' ? "bg-theme text-white rounded-full" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <i className="ri-sun-line text-xs" />
              </button>
              <button 
                onClick={() => setMode('system')}
                aria-label="Toggle system mode"
                className={`rounded-inherit inline-flex h-[24px] w-[24px] items-center justify-center border-0 transition-colors ${
                  modeState === 'system' ? "bg-theme text-white rounded-full" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <i className="ri-computer-line text-xs" />
              </button>
              <button 
                onClick={() => setMode('dark')}
                aria-label="Toggle dark mode"
                className={`rounded-inherit inline-flex h-[24px] w-[24px] items-center justify-center border-0 transition-colors ${
                  modeState === 'dark' ? "bg-theme text-white rounded-full" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <i className="ri-moon-line text-xs" />
              </button>
            </div>
          </div>

          {/* 第二行：进度条（在小屏幕上独占一行） */}
          <div className="w-full">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={hasMusic ? handleSeek : undefined}
              disabled={!hasMusic}
              className={`w-full h-1.5 rounded-lg appearance-none accent-theme ${
                hasMusic ? "cursor-pointer bg-neutral-200 dark:bg-neutral-700" : "cursor-not-allowed bg-neutral-200 dark:bg-neutral-700 opacity-60"
              }`}
              style={{
                background: duration
                  ? `linear-gradient(to right, #fc466b 0%, #fc466b ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                  : undefined
              }}
            />
            <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-4">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 歌曲信息 */}
          <div className="mb-3 text-center">
            <p className="text-sm font-medium text-black dark:text-white truncate">
              {displayTitle}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {displayArtist}
            </p>
          </div>

          {/* 进度条 */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-theme"
              style={{
                background: `linear-gradient(to right, #fc466b 0%, #fc466b ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-4">
            {/* 上一曲按钮 */}
            <button
              onClick={playPrevious}
              disabled={songs.length <= 1}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${
                songs.length > 1
                  ? "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  : "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
              }`}
              aria-label="上一曲"
            >
              <i className="ri-skip-back-fill" />
            </button>

            {/* 播放/暂停按钮 */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-theme text-white flex items-center justify-center hover:bg-theme-hover transition-colors"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              <i className={isPlaying ? 'ri-pause-fill' : 'ri-play-fill'}></i>
            </button>

            {/* 下一曲按钮 */}
            <button
              onClick={playNext}
              disabled={songs.length <= 1}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${
                songs.length > 1
                  ? "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  : "text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
              }`}
              aria-label="下一曲"
            >
              <i className="ri-skip-forward-fill" />
            </button>

            {/* 音量控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                <i className={isMuted ? 'ri-volume-mute-fill' : volume > 0.5 ? 'ri-volume-up-fill' : 'ri-volume-down-fill'}></i>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-theme"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
