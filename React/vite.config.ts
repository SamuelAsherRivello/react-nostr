import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import cleanPlugin from 'vite-plugin-clean'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets',
          dest: 'src/'
        }
      ]
    }),
    cleanPlugin({
      targetFiles: ['dist/assets']
    }) as any // This is not working to delete the EXTRA /dist/assets/
  ],
  base: './',
  server: {
    port: 3000,
  },
});