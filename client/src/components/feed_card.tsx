import {Link} from "wouter";
import {useTranslation} from "react-i18next";
import {timeago} from "../utils/timeago";
import {HashTag} from "./hashtag";
import {useMemo} from "react";

export function FeedCard({ id, title, avatar, cover, draft, listed, top, summary, hashtags, createdAt, updatedAt }:
    {
        id: string, avatar?: string, cover?: string,
        draft?: number, listed?: number, top?: number,
        title: string, summary: string,
        hashtags: { id: number, name: string }[],
        createdAt: Date, updatedAt: Date
    }) {
    const { t } = useTranslation()
    const coverImage = cover || avatar
    return useMemo(() => (
        <>
            <Link href={`/feed/${id}`} target="_blank" className="w-full rounded-2xl c-bg-card dark:bg-neutral-900 my-4 p-6 c-shadow hover:c-shadow-hover hover:-translate-y-0.5 transition-all duration-200" style={{ '--bg-card-hover': '#FFFDF8', '--shadow-hover': '0 12px 40px rgba(80,60,40,0.10)' } as React.CSSProperties}>
                {coverImage &&
                    <div className="mb-4 rounded-xl overflow-hidden max-h-48">
                        <img src={coverImage} alt=""
                            className="object-cover object-center w-full h-48" />
                    </div>}
                <h1 className="text-xl font-bold c-text-main dark:text-white text-pretty overflow-hidden mb-3">
                    {title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-[#AAA39A] dark:text-gray-400 text-sm" title={new Date(createdAt).toLocaleString()}>
                        {createdAt === updatedAt ? timeago(createdAt) : t('feed_card.published$time', { time: timeago(createdAt) })}
                    </span>
                    {createdAt !== updatedAt &&
                        <span className="text-gray-500 dark:text-gray-400 text-sm" title={new Date(updatedAt).toLocaleString()}>
                            {t('feed_card.updated$time', { time: timeago(updatedAt) })}
                        </span>
                    }
                    <div className="flex flex-wrap gap-2">
                        {draft === 1 && <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1 bg-zinc-100 dark:bg-neutral-800 rounded-full">{t("draft")}</span>}
                        {listed === 0 && <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1 bg-zinc-100 dark:bg-neutral-800 rounded-full">{t("unlisted")}</span>}
                        {top === 1 && <span className="text-theme text-xs px-2 py-1 bg-theme/10 rounded-full">
                            {t('article.top.title')}
                        </span>}
                    </div>
                </div>
                <p className="text-[#6E6862] dark:text-gray-300 text-pretty overflow-hidden mb-4 line-clamp-3">
                    {summary}
                </p>
                {hashtags.length > 0 &&
                    <div className="mt-3 flex flex-row flex-wrap justify-start gap-2">
                        {hashtags.map(({ name }, index) => (
                            <HashTag key={index} name={name} />
                        ))}
                    </div>
                }

            </Link>
        </>
    ), [id, title, avatar, draft, listed, top, summary, hashtags, createdAt, updatedAt, t])
}