import { Helmet } from 'react-helmet';
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { siteName } from "../utils/constants";

export function ToolsPage() {
    const { t } = useTranslation();
    return (
        <>
            <Helmet>
                <title>{`${t('tools')} - ${process.env.NAME}`}</title>
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={t('tools')} />
                <meta property="og:image" content={process.env.AVATAR} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={document.URL} />
            </Helmet>
            <main className="w-full flex flex-col justify-center items-center mb-8 ani-show">
                <div className="wauto flex flex-col items-start py-4 w-full">
                    <div className="text-start c-text-main text-4xl font-bold">
                        <p>{t('tools')}</p>
                    </div>
                    <p className="text-sm t-secondary mt-2">{t('tools_desc')}</p>
                </div>

                <div className="wauto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                    <Link href="/img-bed" className="relative flex flex-col items-center justify-center rounded-2xl p-6 bg-w border-card hover:text-theme duration-300 cursor-pointer">
                        <i className="ri-image-2-line text-4xl mb-3" />
                        <p className="text-base font-bold t-primary">{t('image_host')}</p>
                        <p className="text-xs t-secondary mt-1 text-center">{t('image_host_desc')}</p>
                    </Link>
                </div>
            </main>
        </>
    )
}
