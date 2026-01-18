import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactModal from "react-modal";
import Popup from "reactjs-popup";
import { removeCookie } from "typescript-cookie";
import { Link, useLocation } from "wouter";
import { useLoginModal } from "../hooks/useLoginModal";
import { Profile, ProfileContext } from "../state/profile";
import { Button } from "./button";
import { IconSmall } from "./icon";
import { Input } from "./input";
import { Padding } from "./padding";
import { ClientConfigContext } from "../state/config";
import { Weather } from "./weather";


export function Header({ children }: { children?: React.ReactNode }) {
    const profile = useContext(ProfileContext);
    const { t } = useTranslation()

    return useMemo(() => (
        <>
            <div className="fixed top-0 left-0 right-0 z-40 bg-transparent backdrop-blur-sm">
                <div className="w-screen">
                    <Padding className="mt-2 mb-2">
                        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
                            {/* Logo 部分 - 大屏幕显示完整信息，小屏幕只显示头像 */}
                            <Link aria-label={t('home')} href="/"
                                className="flex items-center">
                                <img src={process.env.AVATAR} alt="Avatar" className="w-10 h-10 rounded-2xl border-2" />
                                <div className="hidden sm:flex flex-col justify-center items-start mx-3">
                                    <p className="text-lg font-bold dark:text-white">
                                        {process.env.NAME}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {process.env.DESCRIPTION}
                                    </p>
                                </div>
                            </Link>
                            
                            {/* 导航菜单 - 大屏幕居中，小屏幕可折叠 */}
                            <div className="w-full sm:w-auto flex justify-center">
                                <div className="flex flex-row items-center bg-white dark:bg-neutral-900 rounded-full px-2 py-1 shadow-lg shadow-zinc-100 dark:shadow-zinc-800/20">
                                    <NavBar menu={false} />
                                    {children}
                                    <Menu />
                                </div>
                            </div>
                            
                            {/* 右侧功能按钮 - 大屏幕显示，小屏幕在菜单中 */}
                            <div className="hidden sm:flex flex-row items-center space-x-2">
                                <Weather />
                                <SearchButton />
                                <LanguageSwitch />
                                <UserAvatar profile={profile} />
                            </div>
                        </div>
                    </Padding>
                </div>
            </div>
            <div className="h-16 sm:h-20"></div>
        </>
    ), [profile, children, t])
}

function NavItem({ menu, title, selected, href, when = true, onClick }: {
    title: string,
    selected: boolean,
    href: string,
    menu?: boolean,
    when?: boolean,
    onClick?: () => void
}) {
    return (
        <>
            {when &&
                <Link href={href}
                    className={`${menu ? "" : "hidden"} md:block cursor-pointer hover:text-theme duration-300 px-2 py-4 md:p-4 text-sm ${selected ? "text-theme" : "dark:text-white"}`}
                    state={{ animate: true }}
                    onClick={onClick}
                >
                    {title}
                </Link>}
        </>
    )
}

