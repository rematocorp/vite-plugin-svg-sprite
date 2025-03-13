import p from 'path';
import fs from 'fs';
import crypto from 'crypto';
import micromatch from 'micromatch';
import SVGCompiler from 'svg-baker';
import { optimize, OptimizeOptions as SvgoOptimizeOptions } from 'svgo';
import { Plugin } from 'vite';
// eslint-disable-next-line import/no-extraneous-dependencies
import { globSync } from 'glob';

const { stringify } = JSON;

export type { SvgoOptimizeOptions };

export interface SvgSpriteOptions {
  include?: string[] | string;
  symbolId?: string;
  svgo?: boolean | SvgoOptimizeOptions;
  inline?: boolean; // New option to specify inline vs external sprite
}

export default (options: SvgSpriteOptions = {}): Plugin => {
  // eslint-disable-next-line no-param-reassign
  options.inline = options?.inline ?? true;
  const svgCompiler = new SVGCompiler();
  const match = options?.include ?? '**/*.svg';
  const svgoOptions = options?.svgo;
  let spriteHash = '';
  let spriteContent = '';

  async function generateSprite() {
    const sprites = await svgCompiler.compile();
    if (sprites.length > 0) {
      const sprite = sprites[0];
      spriteContent = sprite.render();
    }
  }

  return {
    name: 'svg-sprite',
    buildStart() {
      const includedFiles = options.include || [];
      const hash = crypto.createHash('sha256');
      // eslint-disable-next-line no-restricted-syntax
      for (const include of includedFiles) {
        const files = globSync(include);
        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8');
          hash.update(content);
        }
      }
      spriteHash = hash.digest('hex').slice(0, 6);
    },
    async buildEnd() {
      if (!options?.inline) {
        await generateSprite();
        this.emitFile({
          type: 'asset',
          fileName: `sprite-${spriteHash}.svg`,
          source: spriteContent,
        });
      }
    },
    async transform(src, filepath) {
      if (!micromatch.isMatch(filepath, match, {
        dot: true,
      })) {
        return undefined;
      }

      let code = await fs.promises.readFile(filepath, 'utf-8');
      const { name } = p.parse(filepath);
      if (svgoOptions !== false) {
        const result = optimize(code, svgoOptions === true ? undefined : svgoOptions);
        if (result.error != null) {
          throw new Error(result.error);
        }
        code = result.data;
      }
      let id = name;
      if (options?.symbolId) {
        id = options.symbolId;
        if (id.includes('[hash]')) {
          const hash = crypto.createHash('sha256');
          hash.update(code);
          id = id.replace(/\[hash\]/g, hash.digest('hex').slice(0, 6));
        }
        id = id.replace(/\[name\]/g, name);
      }
      const symbol = await svgCompiler.addSymbol({
        id,
        content: code,
        path: filepath,
      });
      // return the URL of the sprite if external, otherwise return the inline SVG
      if (options?.inline) {
        return `import addSymbol from '@remato/vite-plugin-svg-sprite/runtime'; addSymbol(${stringify(symbol.render())}, ${stringify(id)}); export default { id: ${stringify(id)} };`;
      }
      return `import addSymbol from '@remato/vite-plugin-svg-sprite/runtime'; addSymbol(${stringify(symbol.render())}, ${stringify(id)}); export default { id: ${stringify(id)}, url: ${stringify(`/sprite-${spriteHash}.svg#${id}`)} };`;
    },
  };
};
