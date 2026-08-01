import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface HomeStats {
    totalArticles: number
    totalTags: number
}

export function HomeBanner({ stats }: { stats: HomeStats }) {
    const { t } = useTranslation()

    return useMemo(() => (
        <div className="mb-8 ani-show">
            <div className="flex flex-wrap gap-2">
                <StatPill
                    icon="ri-article-line"
                    label={t('home.stats.total_articles', { count: stats.totalArticles })}
                />
                <StatPill
                    icon="ri-hashtag"
                    label={t('home.stats.total_tags', { count: stats.totalTags })}
                />
            </div>
        </div>
    ), [stats, t])
}

function StatPill({ icon, label }: { icon: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm c-text-muted px-3 py-1.5 rounded-full bg-w border c-border">
            <i className={icon} />
            {label}
        </span>
    )
}