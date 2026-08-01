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
        <section className="rounded-2xl c-bg-card border c-border c-shadow overflow-hidden ani-show">
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 p-6 sm:p-8">
                <img
                    src={process.env.AVATAR}
                    alt={process.env.NAME}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full c-shadow-sakura"
                />
                <div className="text-center sm:text-left">
                    <p className="text-sm font-medium c-primary">
                        <i className={`${icon} mr-1.5 align-[-1px]`} />
                        {t(`home_hero.${key}`)}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold c-text-main mt-1.5">
                        {process.env.NAME}
                    </h1>
                    {process.env.DESCRIPTION &&
                        <p className="text-sm c-text-muted mt-1.5">
                            {process.env.DESCRIPTION}
                        </p>
                    }
                </div>
            </div>
            <div className="border-t c-border flex flex-wrap items-center gap-x-6 gap-y-2 px-6 sm:px-8 py-4">
                <HeroStat icon="ri-article-line" label={t('home_hero.articles$count', { count: totalArticles })} />
                <HeroStat icon="ri-hashtag" label={t('home_hero.tags$count', { count: totalTags })} />
            </div>
        </section>
    )
}

function HeroStat({ icon, label }: { icon: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm c-text-muted">
            <i className={`${icon} c-primary`} />
            {label}
        </span>
    )
}
