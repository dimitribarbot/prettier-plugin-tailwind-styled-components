import type { Parser, ParserOptions, Plugin } from "prettier";
import * as prettierParserAcorn from "prettier/plugins/acorn";
import * as prettierParserBabel from "prettier/plugins/babel";
import * as prettierParserFlow from "prettier/plugins/flow";
import * as prettierParserMeriyah from "prettier/plugins/meriyah";
import * as prettierParserTypescript from "prettier/plugins/typescript";

const visit = (ast: any, callbackMap: Function | Record<string, Function>) => {
  const _visit = (
    node: any,
    parent?: any,
    key?: string,
    index?: number,
    meta = {}
  ) => {
    if (typeof callbackMap === "function") {
      if (callbackMap(node, parent, key, index, meta) === false) {
        return;
      }
    } else if (node.type in callbackMap) {
      if (callbackMap[node.type](node, parent, key, index, meta) === false) {
        return;
      }
    }

    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const child = node[keys[i]];
      if (Array.isArray(child)) {
        for (let j = 0; j < child.length; j++) {
          if (child[j] !== null) {
            _visit(child[j], node, keys[i], j, { ...meta });
          }
        }
      } else if (typeof child?.type === "string") {
        _visit(child, node, keys[i], i, { ...meta });
      }
    }
  };
  _visit(ast);
};

const isTemplateLiteral = (node: any) =>
  node?.type === "TemplateLiteral" ||
  (node?.type === "Template" && typeof node.value === "string");

