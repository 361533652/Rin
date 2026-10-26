import { useEffect, useRef, useState } from "react";
import { Helmet } from 'react-helmet';
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { EmptyState } from "../components/empty_state";
import { Waiting } from "../components/loading";
import { client } from "../main";
import { siteName } from "../utils/constants";

type Hashtag = {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    feeds: number;
}

export function HashtagsPage() {
    const { t } = useTranslation();
    const [hashtags, setHashtags] = useState<Hashtag[]>();
    const ref = useRef(false);
    useEffect(() => {
        if (ref.current) return;
        client.tag.index.get().then(({ data }) => {
            if (data && typeof data !== 'string') {
                setHashtags(data);
            }
        });
        ref.current = true;
    }, [])
    const visibleHashtags = (hashtags || []).filter(({ feeds }) => feeds > 0);
    const maxFeeds = Math.max(...visibleHashtags.map(({ feeds }) => feeds), 1);
    return (
        <>
            <Helmet>
                <title>{`${t('hashtags')} - ${process.env.NAME}`}</title>
                <meta name="description" content={`${t('hashtags')} - ${siteName}`} />
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={t('hashtags')} />
                <meta property="og:image" content={process.env.AVATAR} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={document.URL} />
            </Helmet>
            <Waiting for={hashtags}>
                <main className="w-full flex flex-col justify-center items-center mb-8 ani-show">
                    <div className="wauto text-start c-text-main py-4">
                        <h1 className="text-3xl sm:text-4xl font-bold">
                            {t('hashtags')}
                        </h1>
                    </div>

                    {visibleHashtags.length > 0 ? (
                        <div className="wauto flex flex-row flex-wrap justify-start items-center gap-3 py-4">
                            {visibleHashtags.map((hashtag, index) => {
                                const ratio = hashtag.feeds / maxFeeds;
                                // 权重只用字号表达，不再叠 opacity——两档叠加会让最少的标签既小又淡到读不清
                                const fontSize = 13 + Math.round(ratio * 7);
                                return (
                                    <Link key={index} href={`/hashtag/${hashtag.name}`}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-w px-4 py-2 border border-[var(--border)] duration-200 c-text-body hover:text-theme hover:border-[var(--primary)]"
                                        style={{ fontSize }}>
                                        <span className="italic c-text-muted">#</span>
                                        {hashtag.name}
                                        <span className="text-xs c-text-muted">{hashtag.feeds}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <EmptyState icon="ri-price-tag-3-line" title={t('empty.hashtags')} hint={t('empty.hashtags_hint')} />
                    )}
                </main>
            </Waiting>
        </>
    )
}