import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Determine API URL based on environment
  const isProduction = mode === 'production'
  const apiUrl = isProduction
    ? env.VITE_PROD_API_URL || 'https://api.suisaga.com'
    : env.VITE_DEV_API_URL || 'http://localhost:3001'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    define: {
      // Make environment variables available to the app
      __APP_ENV__: JSON.stringify(mode),
      __API_URL__: JSON.stringify(apiUrl),
    },
    server: {
      port: parseInt(env.PORT) || 5173,
      host: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // Set environment variables for production build
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            sui: ['@mysten/dapp-kit', '@tanstack/react-query'],
          }
        }
      }
    },
    optimizeDeps: {
      include: ['@mysten/dapp-kit', '@tanstack/react-query']
    },
    // Environment-specific settings
    ...(isProduction && {
      define: {
        __DEV__: false
      }
    }),
    ...(!isProduction && {
      define: {
        __DEV__: true
      }
    })
  }
})
