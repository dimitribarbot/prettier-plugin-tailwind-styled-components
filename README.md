A [Prettier](https://prettier.io/) plugin for Tailwind CSS v3.0+ and [Tailwind Styled-Components](https://www.npmjs.com/package/tailwind-styled-components) v2.2.0+ that automatically sorts classes based on [the recommended class order](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier#how-classes-are-sorted). This plugin is based on the official [Tailwind CSS prettier plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).

## Installation

To get started, just install `prettier-plugin-tailwind-styled-components` as a dev-dependency:

```sh
npm install -D prettier prettier-plugin-tailwind-styled-components
```

This plugin follows Prettier’s autoloading convention, so as long as you’ve got Prettier set up in your project, it’ll start working automatically as soon as it’s installed.

_Note that plugin autoloading is not supported when using certain package managers, such as pnpm or Yarn PnP. In this case you may need to add the plugin to your Prettier config explicitly:_

```js
// prettier.config.js
module.exports = {
  plugins: [require('prettier-plugin-tailwind-styled-components')],
}
```

## Resolving your Tailwind configuration

To ensure that the class sorting is taking into consideration any of your project's Tailwind customizations, it needs access to your [Tailwind configuration file](https://tailwindcss.com/docs/configuration) (`tailwind.config.js`).

By default the plugin will look for this file in the same directory as your Prettier configuration file. However, if your Tailwind configuration is somewhere else, you can specify this using the `tailwindConfig` option in your Prettier configuration.

Note that paths are resolved relative to the Prettier configuration file.

```js
// prettier.config.js
module.exports = {
  tailwindConfig: './styles/tailwind.config.js',
}
```

If a local configuration file cannot be found the plugin will fallback to the default Tailwind configuration.

## Compatibility with other Prettier plugins

This plugin uses Prettier APIs that can only be used by one plugin at a time, making it incompatible with other Prettier plugins implemented the same way. To solve this we've added explicit per-plugin workarounds that enable compatibility with the following Prettier plugins:

- `@trivago/prettier-plugin-sort-imports`
- `prettier-plugin-css-order`
- `prettier-plugin-import-sort`
- `prettier-plugin-jsdoc`
- `prettier-plugin-organize-attributes`
- `prettier-plugin-organize-imports`
- `prettier-plugin-style-order`

One limitation with this approach is that `prettier-plugin-tailwind-styled-components` *must* be loaded last, meaning Prettier auto-loading needs to be disabled. You can do this by setting the `pluginSearchDirs` option to `false` and then listing each of your Prettier plugins in the `plugins` array:

```json5
// .prettierrc
{
  // ..
  "plugins": [
    "prettier-plugin-organize-imports",
    "prettier-plugin-tailwind-styled-components" // MUST come last
  ],
  "pluginSearchDirs": false
}
```
