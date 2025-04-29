#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Start the server in the background
echo "Starting server..."
node dist/router.js &
SERVER_PID=$!

# Start ngrok in the background
echo "Starting ngrok..."
ngrok http 3000 &
NGROK_PID=$!

# Function to clean up background processes on script exit
cleanup() {
    echo "Stopping processes..."
    kill $SERVER_PID
    kill $NGROK_PID
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Wait for both processes
wait $SERVER_PID $NGROK_PID 