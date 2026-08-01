import { useTranslation } from "react-i18next";

function greeting() {
    const hour = new Date().getHours()
    if (hour < 6) return { key: 'night', icon: 'ri-moon-line' }
    if (hour < 12) return { key: 'morning', icon: 'ri-sun-line' }
    if (hour < 18) return { key: 'afternoon', icon: 'ri-sun-cloudy-line' }
    return { key: 'evening', icon: 'ri-moon-clear-line' }
}

export function HomeHero({ totalArticles, totalTags }: { totalArticles: number; totalTags: number }) {
    const { t } = useTranslation()
    const { key, icon } = greeting()

    return (
        <section className="relative rounded-2xl border c-border c-shadow-hover overflow-hidden ani-show">
            {/* 基底渐变 */}
            <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />

            {/* 主内容层 */}
            <div className="relative flex flex-col items-start px-6 py-8 sm:px-8 sm:py-10">
                <p className="text-sm font-medium c-primary">
                    <i className={`${icon} mr-1.5 align-[-1px]`} />
                    {t(`home_hero.${key}`)}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold c-text-main mt-2">
                    {process.env.NAME}
                </h1>
                {process.env.DESCRIPTION &&
                    <p className="text-sm c-text-muted mt-2 max-w-md">
                        {process.env.DESCRIPTION}
                    </p>
                }
            </div>

            {/* 统计毛玻璃层 */}
            <div className="relative border-t border-white/50 dark:border-white/10 bg-white/45 dark:bg-black/25 backdrop-blur-sm flex flex-wrap items-center gap-3 px-6 sm:px-8 py-4">
                <HeroStat icon="ri-article-line" label={t('home_hero.articles$count', { count: totalArticles })}
                    className="c-primary-bg-light c-primary-hover" />
                <HeroStat icon="ri-hashtag" label={t('home_hero.tags$count', { count: totalTags })}
                    className="c-bg-info c-accent-text" />
            </div>
        </section>
    )
}

function HeroStat({ icon, label, className }: { icon: string; label: string; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full ${className}`}>
            <i className={icon} />
            {label}
        </span>
    )
}
