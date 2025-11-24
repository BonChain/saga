# SuiSaga Frontend Environment Variables

This document explains the environment variables used by the SuiSaga frontend application.

## Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your configuration.

3. The variables will be automatically loaded by Vite during development and build.

## Available Variables

### 🌐 API Configuration

**VITE_API_BASE_URL**
- **Default:** `http://localhost:3001/api/auth`
- **Description:** Base URL for the authentication API endpoints
- **Example:** `https://api.suisaga.io/auth` (production)

### ⛓️ Sui Blockchain Configuration

**VITE_SUI_NETWORK**
- **Default:** `testnet`
- **Options:** `devnet`, `testnet`, `mainnet`
- **Description:** Sui blockchain network to connect to
- **Example:** `mainnet` for production deployment

**VITE_PREFERRED_WALLETS**
- **Default:** `Sui Wallet,Suiet`
- **Description:** Comma-separated list of preferred wallet names
- **Example:** `Sui Wallet,Suiet,Polymedia`

**VITE_AUTO_CONNECT**
- **Default:** `true`
- **Options:** `true`, `false`
- **Description:** Automatically connect wallet on page load
- **Example:** `false` to require manual connection

### 🔐 Authentication Configuration

**VITE_AUTH_TIMEOUT**
- **Default:** `30000`
- **Description:** Authentication request timeout in milliseconds
- **Example:** `60000` (60 seconds)

**VITE_SESSION_STORAGE_KEY**
- **Default:** `suisaga_auth_token`
- **Description:** localStorage key for storing JWT tokens
- **Example:** `suisaga_session_token`

### 🎨 UI Configuration

**VITE_ENABLE_ANIMATIONS**
- **Default:** `true`
- **Options:** `true`, `false`
- **Description:** Enable retro gaming animations and effects
- **Example:** `false` for better performance on low-end devices

### 🐛 Development Configuration

**VITE_DEV_MODE**
- **Default:** `true`
- **Options:** `true`, `false`
- **Description:** Enable development-specific features
- **Example:** `false` for production-like development

**VITE_ENABLE_DEBUG_LOGGING**
- **Default:** `false`
- **Options:** `true`, `false`
- **Description:** Enable verbose console logging
- **Example:** `true` for debugging authentication issues

## Environment Examples

### Development (Local Backend)
```env
VITE_API_BASE_URL=http://localhost:3001/api/auth
VITE_SUI_NETWORK=testnet
VITE_AUTO_CONNECT=true
VITE_DEV_MODE=true
VITE_ENABLE_DEBUG_LOGGING=false
```

### Staging (Remote Backend)
```env
VITE_API_BASE_URL=https://staging-api.suisaga.io/auth
VITE_SUI_NETWORK=testnet
VITE_AUTO_CONNECT=true
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG_LOGGING=false
```

### Production
```env
VITE_API_BASE_URL=https://api.suisaga.io/auth
VITE_SUI_NETWORK=mainnet
VITE_AUTO_CONNECT=true
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG_LOGGING=false
```

## Security Notes

- **Never commit `.env.local`** to version control
- **Use different API URLs** for development, staging, and production
- **Keep sensitive values** secure in production environments
- **Review environment variables** before deploying to ensure no development URLs are exposed

## Vite Environment Variables

All variables must be prefixed with `VITE_` to be accessible in the browser:
- ✅ `VITE_API_URL` - Available in browser code
- ❌ `API_URL` - NOT available in browser code

For more information, see the [Vite Environment Variables documentation](https://vitejs.dev/guide/env-and-mode.html).

## Troubleshooting

### "API not responding" errors
1. Check that `VITE_API_BASE_URL` matches your backend server
2. Verify the backend server is running on the expected port
3. Check for CORS issues if using different domains

### "Wallet connection failed" errors
1. Verify `VITE_SUI_NETWORK` matches your wallet's network
2. Check that your wallet extension is installed and enabled
3. Ensure `VITE_AUTO_CONNECT` is set correctly

### "Authentication timeout" errors
1. Increase `VITE_AUTH_TIMEOUT` if your server is slow
2. Check your network connection
3. Verify the backend server is responding quickly