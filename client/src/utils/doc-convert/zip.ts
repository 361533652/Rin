/**
 * 极简 ZIP 读取器。
 *
 * docx 就是一个 ZIP 包，我们只需要取出 word/document.xml 这一个条目。
 * 不引第三方库的原因：只需要「读中央目录 + 解一个 deflate 条目」这点功能，
 * DecompressionStream('deflate-raw') 浏览器原生就有（Chrome 80+ / Safari 16.4+ / Firefox 113+）。
 */

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

/** 中央目录可能带 comment，所以 EOCD 要从尾部往前找，最多扫 64KB */
const EOCD_MAX_SCAN = 0xffff + 22;

export interface ZipEntry {
    name: string;
    compressedSize: number;
    uncompressedSize: number;
    method: number;
    localHeaderOffset: number;
}

function findEocd(view: DataView): number {
    const len = view.byteLength;
    const start = Math.max(0, len - EOCD_MAX_SCAN);
    for (let i = len - 22; i >= start; i--) {
        if (view.getUint32(i, true) === EOCD_SIG) return i;
    }
    return -1;
}

/** 列出全部条目（只读元信息，不解压） */
export function listEntries(buf: ArrayBuffer): ZipEntry[] {
    const view = new DataView(buf);
    const eocd = findEocd(view);
    if (eocd < 0) throw new Error('不是有效的 ZIP 结构');

    const count = view.getUint16(eocd + 10, true);
    let p = view.getUint32(eocd + 16, true);
    const decoder = new TextDecoder();
    const entries: ZipEntry[] = [];

    for (let i = 0; i < count; i++) {
        if (p + 46 > view.byteLength || view.getUint32(p, true) !== CEN_SIG) break;
        const nameLen = view.getUint16(p + 28, true);
        const extraLen = view.getUint16(p + 30, true);
        const commentLen = view.getUint16(p + 32, true);
        const nameBytes = new Uint8Array(buf, p + 46, nameLen);
        entries.push({
            name: decoder.decode(nameBytes),
            method: view.getUint16(p + 10, true),
            compressedSize: view.getUint32(p + 20, true),
            uncompressedSize: view.getUint32(p + 24, true),
            localHeaderOffset: view.getUint32(p + 42, true),
        });
        p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
}

/** 取出指定条目的解压后内容；找不到返回 undefined */
export async function readEntry(buf: ArrayBuffer, wanted: string): Promise<Uint8Array | undefined> {
    const entry = listEntries(buf).find(e => e.name === wanted);
    if (!entry) return undefined;

    const view = new DataView(buf);
    const lho = entry.localHeaderOffset;
    if (lho + 30 > view.byteLength || view.getUint32(lho, true) !== LOC_SIG) {
        throw new Error('ZIP 局部头损坏');
    }
    // 局部头的名字/扩展区长度可能和中央目录不同，必须重新读
    const nameLen = view.getUint16(lho + 26, true);
    const extraLen = view.getUint16(lho + 28, true);
    const dataStart = lho + 30 + nameLen + extraLen;
    const data = new Uint8Array(buf, dataStart, entry.compressedSize);

    if (entry.method === 0) return data;
    if (entry.method !== 8) throw new Error(`不支持的压缩方式 ${entry.method}`);

    if (typeof DecompressionStream === 'undefined') {
        throw new Error('当前浏览器不支持解压 docx，请换用较新的浏览器');
    }
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}
