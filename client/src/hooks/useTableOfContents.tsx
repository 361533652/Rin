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
        // 层级按「实际出现的最小标题级」归一化：正文标题会整体降级渲染，
        // 若直接用 tagName 算缩进，降级后整棵目录会平白多出一级缩进。
        const rawLevels = Array.from(headers).map(h => Number(h.tagName.charAt(1)))
        const minLevel = rawLevels.length > 0 ? Math.min(...rawLevels) : 1
        const tocData = Array.from(headers).map<TableOfContent>((header, i) => {
            const level = rawLevels[i] - minLevel + 1
            return {
                index: i,
                text: header.textContent || '',
                marginLeft: (level - 1) * 16,
                level,
                element: header, // have to down little bit
            }
        })
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
        // 没有标题时不要渲染整个目录面板：/about 这类无标题页面本来就会显示「目录为空」，
        // 白白占掉右侧一整条，还挤压正文。
        hasTOC: tableOfContents.length > 0,
        TOC: () => (<div className='flex h-full min-h-0 flex-col rounded-xl c-border backdrop-blur-md py-4 px-4 c-text-main' style={{ background: 'rgba(255,253,248,0.65)' }}>
            <h2 className="text-sm font-semibold mb-2 c-text-muted tracking-wide">{t("index.title")}</h2>
            {/* 高度交给外层 aside 的 flex 布局分配，避免与右下悬浮按钮（TOP + 音乐）重叠 */}
            <ul className="min-h-0 flex-1 overflow-auto" style={{ scrollbarWidth: "none" }}>
                {tableOfContents.length === 0 && <li className="c-text-muted text-sm">{t("index.empty.title")}</li>}
                {tableOfContents.map((item) => (
                    <li
                        key={`toc$${item.index}`}
                        className={`cursor-pointer relative pl-3 py-1 my-0.5 rounded-r transition-colors duration-200 border-l-[3px] ${activeIndex === item.index ? "c-primary-ink c-primary-bg-light font-medium" : "border-transparent c-text-nav hover:c-text-main"} hover:bg-[var(--primary-light)] [&:hover]:bg-opacity-40 ${item.level === 1 ? "text-sm" : item.level >= 3 ? "text-xs" : "text-sm"}`}
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
