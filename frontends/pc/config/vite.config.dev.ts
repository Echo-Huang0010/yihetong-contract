import { mergeConfig, type Plugin, type ViteDevServer } from 'vite';
import eslint from 'vite-plugin-eslint';
import baseConfig from './vite.config.base';

function pcAdminHistoryFallbackPlugin(): Plugin {
  return {
    name: 'pc-admin-history-fallback',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        const pathname = (req.url || '').split('?')[0];
        const acceptsHtml = String(req.headers.accept || '').includes(
          'text/html'
        );
        const isFrontendRoute =
          req.method === 'GET' &&
          acceptsHtml &&
          !pathname.includes('.') &&
          !pathname.startsWith('/@') &&
          !pathname.startsWith('/src/') &&
          !pathname.startsWith('/node_modules/') &&
          !pathname.startsWith('/api/') &&
          !pathname.startsWith('/pf/') &&
          !pathname.startsWith('/mgt/');

        if (isFrontendRoute) {
          req.url = '/index.html';
        }
        next();
      });
    },
  };
}

export default mergeConfig(
  {
    mode: 'development',
    server: {
      open: true,
      fs: {
        strict: true,
      },
    },
    plugins: [
      pcAdminHistoryFallbackPlugin(),
      eslint({
        cache: false,
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
        exclude: ['node_modules'],
      }),
    ],
  },
  baseConfig
);
