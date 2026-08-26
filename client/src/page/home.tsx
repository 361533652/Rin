import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { client } from "../main";
import { siteName } from "../utils/constants";

const CATALOG_LIMIT = 5;

interface CatalogFeed {
    id: number;
    title: string | null;
    createdAt: Date | string;
}

function formatShortDate(d: Date | string): string {
    const date = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export function HomePage() {
    const { t } = useTranslation();
    // 阅读目录：最新文章列表 + 分页
    const [page, setPage] = useState(1);
    const [catalog, setCatalog] = useState<{ id: string; title: string; createdAt: Date | string }[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [catalogLoading, setCatalogLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        setCatalogLoading(true);
        client.feed.index.get({
            query: { page, limit: CATALOG_LIMIT, type: "normal" },
        }).then(({ data }) => {
            if (cancelled || !data || typeof data === "string") return;
            setCatalog(data.data.map((f: CatalogFeed) => ({
                id: String(f.id),
                title: f.title ?? "Untitled",
                createdAt: f.createdAt,
            })));
            setTotalPages(Math.max(1, Math.ceil(data.size / CATALOG_LIMIT)));
        }).finally(() => {
            if (!cancelled) setCatalogLoading(false);
        });
        return () => { cancelled = true; };
    }, [page]);

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

                    <section className="flex flex-col py-10 lg:py-14 lg:pl-14">
                        <div className="flex items-center justify-between border-b border-paper-border pb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            <span>{t('home.index')}</span>
                            <span className="font-mono">{String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}</span>
                        </div>

                        {/* 阅读目录：最新文章列表 + 分页 */}
                        <div className="py-8">
                            {catalogLoading && catalog.length === 0 ? (
                                <p className="py-6 font-mono text-xs text-[var(--text-faint)]">{t('loading')}</p>
                            ) : catalog.length === 0 ? (
                                <p className="py-6 font-mono text-xs text-[var(--text-faint)]">{t('empty.articles')}</p>
                            ) : (
                                <ol>
                                    {catalog.map((feed, index) => (
                                        <li key={feed.id}>
                                            <Link href={`/feed/${feed.id}`}
                                                className="group flex items-baseline gap-4 border-b border-paper-border py-4 transition-colors hover:border-[var(--primary)]">
                                                <span className="font-mono text-[10px] text-[var(--text-faint)]">{String((page - 1) * CATALOG_LIMIT + index + 1).padStart(2, "0")}</span>
                                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-main)] transition-colors group-hover:text-[var(--primary)]">{feed.title}</span>
                                                <time className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{formatShortDate(feed.createdAt)}</time>
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            {/* 分页控制：页号已在目录标题行右侧显示，这里只放翻页按钮 */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-6">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                        className="flex items-center gap-1 font-mono text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-30">
                                        <i className="ri-arrow-left-line" /> {t('previous')}
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                        className="flex items-center gap-1 font-mono text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-30">
                                        {t('next')} <i className="ri-arrow-right-line" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="py-10 sm:py-14">
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
