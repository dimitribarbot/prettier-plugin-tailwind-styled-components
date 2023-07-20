import escalade from 'escalade/sync'
import requireFrom from 'import-from'
import requireFresh from 'import-fresh'
import objectHash from 'object-hash'
import * as path from 'path'
import prettier from 'prettier'
import * as prettierParserBabel from 'prettier/plugins/babel'
import * as prettierParserAcorn from 'prettier/plugins/acorn'
import * as prettierParserMeriyah from 'prettier/plugins/meriyah'
import * as prettierParserFlow from 'prettier/plugins/flow'
import * as prettierParserTypescript from 'prettier/plugins/typescript'
import { createContext as createContextFallback } from 'tailwindcss/lib/lib/setupContextUtils'
import resolveConfigFallback from 'tailwindcss/resolveConfig'

const basePlugins = getBasePlugins()

const contextMap = new Map()

// https://lihautan.com/manipulating-ast-with-javascript/
function visit(ast, callbackMap) {
  function _visit(node, parent, key, index, meta = {}) {
    if (typeof callbackMap === 'function') {
      if (callbackMap(node, parent, key, index, meta) === false) {
        return
      }
    } else if (node.type in callbackMap) {
      if (callbackMap[node.type](node, parent, key, index, meta) === false) {
        return
      }
    }

    const keys = Object.keys(node)
    for (let i = 0; i < keys.length; i++) {
      const child = node[keys[i]]
      if (Array.isArray(child)) {
        for (let j = 0; j < child.length; j++) {
          if (child[j] !== null) {
            _visit(child[j], node, keys[i], j, { ...meta })
          }
        }
      } else if (typeof child?.type === 'string') {
        _visit(child, node, keys[i], i, { ...meta })
      }
    }
  }
  _visit(ast)
}

function bigSign(bigIntValue) {
  return (bigIntValue > 0n) - (bigIntValue < 0n)
}

function sortClassList(classList, getClassOrder) {
  if (!getClassOrder) {
    return classList
  }

  return getClassOrder(classList)
    .sort(([, a], [, z]) => {
      if (a === z) return 0
      if (a === null) return -1
      if (z === null) return 1
      return bigSign(a - z)
    })
    .map(([className]) => className)
}

function isTemplateLiteral(node) {
  return (
    node?.type === 'TemplateLiteral' ||
    (node?.type === 'Template' && typeof node.value === 'string')
  )
}

function isUsingTailwindStyledComponent(node, tailwindStyledComponentsImportName) {
  return (
    ((node.tag.type === 'MemberExpression' &&
      node.tag.object?.type === 'Identifier' &&
      node.tag.object.name === tailwindStyledComponentsImportName) ||
      (node.tag.type === 'CallExpression' &&
        node.tag.callee?.type === 'Identifier' &&
        node.tag.callee.name === tailwindStyledComponentsImportName)) &&
    isTemplateLiteral(node.quasi)
  )
}

function getLineBreak(options) {
  if (options.endOfLine === 'lf') {
    return '\n'
  }
  if (options.endOfLine === 'cr') {
    return '\r'
  }
  if (options.endOfLine === 'crlf') {
    return '\r\n'
  }
  return ''
}

function getIndentation(options) {
  return options.useTabs ? '\t' : ' '.repeat(options.tabWidth)
}

function insertLineBreakAtStart(value, options) {
  const lineBreak = getLineBreak(options)
  const indentation = getIndentation(options)
  if (!value.startsWith(lineBreak)) {
    return `${lineBreak}${indentation}${value}`
  }

  return value
}

function insertLineBreakAtEnd(value, options, withIndentation) {
  const lineBreak = getLineBreak(options)
  if (!value.endsWith(lineBreak)) {
    if (withIndentation) {
      const indentation = getIndentation(options)
      return `${value}${lineBreak}${indentation}`
    }
    return `${value}${lineBreak}`
  }

  return value
}

