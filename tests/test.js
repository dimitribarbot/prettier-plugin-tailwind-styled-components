const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function formatFixture(name) {
  let binPath = path.resolve(__dirname, '../node_modules/.bin/prettier')
  let filePath = path.resolve(__dirname, `fixtures/${name}/example.styles.ts`)
  return execSync(
    `${binPath} ${filePath} --plugin-search-dir ${__dirname} --plugin ${path.resolve(
      __dirname,
      '..'
    )}`
  )
    .toString()
    .trim()
}

function fixtureExpectedOutput(name) {
  let filePath = path.resolve(__dirname, `fixtures/${name}/example.styles.formatted.ts`)
  return fs.readFileSync(filePath).toString().trim()
}

test('no prettier config', () => {
  const fixtureName = 'no-prettier-config'
  expect(formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})

test('inferred config path', () => {
  const fixtureName = 'basic'
  expect(formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})

test('inferred config path (.cjs)', () => {
  const fixtureName = 'cjs'
  expect(formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})

test('plugins', () => {
  const fixtureName = 'plugins'
  expect(formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})
