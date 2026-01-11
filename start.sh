#!/bin/bash

echo "🏥 Starting medcAIr - AI Hospital Receptionist"
echo ""

# Check if node_modules exists for root
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if node_modules exists for client
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🚀 Starting server..."
echo "   Backend will run on: http://localhost:5000"
echo "   Frontend will run on: http://localhost:3000"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

# Start backend in background
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
cd client
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

