
import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import dotenv from 'dotenv';

import packageJson from './package.json';

const plugins: PluginOption[] = [
    react(),
    tailwindcss()
];

const define: Record<string, string> = {
  'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
};

if (process.argv?.includes('--ssl')) {
  plugins.push(basicSsl());

  const dotEnvVars: { [varKey: string]: string} = {};
  dotenv.config({ processEnv: dotEnvVars, path: ['.env.development'] });
  define['import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_URI'] = JSON.stringify(dotEnvVars.TST_OAUTH_GOOGLE_REDIRECT_URI.replace('http', 'https'));

  console.log('Local SSL Enabled');
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/google-accounts': {
        target: 'https://accounts.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/google-accounts/, '')
      },
      '/google-api': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/google-api/, '')
      }
    }
  },
  plugins,
  define,
  envPrefix: 'TST_'
});
