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
        <section className="relative rounded-2xl border c-border c-shadow overflow-hidden ani-show"
            style={{ background: 'var(--hero-gradient)' }}>
            {/* 右上角樱花枝装饰 */}
            <SakuraBranch className="absolute -top-3 -right-2 sm:top-0 sm:right-2 opacity-60 sm:opacity-80" />

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
            <div className="relative border-t c-border flex flex-wrap items-center gap-3 px-6 sm:px-8 py-4">
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

function SakuraBranch({ className }: { className?: string }) {
    return (
        <svg className={className} width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            {/* 花枝 */}
            <path d="M118 4 C 90 18, 80 40, 72 66" stroke="#D88A9A" strokeWidth="2" strokeLinecap="round" />
            <path d="M94 22 C 86 26, 80 34, 78 42" stroke="#D88A9A" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M82 46 C 72 50, 66 56, 64 62" stroke="#D88A9A" strokeWidth="1.5" strokeLinecap="round" />
            {/* 花朵 */}
            <g fill="#E8B7C2">
                <g transform="translate(72 66)">
                    <ellipse cx="0" cy="-7" rx="4.5" ry="7" />
                    <ellipse cx="6" cy="0" rx="7" ry="4.5" />
                    <ellipse cx="-6" cy="0" rx="7" ry="4.5" />
                    <ellipse cx="0" cy="7" rx="4.5" ry="7" />
                    <circle r="3" fill="#B45870" />
                </g>
                <g transform="translate(78 42)">
                    <ellipse cx="0" cy="-6" rx="3.8" ry="5.8" />
                    <ellipse cx="5" cy="0" rx="5.8" ry="3.8" />
                    <ellipse cx="-5" cy="0" rx="5.8" ry="3.8" />
                    <ellipse cx="0" cy="6" rx="3.8" ry="5.8" />
                    <circle r="2.5" fill="#B45870" />
                </g>
                <g transform="translate(94 22)">
                    <ellipse cx="0" cy="-5" rx="3.2" ry="4.8" />
                    <ellipse cx="4" cy="0" rx="4.8" ry="3.2" />
                    <ellipse cx="-4" cy="0" rx="4.8" ry="3.2" />
                    <ellipse cx="0" cy="5" rx="3.2" ry="4.8" />
                    <circle r="2" fill="#B45870" />
                </g>
            </g>
            {/* 花苞 */}
            <circle cx="64" cy="62" r="3.5" fill="#E8B7C2" />
        </svg>
    )
}
