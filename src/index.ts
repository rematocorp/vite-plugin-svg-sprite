import p from 'path';
import fs from 'fs';
import crypto from 'crypto';
import micromatch from 'micromatch';
import SVGCompiler from 'svg-baker';
import { optimize, OptimizeOptions as SvgoOptimizeOptions } from 'svgo';
import { Plugin } from 'vite';

const { stringify } = JSON;

export type { SvgoOptimizeOptions };
export interface SvgSpriteOptions {
  include?: string[] | string;
  symbolId?: string;
  svgo?: boolean | SvgoOptimizeOptions;
}

export default (options?: SvgSpriteOptions) => {
  const svgCompiler = new SVGCompiler();
  const match = options?.include ?? '**.svg';
  const svgoOptions = options?.svgo;

  const plugin: Plugin = {
    name: 'svg-sprite',

    async transform(src, filepath) {
      if (!micromatch.isMatch(filepath, match, {
        dot: true,
      })) {
        return undefined;
      }

      let code = await fs.promises.readFile(filepath, 'utf-8');
      const { name } = p.parse(filepath);
      if (svgoOptions !== false) {
        const result = (optimize(code, svgoOptions === true ? undefined : svgoOptions));
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

      return `
        import addSymbol from '@remato/vite-plugin-svg-sprite/runtime';
        addSymbol(${stringify(symbol.render())}, ${stringify(id)});
        export default {id: ${stringify(id)}};
      `;
    },
  };

  return plugin;
};
