import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { siteName } from "../utils/constants";

/**
 * 落地页（Landing Page）：
 * 站点门户，展示站点名与简短介绍，点击「进入主站」进入 /blog。
 * 保留全局粒子背景（particles.js）与樱花/猫爪装饰（PaperDecoration）。
 */
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
                {/* WebSite 结构化数据：声明站点身份与名称 */}
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": siteName,
                    "url": document.location.origin,
                })}</script>
            </Helmet>
            <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
                {process.env.AVATAR && (
                    <img
                        src={process.env.AVATAR}
                        alt="avatar"
                        className="w-24 h-24 rounded-full shadow-lg mb-8"
                    />
                )}
                <h1 className="text-5xl sm:text-6xl font-bold t-primary mb-4">
                    {process.env.NAME}
                </h1>
                {process.env.DESCRIPTION && (
                    <p className="text-lg sm:text-xl t-secondary mb-12 max-w-xl">
                        {process.env.DESCRIPTION}
                    </p>
                )}
                <Link
                    href="/blog"
                    className="bg-theme text-white text-nowrap rounded-full px-8 py-3 text-lg shadow-md transition-all hover:bg-theme-hover hover:-translate-y-0.5 active:bg-theme-active flex items-center gap-2"
                >
                    {t('home.enter')}
                    <i className="ri-arrow-right-line" />
                </Link>
                <p className="absolute bottom-8 text-sm text-neutral-400">
                    Powered by{" "}
                    <a className="hover:underline" href="https://github.com/openRin/Rin" target="_blank" rel="noreferrer">
                        Rin
                    </a>
                </p>
            </div>
        </>
    );
}
