const prettier = require('prettier')
const path = require('path')

async function format(str, options = {}) {
  let result = await prettier.format(str, {
    pluginSearchDirs: [__dirname], // disable plugin autoload
    semi: false,
    singleQuote: true,
    printWidth: 9999,
    parser: 'html',
    ...options,
    plugins: [
      ...options.plugins ?? [],
      path.resolve(__dirname, '../dist/index.js')
    ],
  })

  return result.trim()
}


let tests = [
  {
    versions: [2],
    plugins: [
      '@trivago/prettier-plugin-sort-imports',
    ],
    options: {
      importOrder: ["^@one/(.*)$", "^@two/(.*)$", "^[./]"],
      importOrderSortSpecifiers: true,
    },
    tests: {
      babel: [
        [
          `import './three'\nimport '@two/file'\nimport '@one/file'`,
          `import '@one/file'\nimport '@two/file'\nimport './three'`,
        ],
      ],
      typescript: [
        [
          `import './three'\nimport '@two/file'\nimport '@one/file'`,
          `import '@one/file'\nimport '@two/file'\nimport './three'`,
        ],
      ],
      'babel-ts': [
        [
          `import './three'\nimport '@two/file'\nimport '@one/file'`,
          `import '@one/file'\nimport '@two/file'\nimport './three'`,
        ],
      ],
    }
  },
  {
    versions: [2],
    plugins: [
      'prettier-plugin-organize-imports',
    ],
    options: {},
    tests: {
      babel: [
        [
          `import './three'\nimport '@two/file'\nimport '@one/file'`,
          `import '@one/file'\nimport '@two/file'\nimport './three'`,
        ],
      ],
      typescript: [
        [
          `import './three'\nimport '@two/file'\nimport '@one/file'`,
          `import '@one/file'\nimport '@two/file'\nimport './three'`,
        ],
      ],
      'babel-ts': [
        [
          `import './three'\nimport '@two/file'\nimport '@one/file'`,
          `import '@one/file'\nimport '@two/file'\nimport './three'`,
        ],
      ],
    }
  },
  {
    versions: [2],
    plugins: [
      'prettier-plugin-import-sort',
    ],
    tests: {
      babel: [
        [
          `
            import './three'
            import '@one/file'
            import '@two/file'
            export default function Foo() { return <div className="sm:p-0 p-4"></div> }
          `,
          `import '@one/file'\nimport '@two/file'\n\nimport './three'\n\nexport default function Foo() {\n  return <div className="sm:p-0 p-4"></div>\n}`,
        ],
      ],
    }
  },
  {
    versions: [2],
    plugins: [
      'prettier-plugin-jsdoc',
    ],
    tests: {
      babel: [
        [
          `/**\n             * @param {  string   }    param0 description\n             */\n            export default function Foo(param0) { return <div className="sm:p-0 p-4"></div> }`,
          `/** @param {string} param0 Description */\nexport default function Foo(param0) {\n  return <div className="sm:p-0 p-4"></div>\n}`,
        ],
      ],
    }
  },
  {
    versions: [2],
    plugins: [
      'prettier-plugin-css-order',
    ],
    tests: {
      css: [
        [
          `.foo {\n  color: red;\n  background-color: blue;\n  @apply sm:p-0 p-4 bg-blue-600;\n}`,
          `.foo {\n  background-color: blue;\n  color: red;\n  @apply sm:p-0 p-4 bg-blue-600;\n}`,
        ],
      ],
    }
  },
  {
    versions: [2],
    plugins: [
      'prettier-plugin-style-order',
    ],
    tests: {
      css: [
        [
          `.foo {\n  color: red;\n  margin-left: 1px;\n  background-color: blue;\n  margin-right: 1px;\n  @apply sm:p-0 p-4 bg-blue-600;\n}`,
          `.foo {\n  margin-right: 1px;\n  margin-left: 1px;\n  color: red;\n  background-color: blue;\n  @apply sm:p-0 p-4 bg-blue-600;\n}`,
        ],
      ],
    }
  },
  {
    versions: [2],
    plugins: [
      'prettier-plugin-organize-attributes',
    ],
    tests: {
      html: [
        [
          `<a href="https://www.example.com" class="sm:p-0 p-4">Example</a>`,
          `<a class="sm:p-0 p-4" href="https://www.example.com">Example</a>`,
        ],
      ],
    }
  },
]

for (const group of tests) {
  let name = group.plugins.join(', ')

  let canRun = prettier.version.startsWith('2.')
    ? group.versions.includes(2)
    : group.versions.includes(3)

  for (let parser in group.tests) {
    if (!canRun) {
      test.todo(`parsing ${parser} works with: ${name}`)
      continue
    }

    test(`parsing ${parser} works with: ${name}`, async () => {
      let plugins = [
        ...group.plugins.map(name => require.resolve(name)),
        path.resolve(__dirname, '../dist/index.js'),
      ]

      for (const [input, expected] of group.tests[parser]) {
        let output = await format(input, { parser, plugins, ...group.options })
        expect(output).toEqual(expected)
      }
    })
  }
}