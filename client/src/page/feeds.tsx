import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from 'react-helmet'
import { Link, useSearch } from "wouter"
import { EmptyState } from "../components/empty_state"
import { HashTag } from "../components/hashtag"
import { FeedCard } from "../components/feed_card"
import { Waiting } from "../components/loading"
import { client } from "../main"
import { ProfileContext } from "../state/profile"
import { headersWithAuth } from "../utils/auth"
import { siteName } from "../utils/constants"
import { tryInt } from "../utils/int"
import { timeago } from "../utils/timeago"
import { useTranslation } from "react-i18next";

interface FeedItem {
    id: string;
    title: string;
    summary: string;
    avatar?: string;
    cover?: string;
    draft?: number;
    listed?: number;
    top?: number;
    hashtags: { id: number; name: string }[];
    createdAt: Date;
    updatedAt: Date;
}

type FeedsData = {
    size: number,
    data: FeedItem[],
    hasNext: boolean
}

type FeedType = 'draft' | 'unlisted' | 'normal'
type SortBy = 'updatedAt' | 'createdAt'

type FeedsMap = {
    [key in FeedType]: FeedsData
}

export function FeedsPage() {
    const { t } = useTranslation()
    const search = useSearch();
    const query = useMemo(() => new URLSearchParams(search), [search]);
    const profile = useContext(ProfileContext);
    const [listState, _setListState] = useState<FeedType>(query.get("type") as FeedType || 'normal')
    const [sortBy, setSortBy] = useState<SortBy>('updatedAt')
    const [status, setStatus] = useState<'loading' | 'idle'>('idle')
    const [feeds, setFeeds] = useState<FeedsMap>({
        draft: { size: 0, data: [], hasNext: false },
        unlisted: { size: 0, data: [], hasNext: false },
        normal: { size: 0, data: [], hasNext: false }
    })
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasNext, setHasNext] = useState(false)
    const [page, setPage] = useState(1)
    const limit = tryInt(10, query.get("limit"), process.env.PAGE_SIZE)
    const ref = useRef("")
    const sentinelRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const type = query.get("type") as FeedType || 'normal'
        if (type !== listState) {
            _setListState(type)
        }
        const key = `${type} ${sortBy}`
        if (ref.current === key) return
        setStatus('loading')
        setLoadingMore(false)
        setPage(1)
        client.feed.index.get({
            query: {
                page: 1,
                limit: limit,
                type: type
            },
            headers: headersWithAuth()
        }).then(({ data }) => {
            if (data && typeof data !== 'string') {
                setFeeds(prevFeeds => ({
                    ...prevFeeds,
                    [type]: data
                }))
                setHasNext(data.hasNext)
            }
            setStatus('idle')
        })
        ref.current = key
    }, [listState, sortBy, limit, query])
    const loadMore = useCallback(() => {
        if (loadingMore || !hasNext) return
        setLoadingMore(true)
        client.feed.index.get({
            query: {
                page: page + 1,
                limit: limit,
                type: listState
            },
            headers: headersWithAuth()
        }).then(({ data }) => {
            if (data && typeof data !== 'string') {
                setFeeds(prevFeeds => ({
                    ...prevFeeds,
                    [listState]: {
                        ...data,
                        data: [...prevFeeds[listState].data, ...data.data]
                    }
                }))
                setHasNext(data.hasNext)
                setPage(p => p + 1)
            }
        }).finally(() => setLoadingMore(false))
    }, [loadingMore, hasNext, page, listState, limit])
    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) loadMore()
        }, { rootMargin: '300px' })
        observer.observe(el)
        return () => observer.disconnect()
    }, [loadMore])
    const sortedFeeds = useMemo(() => {
        const arr = [...feeds[listState].data];
        arr.sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime());
        return arr;
    }, [feeds, listState, sortBy]);
    return (
        <>
            <Helmet>
                <title>{`${t('article.title')} - ${process.env.NAME}`}</title>
                <meta name="description" content={siteName} />
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={t('article.title')} />
                <meta property="og:image" content={process.env.AVATAR} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={document.URL} />
                {/* WebSite 结构化数据：声明站点身份与名称 */}
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": siteName,
                    "url": document.location.origin,
                })}</script>
            </Helmet>
            <Waiting for={feeds.draft.size + feeds.normal.size + feeds.unlisted.size > 0 || status === 'idle'}>
                <main className="w-full flex flex-col mb-12">
                    <div className="text-start c-text-main py-6 border-b border-[var(--border)] mb-6">
                        <div className="flex flex-row items-center gap-3">
                            <span className="w-1.5 h-8 rounded-full bg-theme" />
                            <h1 className="text-3xl sm:text-4xl font-bold">
                                {listState === 'draft' ? t('draft_bin') : listState === 'normal' ? t('article.title') : t('unlisted')}
                            </h1>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
                            <p className="text-sm c-text-muted font-normal">
                                {t('article.total$count', { count: feeds[listState]?.size })}
                            </p>
                            <button
                                onClick={() => setSortBy(v => v === 'updatedAt' ? 'createdAt' : 'updatedAt')}
                                className="text-sm c-text-muted hover:text-theme transition-colors flex items-center gap-1"
                            >
                                {sortBy === 'updatedAt' ? t('sort.updated') : t('sort.created')}
                                <i className="ri-arrow-up-down-line" />
                            </button>
                            {profile?.permission &&
                                <div className="flex flex-row space-x-4">
                                    <Link href={listState === 'draft' ? '/?type=normal' : '/?type=draft'} className={`text-sm c-text-muted font-normal hover:text-theme transition-colors ${listState === 'draft' ? "text-theme" : ""}`}>
                                        {t('draft_bin')}
                                    </Link>
                                    <Link href={listState === 'unlisted' ? '/?type=normal' : '/?type=unlisted'} className={`text-sm c-text-muted font-normal hover:text-theme transition-colors ${listState === 'unlisted' ? "text-theme" : ""}`}>
                                        {t('unlisted')}
                                    </Link>
                                </div>
                            }
                        </div>
                    </div>
                    <Waiting for={status === 'idle'}>
                        {sortedFeeds.length > 0 ? (<>
                            {listState === 'normal' && <FeaturedCard feed={sortedFeeds[0]} />}
                            <div className="flex flex-col space-y-6 ani-show">
                                {sortedFeeds.slice(listState === 'normal' ? 1 : 0).map((feed) => (
                                    <FeedCard key={feed.id} {...feed} />
                                ))}
                            </div>
                            <div ref={sentinelRef} className="flex flex-row justify-center items-center py-10 text-sm c-text-muted">
                                {loadingMore ? (
                                    <span className="flex items-center gap-2">
                                        <i className="ri-loader-4-line animate-spin" />
                                        {t('loading')}
                                    </span>
                                ) : hasNext ? (
                                    <span className="flex items-center gap-1">
                                        <i className="ri-arrow-down-line" />
                                        {t('load_more')}
                                    </span>
                                ) : (
                                    t('no_more')
                                )}
                            </div>
                        </>) : (
                            <EmptyState icon="ri-quill-pen-line" title={t('empty.articles')} hint={t('empty.articles_hint')} />
                        )}
                    </Waiting>
                </main>
            </Waiting>
        </>
    )
}

