import React from "react";

export function Padding({ className = "mx-4", children, fullWidth = false }: { className?: string, children?: React.ReactNode, fullWidth?: boolean }) {
    return (
        <div className={`${className} sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 2xl:mx-24 duration-300`} >
            {/* 短页面把页脚顶到视口底部：原来 /friends /tools /hashtags 的页脚悬在半空，下方留 650px 空白 */}
            <div className={`${fullWidth ? 'w-full' : 'max-w-4xl mx-auto w-full'} flex min-h-[calc(100vh-11rem)] flex-col`}>
                {children}
            </div>
        </div>
    )
}