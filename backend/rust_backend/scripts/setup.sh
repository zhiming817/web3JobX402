#!/bin/bash

# ResumeVault Backend 快速启动脚本

echo "🚀 Starting ResumeVault Backend Setup..."
echo ""

# 检查是否存在 .env_server 文件
if [ ! -f ".env_server" ]; then
    echo "📝 Creating .env_server configuration file..."
    cat > .env_server << 'EOF'
# Facilitator URL
FACILITATOR_URL=https://facilitator.x402.org

# Your Solana wallet address (REPLACE THIS!)
ADDRESS=YOUR_WALLET_ADDRESS_HERE

# Network configuration
NETWORK=solana-devnet

# Token configuration (USDC on devnet)
TOKEN_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
TOKEN_DECIMALS=6
TOKEN_NAME=USDC

# Server configuration
HOST=127.0.0.1
PORT=4021
EOF
    echo "✅ .env_server file created"
    echo "⚠️  Please update the ADDRESS field in .env_server with your wallet address"
    echo ""
fi

# 检查 Rust 是否安装
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "📦 Installing dependencies..."
cargo build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Ready to start! Run one of these commands:"
    echo ""
    echo "  cargo run              # Start the server"
    echo "  cargo watch -x run     # Start with auto-reload (requires cargo-watch)"
    echo ""
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
