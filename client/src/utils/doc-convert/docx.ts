/**
 * DOCX → 纯文本。
 *
 * docx 的正文在 word/document.xml 里，是 OOXML（WordprocessingML）。
 * 这里按 localName 遍历，不依赖前缀是不是 "w"，因为不同生成器（Word / WPS / LibreOffice / pandoc）
 * 用的命名空间前缀并不统一，写死 "w:t" 会在某些文件上取不到文字。
 */
import { ConvertError, type ConvertResult } from './types';
import { readEntry } from './zip';

const DOC_PART = 'word/document.xml';

/** 收集段落可见文字时的临时缓冲 */
type Sink = { text: string };

function isEl(n: Node): n is Element {
    return n.nodeType === Node.ELEMENT_NODE;
}

// 用 childNodes 而不是 children：XML 文档里前者的类型更可靠
function children(el: Element): Element[] {
    return Array.prototype.slice.call(el.childNodes).filter(isEl) as Element[];
}

/**
 * 段落内联内容 → 字符串。
 * 只认「可见文字」相关的几类节点，其余（书签、域代码、修订标记）忽略或继续下钻。
 */
function inlineText(el: Element, sink: Sink): void {
    for (const child of children(el)) {
        switch (child.localName) {
            case 't':
                sink.text += child.textContent ?? '';
                break;
            case 'tab':
                sink.text += '\t';
                break;
            case 'br':
            case 'cr':
                sink.text += '\n';
                break;
            case 'noBreakHyphen':
                sink.text += '-';
                break;
            // 修订里被删掉的文字不属于最终稿，跳过
            case 'delText':
            case 'instrText':
            case 'pPr':
            case 'rPr':
                break;
            // 图片、脚注引用等没有文字，但仍可能有 altText / 域结果，下钻即可
            default:
                inlineText(child, sink);
        }
    }
}

function paragraphText(p: Element): string {
    const sink: Sink = { text: '' };
    inlineText(p, sink);
    // 行尾空白没有意义，但保留行首缩进
    return sink.text.replace(/[ \t]+$/gm, '');
}

/** 单张表的文字：行内单元格用 tab 分隔，行与行用换行 */
function tableText(tbl: Element): string {
    const rows: string[] = [];
    for (const tr of children(tbl)) {
        if (tr.localName !== 'tr') continue;
        const cells: string[] = [];
        for (const tc of children(tr)) {
            if (tc.localName !== 'tc') continue;
            const cellParas: string[] = [];
            collectBlocks(tc, cellParas);
            cells.push(cellParas.join(' ').trim());
        }
        if (cells.length > 0) rows.push(cells.join('\t'));
    }
    return rows.join('\n');
}

/**
 * 按块级元素收集正文：段落一行、表格若干行。
 * 递归下钻是因为内容常被 sdt（内容控件）、customXml 之类包一层。
 */
function collectBlocks(el: Element, out: string[]): void {
    for (const child of children(el)) {
        switch (child.localName) {
            case 'p':
                out.push(paragraphText(child));
                break;
            case 'tbl':
                out.push(tableText(child));
                break;
            // 这些是纯样式/属性节点，不含正文
            case 'sectPr':
            case 'pPr':
            case 'tblPr':
            case 'trPr':
            case 'tcPr':
            case 'rPr':
                break;
            default:
                collectBlocks(child, out);
        }
    }
}

function normalize(text: string): string {
    return text
        // 三个以上连续空行压成两个，Word 里常有一堆空段
        .replace(/\n{3,}/g, '\n\n')
        // 行尾空格
        .replace(/[ \t]+$/gm, '')
        .trim();
}

export async function docxToText(file: File): Promise<ConvertResult> {
    const buf = await file.arrayBuffer();

    let xmlBytes: Uint8Array | undefined;
    try {
        xmlBytes = await readEntry(buf, DOC_PART);
    } catch (e) {
        throw new ConvertError(e instanceof Error ? e.message : '无法读取 docx 内容');
    }

    if (!xmlBytes) {
        throw new ConvertError('这个文件里找不到正文，可能不是 Word 文档，或者已经损坏');
    }

    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new ConvertError('正文 XML 解析失败，文件可能已损坏');
    }

    const body = doc.documentElement.localName === 'body'
        ? doc.documentElement
        : Array.from(doc.documentElement.getElementsByTagName('*')).find(e => e.localName === 'body');
    if (!body) throw new ConvertError('文档里没有正文段落');

    const blocks: string[] = [];
    collectBlocks(body, blocks);

    const text = normalize(blocks.join('\n\n'));
    if (!text) {
        throw new ConvertError('这个文档里没有可提取的文字（可能全是图片或扫描件）');
    }

    const paras = blocks.filter(b => b.trim().length > 0).length;
    return { text, summary: `DOCX · ${paras} 段 · ${text.length} 字符` };
}
