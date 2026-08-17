import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { siteName } from "../utils/constants";

export function HomePage() {
    const { t } = useTranslation();

    return (
        <>
            <Helmet>
                <title>{siteName}</title>
                <meta name="description" content={siteName} />
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={siteName} />
                <meta property="og:image" content={process.env.AVATAR} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={document.URL} />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    name: siteName,
                    url: document.location.origin,
                })}</script>
            </Helmet>

            <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-stretch px-6 py-6 sm:px-10 sm:py-10 lg:px-16">
                <div className="grid w-full grid-cols-1 border-y border-paper-border lg:grid-cols-[minmax(0,0.92fr)_minmax(20rem,1.08fr)]">
                    <section className="flex min-h-[52vh] flex-col justify-between border-paper-border py-10 lg:min-h-0 lg:border-r lg:py-14 lg:pr-14">
                        <div>
                            <p className="mb-12 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
                                {t('home.kicker')}
                            </p>
                            {process.env.AVATAR && (
                                <img src={process.env.AVATAR} alt="" className="mb-9 h-16 w-16 border border-paper-border object-cover" />
                            )}
                            <h1 className="max-w-md font-serif text-5xl font-medium leading-[0.98] tracking-[-0.055em] text-[var(--text-main)] sm:text-7xl">
                                {process.env.NAME || siteName}
                            </h1>
                        </div>

                        <div className="max-w-sm pt-14 lg:pt-0">
                            {process.env.DESCRIPTION && (
                                <p className="text-base leading-8 text-[var(--text-body)] sm:text-lg">{process.env.DESCRIPTION}</p>
                            )}
                            <p className="mt-5 border-l-2 border-[var(--primary)] pl-4 text-sm leading-6 text-[var(--text-muted)]">
                                {t('home.direction')}
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col justify-between py-10 lg:py-14 lg:pl-14">
                        <div className="flex items-center justify-between border-b border-paper-border pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            <span>{t('home.index')}</span>
                            <span>01 / 01</span>
                        </div>

                        <div className="py-16 sm:py-24">
                            <p className="mb-5 font-mono text-xs text-[var(--primary-hover)]">/ blog</p>
                            <h2 className="max-w-lg font-serif text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-[var(--text-main)] sm:text-6xl">
                                {t('home.archive_title')}
                            </h2>
                            <p className="mt-7 max-w-md text-base leading-8 text-[var(--text-body)]">{t('home.archive_description')}</p>
                        </div>

                        <Link href="/blog" className="group flex items-center justify-between border-y border-paper-border py-5 text-sm font-medium text-[var(--text-main)] transition-colors hover:border-[var(--primary)]">
                            <span>{t('home.enter')}</span>
                            <span className="h-px w-9 bg-[var(--text-main)] transition-[width] duration-300 group-hover:w-14" aria-hidden="true" />
                        </Link>
                    </section>
                </div>

                <p className="absolute bottom-2 left-6 text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)] sm:left-10 lg:left-16">
                    <a className="transition-colors hover:text-[var(--text-main)]" href="https://github.com/openRin/Rin" target="_blank" rel="noreferrer">{t('home.credit')}</a>
                </p>
            </main>
        </>
    );
}
