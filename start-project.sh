#!/bin/bash

echo "========================================"
echo "    LPRT Property Management System"
echo "========================================"
echo ""
echo "Starting both frontend and backend servers..."
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "Error: npm is not installed!"
    echo "Please install npm or use a Node.js version that includes npm"
    exit 1
fi

echo "[1/3] Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies!"
    exit 1
fi

echo "[2/3] Installing backend dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies!"
    exit 1
fi

echo "[3/3] Starting servers..."
echo ""
echo "Starting backend server on port 5000..."

# Start backend server in background
npm run dev &
BACKEND_PID=$!

echo "Starting frontend server on port 5173..."
cd ..

# Start frontend server in background
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Servers are starting up!"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "========================================"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait