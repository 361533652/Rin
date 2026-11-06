/**
 * 转换器注册表。
 *
 * 目前只接了 docx，加新格式时：
 *   1. 在 types.ts 的规范下写一个 converter
 *   2. 丢进下面的数组
 * 界面的 accept、错误提示、下拉列表都会自动跟着变。
 */
import type { Converter } from './types';
import { docxToText } from './docx';

export * from './types';

export const converters: Converter[] = [
    {
        id: 'docx',
        extensions: ['docx'],
        accept: '.docx',
        label: 'Word 文档（.docx）',
        convert: docxToText,
    },
];

/** 全部转换器能接受的扩展名并集，给 input[accept] 用 */
export const allExtensions = converters.flatMap(c => c.extensions);

/** 按扩展名挑转换器；不支持时返回 undefined */
export function pickConverter(fileName: string): Converter | undefined {
    const ext = fileName.toLowerCase().split('.').pop();
    if (!ext) return undefined;
    return converters.find(c => c.extensions.includes(ext));
}
