import { useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import { ClientConfigContext } from '../state/config';
import { Helmet } from "react-helmet";
import { siteName } from '../utils/constants';
import { useTranslation } from "react-i18next";
import { useLoginModal } from '../hooks/useLoginModal';

function Footer() {
    const { t } = useTranslation()
    const config = useContext(ClientConfigContext);
    const footerHtml = config.get<string>('footer');
    const loginEnabled = config.get<boolean>('login.enabled');
    const [doubleClickTimes, setDoubleClickTimes] = useState(0);
    const { LoginModal, setIsOpened } = useLoginModal()

    return (
        <div>
            <footer>
                <Helmet>
                    <link rel="alternate" type="application/rss+xml" title={siteName} href="/sub/rss.xml" />
                    <link rel="alternate" type="application/atom+xml" title={siteName} href="/sub/atom.xml" />
                    <link rel="alternate" type="application/json" title={siteName} href="/sub/rss.json" />
                </Helmet>
                <div className="flex flex-col mb-8 space-y-2 justify-center items-center t-primary ani-show">
                    {footerHtml && <div dangerouslySetInnerHTML={{ __html: footerHtml }} />}
                    <p className='text-sm text-neutral-500 font-normal link-line'>
                        <span onDoubleClick={() => {
                            if(doubleClickTimes >= 2){ // actually need 3 times doubleClick
                                setDoubleClickTimes(0)
                                if(!loginEnabled) {
                                    setIsOpened(true)
                                }
                            } else {
                                setDoubleClickTimes(doubleClickTimes + 1)
                            }
                        }}>
                            © {new Date().getFullYear()} Powered by <a className='hover:underline' href="https://github.com/openRin/Rin" target="_blank">Rin</a>
                        </span>
                        {config.get<boolean>('rss') && <>
                            <Spliter />
                            <Popup trigger={
                                <button className="hover:underline" type="button">
                                    RSS
                                </button>
                            }
                                position="top center"
                                arrow={false}
                                closeOnDocumentClick>
                                <div className="border-card">
                                    <p className='font-bold t-primary'>
                                        {t('footer.rss')}
                                    </p>
                                    <p>
                                        <a href='/sub/rss.xml'>
                                            RSS
                                        </a> <Spliter />
                                        <a href='/sub/atom.xml'>
                                            Atom
                                        </a> <Spliter />
                                        <a href='/sub/rss.json'>
                                            JSON
                                        </a>
                                    </p>

                                </div>
                            </Popup>
                        </>}
                    </p>
                </div>
                <LoginModal />
            </footer>
        </div>
    );
}

function Spliter() {
    return (<span className='px-1'>
        |
    </span>
    )
}

export default Footer;