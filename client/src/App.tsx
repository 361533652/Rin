import { useEffect, useRef, useState, useContext } from 'react'
import { Helmet } from 'react-helmet'
import { getCookie } from 'typescript-cookie'
import { DefaultParams, PathPattern, Route, Switch } from 'wouter'
import Footer from './components/footer'
import { Header } from './components/header'
import { Padding } from './components/padding'
import { MusicPlayer } from './components/music_player'
import { defaultSongs } from './types/music'
import useTableOfContents from './hooks/useTableOfContents.tsx'
import { client } from './main'
import { CallbackPage } from './page/callback'
import { FeedPage, TOCHeader } from './page/feed'
import { FeedsPage } from './page/feeds'
import { FriendsPage } from './page/friends'
import { HashtagPage } from './page/hashtag.tsx'
import { HashtagsPage } from './page/hashtags.tsx'
import { Settings } from "./page/settings.tsx"
import { TimelinePage } from './page/timeline'
import { WritingPage } from './page/writing'
import { ClientConfigContext, ConfigWrapper, defaultClientConfig } from './state/config.tsx'
import { Profile, ProfileContext } from './state/profile'
import { headersWithAuth } from './utils/auth'
import { tryInt } from './utils/int'
import { SearchPage } from './page/search.tsx'
import { Tips, TipsPage } from './components/tips.tsx'
import { useTranslation } from 'react-i18next'
import { MomentsPage } from './page/moments'
import { ErrorPage } from './page/error.tsx'
import { smoothScrollTo } from './utils/scroll';
import { ToolsPage } from './page/tools'
import { ImageBedPage } from './page/image-bed'

