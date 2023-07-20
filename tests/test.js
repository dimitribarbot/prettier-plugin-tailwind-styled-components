const prettier = require('prettier')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

async function formatFixture(name) {
  let binPath = path.resolve(__dirname, '../node_modules/.bin/prettier')
  let filePath = path.resolve(__dirname, `fixtures/${name}/example.styles.ts`)
  let pluginPath = path.resolve(__dirname, '../dist/index.js')

  let cmd

  if (prettier.version.startsWith('2.')) {
    cmd = `${binPath} ${filePath} --plugin-search-dir ${__dirname} --plugin ${pluginPath}`
  } else {
    cmd = `${binPath} ${filePath} --plugin ${pluginPath}`
  }

  return execAsync(cmd).then(({ stdout }) => stdout.trim())
}

function fixtureExpectedOutput(name) {
  let filePath = path.resolve(__dirname, `fixtures/${name}/example.styles.formatted.ts`)
  return fs.readFileSync(filePath).toString().trim()
}

test('no prettier config', async () => {
  const fixtureName = 'no-prettier-config'
  expect(await formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})

test('inferred config path', async () => {
  const fixtureName = 'basic'
  expect(await formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})

test('inferred config path (.cjs)', async () => {
  const fixtureName = 'cjs'
  expect(await formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})

test('plugins', async () => {
  const fixtureName = 'plugins'
  expect(await formatFixture(fixtureName)).toEqual(fixtureExpectedOutput(fixtureName))
})
