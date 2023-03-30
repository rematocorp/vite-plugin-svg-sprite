# vite-plugin-svg-sprite
SVG sprite plugin for [Vite](https://github.com/vitejs/vite)

## install
```
npm i @remato/vite-plugin-svg-sprite -D
```

## Usage
vite.config.js:

```javascript
import createSvgSpritePlugin from '@remato/vite-plugin-svg-sprite';

const config = {
  plugins: [
    createSvgSpritePlugin({
      symbolId: 'icon-[name]-[hash]',
    }),
  ],
}
```

app code:
```javascript
import appIconId from './path/to/icons/app.svg';

// react or vue component, as you want
export default function App() {
  return (
    <svg>
      <use
        xlinkHref={`#${appIconId.id}`}
      />
    </svg>
  );
}
```

## options

```javascript
const plugin = createSvgSpritePlugin(options);
```

### `options.symbolId: string`

For generating the `id` attribute of `<symbol>` element. Defaults to `[name]`

### `options.include: string | string[]`

Match files that will be transformed. Defaults to `'**.svg'`. See [micromatch](https://github.com/micromatch/micromatch) for the syntax document.

### `options.svgo: boolean | SvgoOptions`

Enable [SVGO](https://github.com/svg/svgo) for optimizing SVG. Defaults to `true`.
