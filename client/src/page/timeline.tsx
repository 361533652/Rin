import {useEffect, useRef, useState} from "react"
import {Helmet} from 'react-helmet'
import {Link} from "wouter"
import {EmptyState} from "../components/empty_state"
import {Waiting} from "../components/loading"
import {client} from "../main"
import {headersWithAuth} from "../utils/auth"
import {siteName} from "../utils/constants"
import {useTranslation} from "react-i18next";

interface FeedItem {
    id: number;
    createdAt: Date;
    title: string | null;
}

export function TimelinePage() {
    const [feeds, setFeeds] = useState<Partial<Record<number, FeedItem[]>>>()
    const [length, setLength] = useState(0)
    const ref = useRef(false)
    const { t } = useTranslation()
    function fetchFeeds() {
        client.feed.timeline.get({
            headers: headersWithAuth()
        })
        .then(({ data }) => {
            if (data && typeof data !== 'string') {
                const arr = Array.isArray(data) ? data : []
                setLength(arr.length)
                // 兼容的分组逻辑
                const groups = (Object.groupBy
                    ? Object.groupBy(arr, ({ createdAt }) => new Date(createdAt).getFullYear())
                    : arr.reduce<Record<number, FeedItem[]>>((acc, item) => {
                        const key = new Date(item.createdAt).getFullYear()
                        ;(acc[key] ||= []).push(item)
                        return acc
                    }, {})
                )

                setFeeds(groups)
            }
        })
        .catch(err => {
            console.error("fetchFeeds error:", err)
        })
    }

    useEffect(() => {
        if (ref.current) return
        fetchFeeds()
        ref.current = true
    }, [])
    return (
        <>
            <Helmet>
                <title>{`${t('timeline')} - ${process.env.NAME}`}</title>
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={t('timeline')} />
                <meta property="og:image" content={process.env.AVATAR} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={document.URL} />
            </Helmet>
            <Waiting for={feeds}>
                <main className="w-full md:w-10/12 lg:w-8/12 xl:w-6/12 2xl:w-5/12 flex flex-col mb-12 min-h-[calc(100vh-12rem)] ani-show">
                    <div className="text-start c-text-main py-6">
                        <h1 className="text-3xl sm:text-4xl font-bold">
                            {t('timeline')}
                        </h1>
                        <div className="mt-4">
                            <p className="text-sm c-text-muted font-normal">
                                {t('article.total$count', { count: length })}
                            </p>
                        </div>
                    </div>
                    {feeds && Object.keys(feeds).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
                        <div key={year} className="flex flex-col mb-10">
                            <h2 className="flex flex-row items-center space-x-3 mb-6">
                                <span className="text-2xl font-bold t-primary">
                                    {t('year$year', { year: year })}
                                </span>
                                <span className="text-sm t-secondary bg-zinc-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                                    {t('article.total_short$count', { count: feeds[+year]?.length })}
                                </span>
                            </h2>
                            <div className="relative pl-6">
                                <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-[var(--border)]" aria-hidden="true" />
                                <div className="flex flex-col space-y-4">
                                    {feeds[+year]?.map(({ id, title, createdAt }) => (
                                        <FeedItem key={id} id={id.toString()} title={title || t('unlisted')}
                                                  createdAt={new Date(createdAt)}/>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {feeds && Object.keys(feeds).length === 0 && (
                        <EmptyState icon="ri-time-line" title={t('empty.timeline')} hint={t('empty.timeline_hint')} />
                    )}
                </main>
            </Waiting>
        </>
    )
}

export function FeedItem({ id, title, createdAt }: { id: string, title: string, createdAt: Date }) {
    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit' });
    return (
        <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-theme ring-4 ring-[var(--primary-light)]" aria-hidden="true" />
            <div className="flex-1 rounded-xl bg-w px-4 py-3 flex flex-row items-center gap-3 duration-200 hover:c-bg-card">
                <span className="t-secondary text-sm tabular-nums" title={new Date(createdAt).toLocaleString()}>
                    {formatter.format(new Date(createdAt))}
                </span>
                <Link href={`/feed/${id}`} target="_blank" className="text-base t-primary hover:text-theme text-pretty overflow-hidden">
                    {title}
                </Link>
            </div>
        </div>
    )
}