function Menu() {
    const profile = useContext(ProfileContext);
    const [isOpen, setOpen] = useState(false)

    function onClose() {
        document.body.style.overflow = "auto"
        setOpen(false)
    }

    return (
        <div className="flex flex-row items-center sm:hidden">
            <Popup
                arrow={false}
                trigger={<div>
                    <button onClick={() => setOpen(true)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-neutral-800 hover:bg-zinc-100 dark:hover:bg-neutral-700 transition-colors">
                        <i className="ri-menu-line ri-lg" />
                    </button>
                </div>
                }
                position="bottom right"
                open={isOpen}
                nested
                onOpen={() => document.body.style.overflow = "hidden"}
                onClose={onClose}
                closeOnDocumentClick
                closeOnEscape
                overlayStyle={{ background: "rgba(0,0,0,0.5)" }}
            >
                <div className="flex flex-col bg-white dark:bg-neutral-900 rounded-xl p-4 mt-2 w-[80vw] max-w-sm shadow-2xl">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-row justify-between items-center">
                            <div className="flex items-center">
                                <img src={process.env.AVATAR} alt="Avatar" className="w-8 h-8 rounded-xl border" />
                                <div className="flex flex-col ml-3">
                                    <p className="text-sm font-bold dark:text-white">
                                        {process.env.NAME}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {process.env.DESCRIPTION}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-row justify-between items-center p-2 bg-zinc-100 dark:bg-neutral-800 rounded-lg">
                            <Weather />
                            <SearchButton onClose={onClose} />
                            <LanguageSwitch />
                            <UserAvatar profile={profile} />
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                            <NavBar menu={true} onClick={onClose} />
                        </div>
                    </div>
                </div>
            </Popup>
        </div>
    )
}

function NavBar({ menu, onClick }: { menu: boolean, onClick?: () => void }) {
    const profile = useContext(ProfileContext);
    const [location] = useLocation();
    const { t } = useTranslation()
    return (
        <>
            <NavItem menu={menu} onClick={onClick} title={t('article.title')}
                selected={location === "/" || location.startsWith('/feed')} href="/" />
            <NavItem menu={menu} onClick={onClick} title={t('timeline')} selected={location === "/timeline"} href="/timeline" />
            <NavItem menu={menu} onClick={onClick} title={t('moments.title')} selected={location === "/moments"} href="/moments" />
            <NavItem menu={menu} onClick={onClick} title={t('hashtags')} selected={location === "/hashtags"} href="/hashtags" />
            <NavItem menu={menu} onClick={onClick} when={profile?.permission == true} title={t('writing')}
                selected={location.startsWith("/writing")} href="/writing" />
            <NavItem menu={menu} onClick={onClick} title={t('friends.title')} selected={location === "/friends"} href="/friends" />
            <NavItem menu={menu} onClick={onClick} title={t('about.title')} selected={location === "/about"} href="/about" />
            <NavItem menu={menu} onClick={onClick} when={profile?.permission == true} title={t('settings.title')}
                selected={location === "/settings"}
                href="/settings" />
        </>
    )
}

function LanguageSwitch({ className }: { className?: string }) {
    const { i18n } = useTranslation()
    const label = 'Languages'
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'zh-CN', name: '简体中文' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'ja', name: '日本語' }
    ]
    return (
        <div className={className + " flex flex-row items-center"}>
            <Popup trigger={
                <button title={label} aria-label={label}
                    className="flex rounded-full border dark:border-neutral-600 px-2 bg-w aspect-[1] items-center justify-center t-primary bg-button">
                    <i className="ri-translate-2"></i>
                </button>
            }
                position="bottom right"
                arrow={false}
                closeOnDocumentClick
            >
                <div className="border-card">
                    <p className='font-bold t-primary'>
                        Languages
                    </p>
                    {languages.map(({ code, name }) => (
                        <button key={code} onClick={() => i18n.changeLanguage(code)}>
                            {name}
                        </button>
                    ))}
                </div>
            </Popup>
        </div>
    )
}

function SearchButton({ className, onClose }: { className?: string, onClose?: () => void }) {
    const { t } = useTranslation()
    const [isOpened, setIsOpened] = useState(false);
    const [, setLocation] = useLocation()
    const [value, setValue] = useState('')
    const label = t('article.search.title')
    const onSearch = () => {
        const key = `${encodeURIComponent(value)}`
        setTimeout(() => {
            setIsOpened(false)
            if (value.length !== 0)
                onClose?.()
        }, 100)
        if (value.length !== 0)
            setLocation(`/search/${key}`)
    }
    return (<div className={className + " flex flex-row items-center"}>
        <button onClick={() => setIsOpened(true)} title={label} aria-label={label}
            className="flex rounded-full border dark:border-neutral-600 px-2 bg-w aspect-[1] items-center justify-center t-primary bg-button">
            <i className="ri-search-line"></i>
        </button>
        <ReactModal
            isOpen={isOpened}
            style={{
                content: {
                    top: "20%",
                    left: "50%",
                    right: "auto",
                    bottom: "auto",
                    marginRight: "-50%",
                    transform: "translate(-50%, -50%)",
                    padding: "0",
                    border: "none",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "none",
                },
                overlay: {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 1000,
                },
            }}
            onRequestClose={() => setIsOpened(false)}
        >
            <div className="bg-w w-full flex flex-row items-center justify-between p-4 space-x-4">
                <Input value={value} setValue={setValue} placeholder={t('article.search.placeholder')}
                    autofocus
                    onSubmit={onSearch} />
                <Button title={value.length === 0 ? t("close") : label} onClick={onSearch} />
            </div>
        </ReactModal>
    </div>
    )
}


function UserAvatar({ className, profile, onClose }: { className?: string, profile?: Profile, onClose?: () => void }) {
    const { t } = useTranslation()
    const { LoginModal, setIsOpened } = useLoginModal(onClose)
    const label = t('github_login')
    const config = useContext(ClientConfigContext);


    return (
        <> {config.get<boolean>('login.enabled') && <div className={className + " flex flex-row items-center"}>
            {profile?.avatar ? <>
                <div className="w-8 relative">
                    <img src={profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full border" />
                    <div className="z-50 absolute left-0 top-0 w-10 h-8 opacity-0 hover:opacity-100 duration-300">
                        <IconSmall label={t('logout')} name="ri-logout-circle-line" onClick={() => {
                            removeCookie("token")
                            window.location.reload()
                        }} hover={false} />
                    </div>
                </div>
            </> : <>
                <button onClick={() => setIsOpened(true)} title={label} aria-label={label}
                    className="flex rounded-full border dark:border-neutral-600 px-2 bg-w aspect-[1] items-center justify-center t-primary bg-button">
                    <i className="ri-user-received-line"></i>
                </button>
            </>}
            <LoginModal />
        </div>
        }</>)
}