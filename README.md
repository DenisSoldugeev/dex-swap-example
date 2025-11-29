# DEX SWAP

A modern, terminal-styled decentralized exchange (DEX) swap interface for TON blockchain, powered by STON.fi.

## 🚀 Features

- **Simple Token Swaps**: Intuitive interface for swapping tokens on TON blockchain
- **Real-time Simulation**: Auto-simulation of swap outcomes with slippage protection
- **TonConnect Integration**: Secure wallet connection via TonConnect UI
- **Live Console Logs**: Real-time transaction tracking and detailed logging
- **Referral Support**: Built-in referral system for earning swap fees
- **Terminal UI**: Sleek, hacker-inspired terminal aesthetic with dark theme
- **Responsive Design**: Mobile-first approach with adaptive layouts

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **UI Framework**: Mantine v8
- **Routing**: TanStack Router
- **State Management**: TanStack Query (React Query)
- **Wallet**: TonConnect UI React
- **TON SDK**: @ton/core, @ton/ton
- **DEX Integration**: STON.fi SDK & API
- **Styling**: SCSS Modules + Mantine theming
- **Build Tool**: Vite

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### TonConnect Manifest

Update `public/tonconnect-manifest.json` with your app details:

```json
{
  "url": "https://your-app.com",
  "name": "Your App Name",
  "iconUrl": "https://your-app.com/icon.png",
  "termsOfUseUrl": "https://your-app.com/terms",
  "privacyPolicyUrl": "https://your-app.com/privacy"
}
```

### Referral Configuration

Edit referral settings in `src/shared/config/referral.ts`:

```typescript
export const REFERRAL_CONFIG = {
  referrerAddress: "YOUR_REFERRAL_ADDRESS",
  referrerFeeBps: 50, // 0.5% in basis points
};
```

## 🎯 Key Components

### SimpleSwapForm
The main swap interface with:
- Token selection with searchable dropdowns
- Amount input with validation
- Slippage tolerance configuration
- Auto-simulation on parameter changes
- Transaction submission via TonConnect

### Console Logger
Real-time logging system that tracks:
- Wallet connection/disconnection
- Asset loading
- Swap simulations
- Transaction status
- Blockchain explorer links

### Terminal Layout
Custom layout featuring:
- Connection status indicator
- Wallet address display
- Split-panel design (swap interface + console)
- Responsive grid system

## 🎨 Theming

The app uses a custom terminal-inspired theme with:
- **Primary Color**: Terminal Green (`#00ff41`)
- **Dark Mode**: Custom dark palette
- **Typography**: Monospace fonts (Fira Code, JetBrains Mono)
- **Components**: Styled inputs, buttons, and cards

## 📚 Project Structure

```
src/
├── app/                    # Application entry point
├── features/
│   ├── Console/           # Console logging system
│   ├── Swap/              # Swap forms and components
│   └── Wallet/            # Wallet connection UI
├── layout/                 # Layout components
├── router/                 # Route configuration
├── shared/
│   ├── api/               # API clients
│   ├── config/            # App configuration
│   ├── stonfi/            # STON.fi integration
│   ├── ton/               # TON blockchain utils
│   └── ui/                # Shared UI components
└── styles/                # Global styles and theme
```

## 🔐 Security

- No private keys stored in localStorage
- All transactions signed via TonConnect
- Slippage protection on all swaps
- Client-side simulation before execution

## 🚦 Development Scripts

```bash
# Type checking
npm run build

# Linting
npm run lint

# Generate SCSS type definitions
npm run gen:scss-types
```

## 📊 Swap Flow

1. **Select Tokens**: Choose from and to assets from STON.fi pools
2. **Enter Amount**: Specify the amount to swap
3. **Auto-Simulation**: System automatically simulates the swap
4. **Review Details**: Check expected output, slippage, and price impact
5. **Connect Wallet**: Use TonConnect to connect your TON wallet
6. **Execute Swap**: Sign and submit the transaction
7. **Track Status**: Monitor transaction in the console and on blockchain explorer

## 🌐 Blockchain Integration

- **Network**: TON Mainnet
- **DEX**: STON.fi
- **Assets**: Fetches liquid assets from STON.fi API
- **Transaction Building**: Uses STON.fi SDK for swap transactions
- **Gas Estimation**: Automatic gas calculation


## 🔗 Links

- [TON Blockchain](https://ton.org)
- [STON.fi](https://ston.fi)
- [TonConnect](https://github.com/ton-connect)
- [Mantine UI](https://mantine.dev)
