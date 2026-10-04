/**
 * Node-only: finds every narrative string literal in the engine and components and turns it
 * into a catalog key (the Italian source text, gettext-style). Used by the coverage test and by
 * scripts/i18n-worklist.ts. Never imported by the app bundle.
 */
import { readFileSync } from "node:fs";
import ts from "typescript";
import { keyOf } from "./key.ts";

export type Found = { key: string; file: string; line: number; source: string };

/** Literals that are ids, CSS, keys or code, never shown as prose. */
function isProse(text: string, templated = false): boolean {
  const t = text.trim();
  if (!t) return false;
  if (!/\p{L}{2,}/u.test(t)) return false;
  if (!templated && /^[\w./@:#%-]+$/.test(t) && !/^[A-ZÀ-Ý][a-zà-ÿ']+$/.test(t)) return false; // ids, paths, lower-case tokens
  if (/^[a-z][\w-]*( [a-z][\w-]*)*$/.test(t) && /(^| )(is-|has-|text-|bg-|flex|grid|w-|h-|p[xy]?-|m[xy]?-|rounded|border|gap-|items-|justify-)/.test(t)) return false; // class lists
  if (/^(\.|#|\[|@media|var\(|rgba?\(|url\(|M\d)/.test(t)) return false;
  if (/^[A-Z0-9_]+$/.test(t)) return false; // CONSTANTS, abbreviations
  return true;
}

function inClassName(node: ts.Node): boolean {
  for (let n: ts.Node | undefined = node.parent; n; n = n.parent) {
    if (ts.isJsxAttribute(n)) return ["className", "style", "d", "transform", "fontFamily", "viewBox", "points"].includes(n.name.getText());
    if (ts.isCallExpression(n) && /^(cx|clsx|cn)$/.test(n.expression.getText())) return true;
    if (ts.isPropertyAssignment(n) && /^(className|boxShadow|background|fontFamily|transform|filter|color|borderColor)$/.test(n.name.getText())) return true;
    if (ts.isVariableDeclaration(n) && /(cls|Class|class|style|Style)$/.test(n.name.getText())) return true;
    if (ts.isStatement(n)) return false;
  }
  return false;
}

function skipContext(node: ts.Node, chromeFns: Set<string>): boolean {
  if (inClassName(node)) return true;
  const p = node.parent;
  if (!p) return false;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.InKeyword].includes(p.operatorToken.kind)) return true;
  if (ts.isJsxAttribute(p) && ["className", "id", "role", "type", "href", "rel", "target", "src", "data-testid", "key"].includes(p.name.getText())) return true;
  if (ts.isCallExpression(p)) {
    const callee = p.expression.getText();
    if (chromeFns.has(callee)) return true;
    if (/^(require|import|matchMedia|window\.matchMedia|console\.\w+|document\.\w+|localStorage\.\w+|.*\.(getItem|setItem|removeItem|querySelector|addEventListener|startsWith|endsWith|includes|split|join|test|match|replace|replaceAll|padStart|toLocaleString))$/.test(callee)) return true;
  }
  return false;
}

export function extractFile(file: string, rel = file): Found[] {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: Found[] = [];
  const chromeFns = new Set<string>();
  sf.statements.forEach((st) => {
    if (ts.isImportDeclaration(st) && /i18n"?'?$/.test(st.moduleSpecifier.getText(sf).replace(/["']/g, "")) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      st.importClause.namedBindings.elements.forEach((e) => {
        if (["t", "tf"].includes((e.propertyName ?? e.name).text)) chromeFns.add(e.name.text);
      });
    }
  });
  const add = (node: ts.Node, raw: string) => {
    const templated = /\{\d+\}/.test(raw);
    if (!isProse(raw.replace(/\{\d+\}/g, " ").replace(/^[\s.,:;—–-]+/, ""), templated)) return;
    if (templated && /^\s*[\w-]*(\{\d+\}[\w-]*)+\s*$/.test(raw) && !/\p{L}{3,}/u.test(raw.replace(/\{\d+\}/g, ""))) return;
    if (skipContext(node, chromeFns)) return;
    const key = keyOf(raw);
    if (!key || !/\p{L}{2,}/u.test(key.replace(/\{[\w$]+\}/g, ""))) return;
    out.push({ key, file: rel, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, source: node.getText(sf) });
  };
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node, node.text);
      return;
    }
    if (ts.isJsxText(node)) {
      const text = node.getText(sf).trim();
      if (text) add(node, text);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      let raw = node.head.text;
      node.templateSpans.forEach((span, i) => {
        raw += `{${i}}` + span.literal.text;
      });
      add(node, raw);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}
