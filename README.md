A [Prettier](https://prettier.io/) plugin for Tailwind CSS v3.0+ and [Tailwind Styled-Components](https://www.npmjs.com/package/tailwind-styled-components) v2.2.0+ that automatically sorts classes based on [the recommended class order](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier#how-classes-are-sorted). This plugin is based on the official [Tailwind CSS prettier plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).

## Installation

To get started, just install `prettier-plugin-tailwindcss` and `prettier-plugin-tailwind-styled-components` as dev dependencies:

```sh
npm install -D prettier prettier-plugin-tailwindcss prettier-plugin-tailwind-styled-components
```

Then add these plugins to your [Prettier configuration](https://prettier.io/docs/en/configuration.html):

```json
// .prettierrc
{
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-tailwind-styled-components"
  ]
}
```

Make sure `prettier-plugin-tailwind-styled-components` comes after `prettier-plugin-tailwindcss` as it depends on it.

## Upgrading to v0.5.x

As of v0.5.x, this plugin now requires Prettier v3 and is ESM-only. This means it cannot be loaded via `require()`. For more information see our [upgrade guide](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/issues/207#issuecomment-1698071122).

## Options

### Specifying your Tailwind stylesheet path

When using Tailwind CSS v4 you must specify your CSS file entry point, which includes your theme, custom utilities, and other Tailwind configuration options. To do this, use the `tailwindStylesheet` option in your Prettier configuration.

Note that paths are resolved relative to the Prettier configuration file.

```json
// .prettierrc
{
  "tailwindStylesheet": "./resources/css/app.css"
}
```

### Specifying your Tailwind JavaScript config path

To ensure that the class sorting takes into consideration any of your project's Tailwind customizations, it needs access to your [Tailwind configuration file](https://tailwindcss.com/docs/configuration) (`tailwind.config.js`).

By default the plugin will look for this file in the same directory as your Prettier configuration file. However, if your Tailwind configuration is somewhere else, you can specify this using the `tailwindConfig` option in your Prettier configuration.

Note that paths are resolved relative to the Prettier configuration file.

```json
// .prettierrc
{
  "tailwindConfig": "./styles/tailwind.config.js"
}
```

If a local configuration file cannot be found the plugin will fallback to the default Tailwind configuration.

## Sorting classes in template literals

To sort classes in template literals as `tailwind-styled-components` you can use the `tailwindFunctions` option, which takes a list of function names:

```json
// .prettierrc
{
  "tailwindFunctions": ["tw"]
}
```

With this configuration, any classes in template literals tagged with `tw` will automatically be sorted:

```jsx
import tw from "tailwind-styled-components";

export const Container = tw.div`
  flex
  flex-col
  items-center
  sm:flex-row
`;
```

## Preserving duplicate classes

This plugin automatically removes duplicate classes from your class lists. However, this can cause issues in some templating languages, like Fluid or Blade, where we can't distinguish between classes and the templating syntax.

If removing duplicate classes is causing issues in your project, you can use the `tailwindPreserveDuplicates` option to disable this behavior:

```json
// .prettierrc
{
  "tailwindPreserveDuplicates": true
}
```

With this configuration, anything we perceive as duplicate classes will be preserved:

```jsx
import tw from "tailwind-styled-components";

export const Container = tw.div`
  flex
  flex-col
  items-center
  sm:flex-row
  ${({ $isCompact }) => ($isCompact ? "grid-cols-3" : "grid-cols-5")}
  ${({ $isDark }) => ($isDark ? "bg-black/50" : "bg-white/50")}
`;
```

## Specifying tailwind-styled-components import name

By default, this plugins searches for imports such as:

```jsx
import tw from "tailwind-styled-components";
```

However, you may want to create your own tailwind styled components library. In that case, your import statement could look like:

```jsx
import tw from "@/lib/tailwindStyledComponents";
```

To allow your own import statement to work with this plugin, you have to add this configuration to your prettier configuration file:

```json
// .prettierrc
{
  "tailwindStyledComponentsImport": "@/lib/tailwindStyledComponents"
}
```

## Compatibility with other Prettier plugins

This plugin uses Prettier APIs that can only be used by one plugin at a time, making it incompatible with other Prettier plugins implemented the same way. To solve this we've added explicit per-plugin workarounds that enable compatibility with the following Prettier plugins:

- `@ianvs/prettier-plugin-sort-imports`
- `@prettier/plugin-pug`
- `@shopify/prettier-plugin-liquid`
- `@trivago/prettier-plugin-sort-imports`
- `prettier-plugin-astro`
- `prettier-plugin-css-order`
- `prettier-plugin-import-sort`
- `prettier-plugin-jsdoc`
- `prettier-plugin-multiline-arrays`
- `prettier-plugin-organize-attributes`
- `prettier-plugin-organize-imports`
- `prettier-plugin-style-order`
- `prettier-plugin-svelte`
- `prettier-plugin-sort-imports`

One limitation with this approach is that `prettier-plugin-tailwindcss` and `prettier-plugin-tailwind-styled-components` _must_ be loaded last.

```json
// .prettierrc
{
  // ..
  "plugins": [
    "prettier-plugin-svelte",
    "prettier-plugin-organize-imports",
    "prettier-plugin-tailwindcss", // MUST come last
    "prettier-plugin-tailwind-styled-components" // MUST come last
  ]
}
```

## Migrating from v0 version

This plugin now relies entirely on the `prettier-plugin-tailwindcss` plugin. You have to add it as a dev-dependency in your `package.json` and add it to your Prettier configuration file plugin section as specified in the [installation](#installation) section.
