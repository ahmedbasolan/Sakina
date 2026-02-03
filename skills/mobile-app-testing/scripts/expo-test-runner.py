#!/usr/bin/env python3
"""
Expo Test Runner for Islamic Guidance App
Manages Expo server lifecycle and automated testing
"""

import argparse
import subprocess
import time
import sys
from pathlib import Path

def check_expo_server(url):
    """Check if Expo server is running"""
    try:
        import requests
        response = requests.get(url, timeout=5)
        return response.status_code == 200
    except:
        return False

def start_expo_server():
    """Start Expo server if not running"""
    print("🚀 Starting Expo server...")
    try:
        process = subprocess.Popen(
            ["npx", "expo", "start", "--web"],
            cwd=".",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to start
        for _ in range(30):  # Wait up to 30 seconds
            if check_expo_server("http://localhost:8081"):
                print("✅ Expo server started successfully")
                return process
            time.sleep(1)
        
        print("❌ Expo server failed to start")
        process.terminate()
        return None
    except Exception as e:
        print(f"❌ Error starting Expo server: {e}")
        return None

def run_test_script(test_script, expo_url):
    """Run the specified test script"""
    print(f"🧪 Running test script: {test_script}")
    
    try:
        # Set environment variable for Expo URL
        env = dict(**sys.environ, EXPO_URL=expo_url)
        
        result = subprocess.run(
            ["python", test_script],
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Tests passed successfully")
            print(result.stdout)
        else:
            print("❌ Tests failed")
            print(result.stderr)
        
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running test script: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Run Expo tests for Islamic Guidance App")
    parser.add_argument("--expo-url", default="http://localhost:8081", help="Expo server URL")
    parser.add_argument("--test-script", required=True, help="Test script to run")
    parser.add_argument("--start-server", action="store_true", help="Start Expo server if not running")
    parser.add_argument("--timeout", type=int, default=60, help="Timeout for server startup")
    
    args = parser.parse_args()
    
    # Check if Expo server is running
    if not check_expo_server(args.expo_url):
        if args.start_server:
            expo_process = start_expo_server()
            if not expo_process:
                sys.exit(1)
        else:
            print(f"❌ Expo server not running at {args.expo_url}")
            print("💡 Use --start-server to automatically start Expo")
            sys.exit(1)
    
    # Run the test script
    success = run_test_script(args.test_script, args.expo_url)
    
    # Cleanup
    if 'expo_process' in locals():
        expo_process.terminate()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
