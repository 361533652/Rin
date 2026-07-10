import type { Plugin } from 'unified';
import type { Content, Root } from 'mdast';

function processNode(child: Content, index: number, siblings: Content[]) {
  if (child.type !== 'code') {
    if ('children' in child) {
      child.children.map(processNode);
    }
    return;
  }
  const { lang, value } = child;
  if (lang !== 'mermaid') return;
  // 把原始 mermaid 源码存进 data-mermaid（属性值需转义 & 和 "），
  // 供主题切换重渲染时从该属性还原，避免拿到上一次残留的 SVG
  const escaped = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  siblings[index] = {
    type: 'html',
    value: `
    <pre class="mermaid_default dark:hidden" data-mermaid="${escaped}">${value}</pre>
    <pre class="mermaid_dark dark:block hidden" data-mermaid="${escaped}">${value}</pre>
    `
  }
}

const remarkMermaid: Plugin<[], Root> = () => (root: Root) => {
  root.children.map(processNode)
};

export default remarkMermaid;
