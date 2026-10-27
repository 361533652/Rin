import React from "react";

export function Padding({ className = "mx-4", children, fullWidth = false }: { className?: string, children?: React.ReactNode, fullWidth?: boolean }) {
    // fullWidth 是 Header 用的：它只需要横向铺满，绝不能被撑成整屏高度——
    // 之前 min-h 无条件加在这里，页头那个 div 变成 100vh 的透明块，把整页中间区域的点击全挡掉了。
    const inner = fullWidth
        ? 'w-full'
        : 'max-w-4xl mx-auto w-full flex min-h-[calc(100vh-11rem)] flex-col';
    return (
        <div className={`${className} sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 2xl:mx-24 duration-300`} >
            <div className={inner}>
                {children}
            </div>
        </div>
    )
}