function App() {
  const ref = useRef(false)
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | undefined>()
  const [config, setConfig] = useState<ConfigWrapper>(new ConfigWrapper({}, new Map()))
  const [musicEnabled, setMusicEnabled] = useState(() => {
    // 从 localStorage 获取用户偏好设置
    const saved = localStorage.getItem('music_enabled');
    return saved ? JSON.parse(saved) : false; // 默认关闭
  });
  const [showPlayer, setShowPlayer] = useState(true)
  const lastScrollY = useRef(0)
  
  // 保存音乐启用状态到 localStorage
  useEffect(() => {
    localStorage.setItem('music_enabled', JSON.stringify(musicEnabled));
  }, [musicEnabled]);
  
  useEffect(() => {
    if (!musicEnabled) return; // 如果音乐未启用，不添加滚动监听器
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // 计算是否接近页面底部（例如距离底部200px以内，给播放器高度留出空间）
      const isNearBottom = (documentHeight - currentScrollY - windowHeight) < 200
      
      // 当接近页面底部时隐藏播放器，避免遮挡底部内容；其他时候显示播放器
      if (isNearBottom) {
        setShowPlayer(false)
      } else {
        setShowPlayer(true)
      }
      
      lastScrollY.current = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [musicEnabled])
  useEffect(() => {
    // --- 自动缩放逻辑开始 ---
    const HIGH_RES_THRESHOLD = 2560; // 定义高分屏阈值
    const applyScaling = () => {
      if (window.screen.width >= HIGH_RES_THRESHOLD) {
        document.documentElement.style.fontSize = '125%'; // 应用 125% 缩放
      } else {
        document.documentElement.style.fontSize = '100%'; // 恢复默认
      }
    };
    applyScaling();
    // --- 自动缩放逻辑结束 ---
    if (ref.current) return;
    if (getCookie('token')?.length ?? 0 > 0) {
      client.user.profile.get({
        headers: headersWithAuth()
      }).then(({ data }) => {
        if (data && typeof data !== 'string') {
          setProfile({
            id: data.id,
            avatar: data.avatar || '',
            permission: data.permission,
            name: data.username
          })
        }
      })
    }
    const config = sessionStorage.getItem('config')
    if (config) {
      const configObj = JSON.parse(config)
      const configWrapper = new ConfigWrapper(configObj, defaultClientConfig)
      setConfig(configWrapper)
    } else {
      client.config({ type: "client" }).get().then(({ data }) => {
        if (data && typeof data !== 'string') {
          sessionStorage.setItem('config', JSON.stringify(data))
          const config = new ConfigWrapper(data, defaultClientConfig)
          setConfig(config)
        }
      })
    }
    ref.current = true
  }, [t])
  const favicon = `${process.env.API_URL}/favicon`;
  return (
    <>
      <ClientConfigContext.Provider value={config}>
        <ProfileContext.Provider value={profile}>
          <Helmet>
            {favicon &&
              <link rel="icon" href={favicon} />}
          </Helmet>
          <Switch>
            <RouteMe path="/">
              <FeedsPage />
            </RouteMe>

            <RouteMe path="/timeline">
              <TimelinePage />
            </RouteMe>
            
            <RouteMe path="/moments">
              <MomentsPage />
            </RouteMe>

            <RouteMe path="/friends">
              <FriendsPage />
            </RouteMe>

            <RouteMe path="/hashtags">
              <HashtagsPage />
            </RouteMe>

            <RouteMe path="/hashtag/:name">
              {params => {
                return (<HashtagPage name={params.name || ""} />)
              }}
            </RouteMe>

            <RouteMe path="/search/:keyword">
              {params => {
                return (<SearchPage keyword={params.keyword || ""} />)
              }}
            </RouteMe>

            <RouteMe path="/settings" paddingClassName='mx-4' requirePermission>
              <Settings />
            </RouteMe>


            <RouteMe path="/writing" paddingClassName='mx-4' requirePermission>
              <WritingPage />
            </RouteMe>

            <RouteMe path="/writing/:id" paddingClassName='mx-4' requirePermission>
              {({ id }) => {
                const id_num = tryInt(0, id)
                return (
                  <WritingPage id={id_num} />
                )
              }}
            </RouteMe>

            <RouteMe path="/callback" >
              <CallbackPage />
            </RouteMe>

            <RouteMe path="/tools">
              <ToolsPage />
            </RouteMe>

            <RouteMe path="/img-bed">
              <ImageBedPage />
            </RouteMe>

            <RouteWithIndex path="/feed/:id">
              {(params, _, clean) => {
                return (<FeedPage id={params.id || ""} clean={clean} />)
              }}
            </RouteWithIndex>

            <RouteWithIndex path="/:alias">
              {(params, _, clean) => {
                return (
                  <FeedPage id={params.alias || ""} clean={clean} />
                )
              }}
            </RouteWithIndex>

            <RouteMe path="/user/github">
              {() => (
                <TipsPage>
                  <Tips value={t('error.api_url')} type='error' />
                </TipsPage>
              )}
            </RouteMe>

            <RouteMe path="/*/user/github">
              {() => (
                <TipsPage>
                  <Tips value={t('error.api_url_slash')} type='error' />
                </TipsPage>
              )}
            </RouteMe>

            <RouteMe path="/user/github/callback">
              {() => (
                <TipsPage>
                  <Tips value={t('error.github_callback')} type='error' />
                </TipsPage>
              )}
            </RouteMe>

            {/* Default route in a switch */}
            <RouteMe path="*">
              <ErrorPage error={t('error.not_found')} />
            </RouteMe>
          </Switch>
        </ProfileContext.Provider>
      </ClientConfigContext.Provider>
      {/* 音乐播放器 - 独立固定在底部，不受路由切换影响 */}
      {musicEnabled && (
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-transparent z-50 px-4 py-3 transition-transform duration-300 ease-in-out ${
            showPlayer ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 min-w-0 w-full">
                <MusicPlayer 
                  songs={defaultSongs}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 音乐播放器开关按钮 */}
      <div className="fixed bottom-40 right-4 z-50">
        <button
          id="music-btn"
          onClick={() => setMusicEnabled(!musicEnabled)}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            musicEnabled
              ? 'c-primary-bg text-white c-shadow-sakura'
              : 'c-primary-glass c-text-muted border c-border-primary backdrop-blur-md hover:c-primary hover:c-border-primary'
          }`}
          aria-label={musicEnabled ? '关闭音乐播放器' : '开启音乐播放器'}
        >
          <i className={`ri-${musicEnabled ? 'volume-up' : 'volume-mute'}-fill`} />
        </button>
      </div>
      {/* 回到顶部按钮 */}
      <div className="fixed bottom-24 right-4 z-50">
        <button
          id="top-btn"
          onClick={() => smoothScrollTo(0)}
          className="w-11 h-11 rounded-full c-primary-glass c-primary flex items-center justify-center border c-border-primary backdrop-blur-md transition-all duration-200 hover:c-primary-bg-hover hover:text-white c-shadow-sakura active:scale-95 touch-manipulation"
          aria-label="回到顶部"
        >
          <span className="text-xs font-bold">TOP</span>
        </button>
      </div>
    </>
  )
}

function RouteMe({ path, children, headerComponent, paddingClassName, requirePermission }:
  { path?: PathPattern, children: React.ReactNode | ((params: DefaultParams) => React.ReactNode), headerComponent?: React.ReactNode, paddingClassName?: string, requirePermission?: boolean }) {
  const profile = useContext(ProfileContext);
  const { t } = useTranslation();
  
  let renderedChildren = children;
  if (requirePermission && !profile?.permission) {
    renderedChildren = <ErrorPage error={t('error.permission_denied')} />;
  }
  
  return (
    <Route path={path} >
      {params => {
        return (<>
          <Header>
            {headerComponent}
          </Header>
          <Padding className={paddingClassName}>
            {typeof renderedChildren === 'function' ? renderedChildren(params) : renderedChildren}
          </Padding>
          <Footer />
        </>)
      }}
    </Route>
  )
}


function RouteWithIndex({ path, children }:
  { path: PathPattern, children: (params: DefaultParams, TOC: () => JSX.Element, clean: (id: string) => void) => React.ReactNode }) {
  const { TOC, cleanup } = useTableOfContents(".toc-content");
  const [expanded, setExpanded] = useState(true);

  return (
    <Route path={path}>
      {params => (
        <>
          <Header>
            {TOCHeader({ TOC })}
          </Header>
          <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 2xl:mx-24 duration-300">
            <div className="max-w-4xl mx-auto w-full">
              {children(params, TOC, cleanup)}
              <Footer />
            </div>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="hidden lg:flex fixed right-0 top-20 z-50 w-7 h-14 rounded-l-lg bg-white/20 dark:bg-neutral-900/20 backdrop-blur-xl items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 shadow-sm border border-gray-200/20 dark:border-gray-700/20 transition-colors"
            title={expanded ? "收起大纲" : "展开大纲"}
          >
            <i className={`ri-arrow-${expanded ? 'right' : 'left'}-s-line`} />
          </button>
          <aside className={`hidden lg:block fixed right-0 top-20 h-[calc(100vh-5rem)] z-40 w-56 pt-4 pb-8 pl-4 pr-2 overflow-y-auto bg-transparent backdrop-blur-xl shadow-lg transition-transform duration-300 [&_.bg-w]:!bg-transparent ${expanded ? 'translate-x-0' : 'translate-x-full'}`}>
            <TOC />
          </aside>
        </>
      )}
    </Route>
  );
}

export default App