const normalizeLitteral = (value: string) =>
  value
    .replace(/\r\n\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isUsingTailwindStyledComponent = (
  node: any,
  tailwindStyledComponentsImportName: string
) =>
  ((node.tag.type === "MemberExpression" &&
    node.tag.object?.type === "Identifier" &&
    node.tag.object.name === tailwindStyledComponentsImportName) ||
    (node.tag.type === "CallExpression" &&
      node.tag.callee?.type === "Identifier" &&
      node.tag.callee.name === tailwindStyledComponentsImportName)) &&
  isTemplateLiteral(node.quasi);

const getLineBreak = (options: ParserOptions<any>) => {
  if (options.endOfLine === "lf") {
    return "\n";
  }
  if (options.endOfLine === "cr") {
    return "\r";
  }
  if (options.endOfLine === "crlf") {
    return "\r\n";
  }
  return "";
};

const getIndentation = (options: ParserOptions<any>) =>
  options.useTabs ? "\t" : " ".repeat(options.tabWidth);

const insertLineBreakAtStart = (value: string, options: ParserOptions<any>) => {
  const lineBreak = getLineBreak(options);
  const indentation = getIndentation(options);
  if (!value.startsWith(lineBreak)) {
    return `${lineBreak}${indentation}${value}`;
  }

  return value;
};

const insertLineBreakAtEnd = (
  value: string,
  options: ParserOptions<any>,
  withIndentation: boolean
) => {
  const lineBreak = getLineBreak(options);
  if (!value.endsWith(lineBreak)) {
    if (withIndentation) {
      const indentation = getIndentation(options);
      return `${value}${lineBreak}${indentation}`;
    }
    return `${value}${lineBreak}`;
  }

  return value;
};

const indentClasses = (
  value: string,
  options: ParserOptions<any>,
  tailwindClassList: string[]
) => {
  const lineBreak = getLineBreak(options);
  const indentation = getIndentation(options);
  const initialClassList = value.split(" ");
  const newClassList = tailwindClassList.splice(0, initialClassList.length);
  return newClassList.join(`${lineBreak}${indentation}`);
};

const isNotEmpty = (value: string) => /[\S]/g.exec(value);

const transformLitteral = (
  value: string,
  options: ParserOptions<any>,
  tailwindClassList: string[],
  withIndentationAtEnd: boolean
) => {
  if (isNotEmpty(value)) {
    let newValue = normalizeLitteral(value);
    newValue = indentClasses(newValue, options, tailwindClassList);
    newValue = insertLineBreakAtStart(newValue, options);
    newValue = insertLineBreakAtEnd(newValue, options, withIndentationAtEnd);
    return newValue;
  }
  if (withIndentationAtEnd) {
    let newValue = normalizeLitteral(value);
    newValue = insertLineBreakAtEnd(newValue, options, withIndentationAtEnd);
    return newValue;
  }
  return value;
};

const transformNode = (
  node: any,
  options: ParserOptions<any>,
  tailwindClassLists: { rawClassList: string[]; cookedClassList: string[] }
) => {
  if (Array.isArray(node.quasis)) {
    for (let i = 0; i < node.quasis.length; i++) {
      const quasi = node.quasis[i];

      if (quasi.value) {
        quasi.value.raw = transformLitteral(
          quasi.value.raw,
          options,
          tailwindClassLists.rawClassList,
          !quasi.tail
        );

        quasi.value.cooked = transformLitteral(
          quasi.value.cooked,
          options,
          tailwindClassLists.cookedClassList,
          !quasi.tail
        );
      }
    }
  }
};

const extractTailwindClassLists = (node: any) => {
  if (Array.isArray(node.quasis)) {
    const rawValue = node.quasis
      .map((quasi: any) => quasi.value?.raw || "")
      .join("");
    const cookedValue = node.quasis
      .map((quasi: any) => quasi.value?.cooked || "")
      .join("");

    const normalizedRawValue = normalizeLitteral(rawValue);
    const initialRawClassList = normalizedRawValue.split(" ");

    const normalizedCookedValue = normalizeLitteral(cookedValue);
    const initialCookedClassList = normalizedCookedValue.split(" ");

    return {
      rawClassList: initialRawClassList,
      cookedClassList: initialCookedClassList
    };
  }

  return {
    rawClassList: [],
    cookedClassList: []
  };
};

const processTailwindStyledComponentNode = (
  options: ParserOptions<any>,
  tailwindStyledComponentsImportName: string
) => {
  const _processTailwindStyledComponentNode = (node: any) => {
    if (!node.quasi || !node.tag) {
      return;
    }
    if (
      isUsingTailwindStyledComponent(node, tailwindStyledComponentsImportName)
    ) {
      const tailwindClassLists = extractTailwindClassLists(node.quasi);
      transformNode(node.quasi, options, tailwindClassLists);
    }
  };
  return _processTailwindStyledComponentNode;
};

const getTailwindStyledComponentImportName = (
  ast: any,
  options: ParserOptions<any>
) => {
  if (!Array.isArray(ast.body)) {
    return;
  }

  const tailwindStyledComponentsImport =
    options.tailwindStyledComponentsImport || "tailwind-styled-components";
  const importSpecifiers =
    ast.body.find(
      (element: any) =>
        element.type === "ImportDeclaration" &&
        element.source?.value === tailwindStyledComponentsImport
    )?.specifiers || [];

  const defaultImportSpecifier = importSpecifiers.find(
    (specifier: any) =>
      specifier.type === "ImportDefaultSpecifier" ||
      (specifier.type === "ImportSpecifier" &&
        specifier.imported?.name === "default")
  );

  return defaultImportSpecifier?.local?.name;
};

const transform = async (ast: any, options: ParserOptions<any>) => {
  const tailwindStyledComponentsImportName =
    getTailwindStyledComponentImportName(ast, options);
  if (!tailwindStyledComponentsImportName) {
    return;
  }
  visit(
    ast,
    processTailwindStyledComponentNode(
      options,
      tailwindStyledComponentsImportName
    )
  );
};

const getCompatibleParser = (
  baseParser: Parser,
  options: ParserOptions<any>
) => {
  if (!options.plugins) {
    return baseParser;
  }

  const parser = {
    ...baseParser
  };

  const tailwindCssPluginName = "prettier-plugin-tailwindcss";

  let path: string | null = null;
  try {
    path = require.resolve(tailwindCssPluginName);
  } catch (err) {
    return parser;
  }

  const plugin = options.plugins.find(
    plugin =>
      (plugin as any).name === tailwindCssPluginName ||
      (plugin as any).name === path
  );

  if (!plugin) {
    return parser;
  }

  Object.assign(parser, (plugin as Plugin<any>).parsers?.typescript);

  return parser;
};

export const createParser = async (parser: Parser) => ({
  ...parser,
  preprocess(code: string, options: ParserOptions<any>) {
    const original = getCompatibleParser(parser, options);
    if (original.preprocess) {
      return original.preprocess(code, options);
    }
    return code;
  },
  async parse(text: string, options: ParserOptions<any>) {
    const original = getCompatibleParser(parser, options);
    const ast = await original.parse(text, options);
    await transform(ast, options);
    return ast;
  }
});

export const parsers = {
  babel: createParser(prettierParserBabel.parsers.babel),
  "babel-flow": createParser(prettierParserBabel.parsers["babel-flow"]),
  flow: createParser(prettierParserFlow.parsers.flow),
  typescript: createParser(prettierParserTypescript.parsers.typescript),
  "babel-ts": createParser(prettierParserBabel.parsers["babel-ts"]),
  acorn: createParser(prettierParserAcorn.parsers.acorn),
  meriyah: createParser(prettierParserMeriyah.parsers.meriyah),
  __js_expression: createParser(prettierParserBabel.parsers.__js_expression)
};

export const printers = {};

export const options = {
  tailwindStyledComponentsImport: {
    type: "string",
    default: "tailwind-styled-components",
    category: "Tailwind Styled Components",
    description: "Tailwind styled components import"
  }
};
