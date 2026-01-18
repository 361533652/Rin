import { useEffect, useRef, useState, useContext } from 'react'
import { Helmet } from 'react-helmet'
import { getCookie } from 'typescript-cookie'
import { DefaultParams, PathPattern, Route, Switch } from 'wouter'
import Footer from './components/footer'
import { Header } from './components/header'
import { Padding } from './components/padding'
import { MusicPlayer } from './components/music_player'
import { Particles } from './components/particles'
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

function App() {
  const ref = useRef(false)
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | undefined>()
  const [config, setConfig] = useState<ConfigWrapper>(new ConfigWrapper({}, new Map()))
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
          <Particles />
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
      <div className="fixed bottom-0 left-0 right-0 bg-transparent z-50 px-4 py-3">
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
  return (<RouteMe path={path} headerComponent={TOCHeader({ TOC: TOC })} paddingClassName='mx-4'>
    {params => {
      return children(params, TOC, cleanup)
    }}
  </RouteMe>)
}

export default App