function FeaturedCard({ feed }: { feed: FeedItem }) {
    const { t } = useTranslation()
    const coverImage = feed.cover || feed.avatar
    return (
        <Link href={`/feed/${feed.id}`} target="_blank"
            className="group block w-full rounded-2xl c-bg-card dark:bg-neutral-900 my-4 overflow-hidden c-shadow hover:c-shadow-hover border border-transparent hover:border-[#D8A0AD] transition-all duration-300">
            {coverImage &&
                <div className="relative aspect-[21/9] overflow-hidden bg-[var(--primary-light)]/30">
                    <img src={coverImage} alt={feed.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                </div>
            }
            <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                    {feed.top === 1 &&
                        <span className="text-theme text-xs px-2 py-1 bg-theme/10 rounded-full">
                            {t('article.top.title')}
                        </span>
                    }
                    <span className="text-[#AAA39A] dark:text-gray-400 text-sm flex items-center">
                        <i className="ri-time-line mr-1" />
                        {feed.createdAt === feed.updatedAt ? timeago(feed.createdAt) : t('feed_card.published$time', { time: timeago(feed.createdAt) })}
                    </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold c-text-main dark:text-white text-pretty mb-3">
                    {feed.title}
                </h2>
                <p className="text-[#6E6862] dark:text-gray-300 text-pretty mb-4 line-clamp-3">
                    {feed.summary}
                </p>
                <div className="flex flex-row flex-wrap justify-start gap-2 mb-5">
                    {feed.hashtags.map(({ name }, index) => (
                        <HashTag key={index} name={name} />
                    ))}
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-theme">
                    {t('article.read_more')}
                    <i className="ri-arrow-right-line" />
                </span>
            </div>
        </Link>
    )
}
