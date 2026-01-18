import {Link} from "wouter";
import {useTranslation} from "react-i18next";
import {timeago} from "../utils/timeago";
import {HashTag} from "./hashtag";
import {useMemo} from "react";

export function FeedCard({ id, title, avatar, draft, listed, top, summary, hashtags, createdAt, updatedAt }:
    {
        id: string, avatar?: string,
        draft?: number, listed?: number, top?: number,
        title: string, summary: string,
        hashtags: { id: number, name: string }[],
        createdAt: Date, updatedAt: Date
    }) {
    const { t } = useTranslation()
    return useMemo(() => (
        <>
            <Link href={`/feed/${id}`} target="_blank" className="w-full rounded-2xl bg-white dark:bg-neutral-900 my-2 p-6 shadow-lg shadow-zinc-100 dark:shadow-zinc-800/20 hover:shadow-xl hover:shadow-zinc-200 dark:hover:shadow-zinc-700/30 transition-all duration-300 border border-zinc-100 dark:border-zinc-800">
                {avatar &&
                    <div className="mb-4 rounded-xl overflow-hidden">
                        <img src={avatar} alt=""
                            className="object-cover object-center w-full max-h-80 sm:max-h-96 hover:scale-[1.02] transition-transform duration-500" />
                    </div>}
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-pretty overflow-hidden mb-3">
                    {title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-gray-500 dark:text-gray-400 text-sm" title={new Date(createdAt).toLocaleString()}>
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
                <p className="text-gray-700 dark:text-gray-300 text-pretty overflow-hidden mb-4 line-clamp-3">
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