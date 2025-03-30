import selectAll from "css-select";
import {
  isComment,
  isDocument,
  isTag,
  isText,
  type AnyNode,
  type Element,
} from "domhandler";
import { parseDocument } from "htmlparser2";
import assert from "node:assert";
import { parse as parseCSS } from "postcss";

export interface VNode {
  type: string;
  props: {
    style?: Record<string, any>;
    children?: Array<VNode | string | null>;
    [prop: string]: any;
  };
}

export function html(markup: string): VNode {
  const document = parseDocument(markup);

  const styles = new WeakMap<Element, Record<string, any>>();

  for (const style of selectAll<AnyNode, Element>("style", document)) {
    assert(style.childNodes.length === 1 && style.childNodes[0].nodeType === 3); // 3 = text

    const text = style.childNodes[0].data;
    const ast = parseCSS(text);

    ast.walkRules((rule) => {
      const elements = selectAll<AnyNode, Element>(rule.selector, document);
      rule.walkDecls((decl) => {
        for (const el of elements) {
          let style = styles.get(el);
          if (!style) styles.set(el, (style = {}));

          // TODO: handle selector specificity
          style[decl.prop] = decl.value;
        }
      });
    });
  }

  return nodeToVnode(document) as VNode;

  function nodeToVnode(node: AnyNode): VNode | string | null {
    if (isDocument(node)) {
      return {
        type: "html",
        props: {
          children: node.childNodes.map(nodeToVnode),
          style: {
            // TODO: :root styles
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
          },
        },
      };
    } else if (isTag(node)) {
      return {
        type: node.tagName.toLowerCase(),
        props: {
          ...node.attribs,
          children: node.childNodes.map(nodeToVnode),
          style: { ...styles.get(node) }, // TODO: style attributes
        },
      };
    } else if (isText(node)) {
      return node.data;
    } else if (isComment(node)) {
      return null;
    }

    throw new Error("unhandled node type");
  }
}
