import type { Plugin } from "unified";
import type { Content, Root } from "mdast";

function processNode(child: Content, index: number, siblings: Content[]) {
  if (child.type !== "code") {
    if ("children" in child) {
      child.children.map(processNode);
    }
    return;
  }
  const { lang, value } = child;
  if (lang !== "plantuml") return;
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  siblings[index] = {
    type: "html",
    value: `<pre data-plantuml="${escaped}">${value}</pre>`,
  };
}

const remarkPlantuml: Plugin<[], Root> = () => (root: Root) => {
  root.children.map(processNode);
};

export default remarkPlantuml;
