import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { smoothScrollToElement } from '../utils/scroll'

export interface TableOfContent {
    index: number
    text: string
    marginLeft: number
    element: HTMLElement
    level: number
}

const useTableOfContents = (selector: string) => {
    const intersectingListRef = useRef<boolean[]>([]) // isIntersecting array
    const [tableOfContents, setTableOfContents] = useState<TableOfContent[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const { t } = useTranslation()
    const io = useRef<IntersectionObserver | null>(null);
    const [ref, setRef] = useState("-1")
    const lastRef = useRef("")

    useEffect(() => {
        if (lastRef.current === ref) return
        const content = document.querySelector(selector)
        if (!content) return
        const intersectingList = intersectingListRef.current
        const headers = content.querySelectorAll<HTMLElement>(
            'h1, h2, h3, h4, h5, h6'
        ) // all headers

        // set TableOfContents
        const tocData = Array.from(headers).map<TableOfContent>((header, i) => ({
            index: i,
            text: header.textContent || '',
            marginLeft: (Number(header.tagName.charAt(1)) - 1) * 16,
            level: Number(header.tagName.charAt(1)),
            element: header, // have to down little bit
        }))
        setTableOfContents(tocData)

        // create IntersectionObserver
        if (io.current) io.current.disconnect()
        io.current = new IntersectionObserver(
            (entries) => {
                // save isIntersecting info to array using data-id
                entries.forEach(({ target, isIntersecting }) => {
                    const idx = Number((target as HTMLElement).dataset.id || 0)
                    intersectingList[idx] = isIntersecting
                })
                // get activeIndex
                const currentIndex = intersectingList.findIndex((item) => item)
                let activeIndex = currentIndex - 1
                if (currentIndex === -1) {
                    activeIndex = intersectingList.length - 1
                } else if (currentIndex === 0) {
                    activeIndex = 0
                }
                setActiveIndex(activeIndex)
            },
            { rootMargin: "-20% 0px 10000px 0px", threshold: 0 }
        )
        intersectingList.length = 0 // reset array
        headers.forEach((header, i) => {
            if (header.getAttribute('data-id') !== null) return
            header.setAttribute('data-id', i.toString()) // set data-id
            intersectingList.push(false) // increase array length
            io.current!.observe(header) // register to observe
        })
        lastRef.current = ref
        return () => {
            if (io.current) io.current.disconnect()
        }
    }, [ref])

    const cleanup = (newId: string) => {
        if (lastRef.current === newId) return
        setRef(newId)
        if (io.current) io.current.disconnect()
    }

    return {
        TOC: () => (<div className='rounded-xl c-border backdrop-blur-md py-4 px-4 c-text-main' style={{ background: 'rgba(255,253,248,0.65)' }}>
            <h2 className="text-sm font-semibold mb-2 c-text-muted tracking-wide">{t("index.title")}</h2>
            <ul className="max-h-[calc(100vh-10.25rem)] overflow-auto" style={{ scrollbarWidth: "none" }}>
                {tableOfContents.length === 0 && <li>{t("index.empty.title")}</li>}
                {tableOfContents.map((item) => (
                    <li
                        key={`toc$${item.index}`}
                        className={`cursor-pointer relative pl-3 py-1 my-0.5 rounded-r transition-colors duration-200 border-l-[3px] ${activeIndex === item.index ? "c-primary c-primary-bg-light c-primary-hover font-medium" : "border-transparent c-text-nav hover:c-text-main"} hover:bg-[var(--primary-light)] [&:hover]:bg-opacity-40 ${item.level === 1 ? "text-sm" : item.level >= 3 ? "text-xs" : "text-sm"}`}
                        style={{ marginLeft: item.marginLeft }}
                        onClick={() => {
                            smoothScrollToElement(item.element);
                        }}
                    >
                        {item.text}
                    </li>
                ))}
            </ul>
        </div>), cleanup
    }
}

export default useTableOfContents