function normalizeLitteral(value) {
  return value
    .replace(/\r\n\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function indentAndSortClasses(value, options, tailwindClassList, tailwindContext) {
  const lineBreak = getLineBreak(options)
  const indentation = getIndentation(options)
  const initialClassList = value.split(' ')
  const sortedClassList = sortClassList(initialClassList, tailwindContext.getClassOrder)
  const newSortedClassList = tailwindClassList.splice(0, sortedClassList.length)
  return newSortedClassList.join(`${lineBreak}${indentation}`)
}

function isNotEmpty(value) {
  return /[\S]/g.exec(value)
}

function transformLitteral(
  value,
  options,
  tailwindClassList,
  tailwindContext,
  withIndentationAtEnd
) {
  if (isNotEmpty(value)) {
    let newValue = normalizeLitteral(value)
    newValue = indentAndSortClasses(newValue, options, tailwindClassList, tailwindContext)
    newValue = insertLineBreakAtStart(newValue, options)
    newValue = insertLineBreakAtEnd(newValue, options, withIndentationAtEnd)
    return newValue
  }
  if (withIndentationAtEnd) {
    let newValue = normalizeLitteral(value)
    newValue = insertLineBreakAtEnd(newValue, options, withIndentationAtEnd)
    return newValue
  }
  return value
}

function transformNode(node, options, tailwindClassLists, tailwindContext) {
  if (Array.isArray(node.quasis)) {
    for (let i = 0; i < node.quasis.length; i++) {
      const quasi = node.quasis[i]

      if (quasi.value) {
        quasi.value.raw = transformLitteral(
          quasi.value.raw,
          options,
          tailwindClassLists.rawClassList,
          tailwindContext,
          !quasi.tail
        )

        quasi.value.cooked = transformLitteral(
          quasi.value.cooked,
          options,
          tailwindClassLists.cookedClassList,
          tailwindContext,
          !quasi.tail
        )
      }
    }
  }
}

function extractTailwindClassLists(node, tailwindContext) {
  if (Array.isArray(node.quasis)) {
    const rawValue = node.quasis.map((quasi) => quasi.value?.raw || '').join('')
    const cookedValue = node.quasis.map((quasi) => quasi.value?.cooked || '').join('')

    const normalizedRawValue = normalizeLitteral(rawValue)
    const initialRawClassList = normalizedRawValue.split(' ')
    const sortedRawClassList = sortClassList(initialRawClassList, tailwindContext.getClassOrder)

    const normalizedCookedValue = normalizeLitteral(cookedValue)
    const initialCookedClassList = normalizedCookedValue.split(' ')
    const sortedCookedClassList = sortClassList(
      initialCookedClassList,
      tailwindContext.getClassOrder
    )

    return {
      rawClassList: sortedRawClassList,
      cookedClassList: sortedCookedClassList,
    }
  }

  return {
    rawClassList: [],
    cookedClassList: [],
  }
}

function processTailwindStyledComponentNode(
  options,
  tailwindStyledComponentsImportName,
  tailwindContext
) {
  return function _processTailwindStyledComponentNode(node) {
    if (!node.quasi || !node.tag) {
      return
    }
    if (isUsingTailwindStyledComponent(node, tailwindStyledComponentsImportName)) {
      const tailwindClassLists = extractTailwindClassLists(node.quasi, tailwindContext)
      transformNode(node.quasi, options, tailwindClassLists, tailwindContext)
    }
  }
}

function getTailwindStyledComponentImportName(ast) {
  if (!Array.isArray(ast.body)) {
    return
  }

  const importSpecifiers =
    ast.body.find(
      (element) =>
        element.type === 'ImportDeclaration' &&
        element.source?.value === 'tailwind-styled-components'
    )?.specifiers || []

  const defaultImportSpecifier = importSpecifiers.find(
    (specifier) =>
      specifier.type === 'ImportDefaultSpecifier' ||
      (specifier.type === 'ImportSpecifier' && specifier.imported?.name === 'default')
  )

  return defaultImportSpecifier?.local?.name
}

function getConfigBaseDir(options) {
  const prettierConfigPath = prettier.resolveConfigFile.sync(options.filepath)

  if (options.tailwindConfig) {
    return prettierConfigPath ? path.dirname(prettierConfigPath) : process.cwd()
  }

  return prettierConfigPath
    ? path.dirname(prettierConfigPath)
    : options.filepath
    ? path.dirname(options.filepath)
    : process.cwd()
}

function getTailwindConfigPath(baseConfigDir, options) {
  if (options.tailwindConfig) {
    return path.resolve(baseConfigDir, options.tailwindConfig)
  }

  let configPath
  try {
    configPath = escalade(baseConfigDir, (_dir, names) => {
      if (names.includes('tailwind.config.js')) {
        return 'tailwind.config.js'
      }
      if (names.includes('tailwind.config.cjs')) {
        return 'tailwind.config.cjs'
      }
    })
  } catch {}

  return configPath
}

function getTailwindConfig(tailwindConfigPath) {
  const tailwindConfig = tailwindConfigPath ? requireFresh(tailwindConfigPath) : {}

  // suppress "empty content" warning
  tailwindConfig.content = ['no-op']

  return tailwindConfig
}

function getTailwindContext(options) {
  let resolveConfig = resolveConfigFallback
  let createContext = createContextFallback

  const baseDir = getConfigBaseDir(options)
  const tailwindConfigPath = getTailwindConfigPath(baseDir, options)
  const tailwindConfig = getTailwindConfig(tailwindConfigPath)

  try {
    resolveConfig = requireFrom(baseDir, 'tailwindcss/resolveConfig')
    createContext = requireFrom(baseDir, 'tailwindcss/lib/lib/setupContextUtils').createContext
  } catch {}

  const existing = contextMap.get(tailwindConfigPath)
  const hash = objectHash(tailwindConfig)

  let context
  if (existing && existing.hash === hash) {
    context = existing.context
  } else {
    const resolvedConfig = resolveConfig(tailwindConfig)
    context = createContext(resolvedConfig)
    contextMap.set(tailwindConfigPath, { context, hash })
  }

  return context
}

function getCompatibleParser(parserFormat, options) {
  if (!options.plugins) {
    return basePlugins.parsers[parserFormat]
  }

  const parser = {
    ...basePlugins.parsers[parserFormat],
  }

  // Now load parsers from plugins
  const compatiblePlugins = [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-organize-imports',
    'prettier-plugin-css-order',
    'prettier-plugin-import-sort',
    'prettier-plugin-jsdoc',
    'prettier-plugin-organize-attributes',
    'prettier-plugin-style-order',
  ]

  for (const name of compatiblePlugins) {
    let path = null

    try {
      path = require.resolve(name)
    } catch (err) {
      continue
    }

    const plugin = options.plugins.find((plugin) => plugin.name === name || plugin.name === path)

    // The plugin is not loaded
    if (!plugin) {
      continue
    }

    Object.assign(parser, plugin.parsers.typescript)
  }

  return parser
}

function transformJavaScript(ast, options) {
  const tailwindContext = getTailwindContext(options)

  const tailwindStyledComponentsImportName = getTailwindStyledComponentImportName(ast)
  if (tailwindStyledComponentsImportName) {
    visit(
      ast,
      processTailwindStyledComponentNode(
        options,
        tailwindStyledComponentsImportName,
        tailwindContext
      )
    )
  }
}

function createParser(parserFormat, transform) {
  return {
    ...basePlugins.parsers[parserFormat],
    preprocess(code, options) {
      const original = getCompatibleParser(parserFormat, options)

      if (original.preprocess) {
        return original.preprocess(code, options)
      }

      return code
    },
    async parse(text, options = {}) {
      const original = getCompatibleParser(parserFormat, options)

      const ast = await original.parse(text, options)

      transform(ast, options)

      return ast
    },
  }
}

function getBasePlugins() {
  return {
    parsers: {
      babel: prettierParserBabel.parsers.babel,
      'babel-flow': prettierParserBabel.parsers['babel-flow'],
      flow: prettierParserFlow.parsers.flow,
      typescript: prettierParserTypescript.parsers.typescript,
      'babel-ts': prettierParserBabel.parsers['babel-ts'],
      acorn: prettierParserAcorn.parsers.acorn,
      meriyah: prettierParserMeriyah.parsers.meriyah,
      __js_expression: prettierParserBabel.parsers.__js_expression,
    },
    printers: {},
  }
}

export const parsers = {
  babel: createParser('babel', transformJavaScript),
  'babel-flow': createParser('babel-flow', transformJavaScript),
  flow: createParser('flow', transformJavaScript),
  typescript: createParser('typescript', transformJavaScript),
  'babel-ts': createParser('babel-ts', transformJavaScript),
  acorn: createParser('acorn', transformJavaScript),
  meriyah: createParser('meriyah', transformJavaScript),
  __js_expression: createParser('__js_expression', transformJavaScript),
}

export const printers = {}
