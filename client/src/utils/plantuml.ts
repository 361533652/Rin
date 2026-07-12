const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

function encode6bit(b: number): string {
  return ALPHABET[b & 0x3f];
}

function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  return encode6bit(c1) + encode6bit(c2) + encode6bit(c3) + encode6bit(c4);
}

async function encodePlantUML(source: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(source);

  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const result = await reader.read();
    if (result.done) { done = true; }
    else if (result.value) { chunks.push(result.value); }
  }

  let totalLength = 0;
  for (const c of chunks) totalLength += c.length;
  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) { compressed.set(c, offset); offset += c.length; }

  let result = "";
  for (let i = 0; i < compressed.length; i += 3) {
    if (i + 2 === compressed.length) {
      result += append3bytes(compressed[i], compressed[i + 1], 0);
    } else if (i + 1 === compressed.length) {
      result += append3bytes(compressed[i], 0, 0);
    } else {
      result += append3bytes(compressed[i], compressed[i + 1], compressed[i + 2]);
    }
  }
  return result;
}

export async function renderPlantUMLDiagrams(): Promise<void> {
  const plantUMLServer = "https://www.plantuml.com/plantuml";
  const pres = document.querySelectorAll<HTMLElement>("pre[data-plantuml]");
  for (const pre of pres) {
    if (pre.dataset.plantumlRendered) continue;
    const source = pre.dataset.plantuml;
    if (!source) continue;
    try {
      pre.dataset.plantumlRendered = "pending";
      const encoded = await encodePlantUML(source);
      const img = document.createElement("img");
      img.src = `${plantUMLServer}/svg/${encoded}`;
      img.alt = "PlantUML diagram";
      img.className = "max-w-full my-4 rounded-lg";
      img.onload = () => { pre.replaceWith(img); };
      img.onerror = () => {
        pre.textContent = source;
        pre.className = "";
        pre.dataset.plantumlRendered = "error";
      };
    } catch {
      pre.dataset.plantumlRendered = "error";
    }
  }
}
