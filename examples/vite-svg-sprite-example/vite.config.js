import pluginVue from '@vitejs/plugin-vue';
import createSvgSpritePlugin from '@remato/vite-plugin-svg-sprite';

/**
 * @type { import('vite').UserConfig }
 */
const config = {
  plugins: [
    pluginVue(),
    createSvgSpritePlugin({
      include: '**/icons/**/*.svg',
      symbolId: '[name]', // if you need special name: symbolId: 'icon-[name]-[hash]'
    })],
};

export default config;
