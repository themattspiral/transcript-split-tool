import { defineConfig, PluginOption, ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import dotenv from 'dotenv';

import packageJson from './package.json';
import { mockServer } from './cloud-function-mocks/mock-server';

// define a mock express server to handle cloud function requests,
// and configure it as a vite server middleware plugin
const mockServerPlugin = () => {
  return {
    name: 'mock-cloud-functions',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(mockServer);
    },
  };
}

const plugins: PluginOption[] = [
  react(),
  tailwindcss(),
  mockServerPlugin()
];

const define: Record<string, string> = {
  'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
};

if (process.argv?.includes('--ssl')) {
  plugins.push(basicSsl());

  const dotEnvVars: { [varKey: string]: string} = {};
  dotenv.config({ processEnv: dotEnvVars, path: ['.env.development'] });
  define['import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_ORIGIN'] = JSON.stringify(dotEnvVars.TST_OAUTH_GOOGLE_REDIRECT_ORIGIN.replace('http', 'https'));

  console.log('🔐 Local SSL Enabled');
}

export default defineConfig({
  resolve: {
    alias: {
      'cloud-functions': '/cloud-functions',
      'data': '/src/shared/data',
      'components': '/src/shared/components',
      'context': '/src/context',
      'pages': '/src/pages',
    },
  },
  plugins,
  server: {
    // these routes will be handled by mockServerPlugin, but we define them here in the proxy config
    // to ensure they aren't handled by vite as a default route that returns the SPA
    proxy: {
      '/oauth-exchange': {},
      '/oauth-refresh': {},
      '/oauth-revoke': {},
      '/admin-sess': {},
      '/admin-expire-sess': {}
    },
    watch: {
      ignored: [
        '**/mock-session-store.json'
      ],
    },
  },
  define,
  envPrefix: 'TST_'
});
