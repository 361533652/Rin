/**
 * 文档格式转换的公共类型。
 *
 * 每种输入格式实现一个 Converter，由 index.ts 按扩展名注册；
 * 以后加 pdf/xlsx 之类只需要再写一个转换器并注册进去。
 */

export interface ConvertResult {
    /** 转换出的纯文本 */
    text: string;
    /** 供界面展示的来源描述，例如“DOCX · 3 段” */
    summary?: string;
}

export interface Converter {
    /** 稳定的标识，用于日志与测试 */
    id: string;
    /** 支持的扩展名（小写、不带点） */
    extensions: string[];
    /** input[accept] 用的过滤串 */
    accept: string;
    /** 转换器显示名，界面直接展示 */
    label: string;
    convert: (file: File) => Promise<ConvertResult>;
}

/** 转换失败时抛出，消息会原样显示给用户，所以要是人话 */
export class ConvertError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConvertError';
    }
}
