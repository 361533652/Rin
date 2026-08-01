import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from 'react-helmet'
import { Link, useSearch } from "wouter"
import { FeedCard } from "../components/feed_card"
import { HomeBanner } from "../components/home_banner"
import { Waiting } from "../components/loading"
import { client } from "../main"
import { ProfileContext } from "../state/profile"
import { headersWithAuth } from "../utils/auth"
import { siteName } from "../utils/constants"
import { tryInt } from "../utils/int"
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

interface HomeStats {
    totalArticles: number
    totalTags: number
}

export function FeedsPage() {
    const { t } = useTranslation()
    const search = useSearch();
    const query = useMemo(() => new URLSearchParams(search), [search]);
    const profile = useContext(ProfileContext);
    const [listState, _setListState] = useState<FeedType>(query.get("type") as FeedType || 'normal')
    const [sortBy, setSortBy] = useState<SortBy>('updatedAt')
    const [status, setStatus] = useState<'loading' | 'idle'>('idle')
    const [homeStats, setHomeStats] = useState<HomeStats | null>(null)
    const [feeds, setFeeds] = useState<FeedsMap>({
        draft: { size: 0, data: [], hasNext: false },
        unlisted: { size: 0, data: [], hasNext: false },
        normal: { size: 0, data: [], hasNext: false }
    })
    const page = tryInt(1, query.get("page"))
    const limit = tryInt(10, query.get("limit"), process.env.PAGE_SIZE)
    const ref = useRef("")
    const tagRef = useRef(false)

    useEffect(() => {
        if (tagRef.current) return
        client.tag.index.get().then(({ data }) => {
            if (data && typeof data !== 'string') {
                const totalTags = data.length
                setHomeStats(prev => ({
                    totalArticles: prev?.totalArticles || 0,
                    totalTags
                }))
            }
        })
        tagRef.current = true
    }, [])

    useEffect(() => {
        const key = `${query.get("page")} ${query.get("type")}`
        if (ref.current == key) return
        const type = query.get("type") as FeedType || 'normal'

        const fetchFeeds = () => {
            client.feed.index.get({
                query: {
                    page: page,
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
                    setStatus('idle')
                    if (type === 'normal' && listState === 'normal') {
                        const articles = data.data || []
                        setHomeStats(prev => ({
                            totalArticles: data.size,
                            totalTags: prev?.totalTags || 0
                        }))
                    }
                }
            })
        }

        if (type !== listState) {
            _setListState(type)
        }
        setStatus('loading')
        fetchFeeds()
        ref.current = key
    }, [page, limit, listState, search, query])
    const sortedFeeds = useMemo(() => {
        const arr = [...feeds[listState].data];
        arr.sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime());
        return arr;
    }, [feeds, listState, sortBy]);
    const showBanner = listState === 'normal' && (feeds.normal.size > 0 || homeStats)
    return (
        <>
            <Helmet>
                <title>{`${t('article.title')} - ${process.env.NAME}`}</title>
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={t('article.title')} />
                <meta property="og:image" content={process.env.AVATAR} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={document.URL} />
            </Helmet>
            <Waiting for={feeds.draft.size + feeds.normal.size + feeds.unlisted.size > 0 || status === 'idle'}>
                <main className="w-full flex flex-col mb-12">
                    {showBanner && <HomeBanner stats={homeStats!} />}
                    <div className="text-start c-text-main py-6">
                        <h1 className="text-3xl sm:text-4xl font-bold">
                            {listState === 'draft' ? t('draft_bin') : listState === 'normal' ? t('article.title') : t('unlisted')}
                        </h1>
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
                        <div className="flex flex-col space-y-6 ani-show">
                            {sortedFeeds.map((feed) => (
                                <FeedCard key={feed.id} {...feed} />
                            ))}
                        </div>
                        <div className="flex flex-row justify-between items-center mt-8 ani-show">
                            {page > 1 &&
                                <Link href={`/?type=${listState}&page=${(page - 1)}`}
                                    className={`text-sm font-normal rounded-full px-4 py-2 text-white bg-theme hover:bg-theme/90 transition-colors`}>
                                    {t('previous')}
                                </Link>
                            }
                            {page <= 1 && <div className="w-24"></div>}
                            {feeds[listState]?.hasNext &&
                                <Link href={`/?type=${listState}&page=${(page + 1)}`}
                                    className={`text-sm font-normal rounded-full px-4 py-2 text-white bg-theme hover:bg-theme/90 transition-colors`}>
                                    {t('next')}
                                </Link>
                            }
                        </div>
                    </Waiting>
                </main>
            </Waiting>
        </>
    )
}