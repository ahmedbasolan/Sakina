#!/usr/bin/env python3
"""
Device Emulator for Mobile Testing
Provides mobile device emulation and screenshot capture for testing
"""

import argparse
import os
from playwright.sync_api import sync_playwright

# Mobile device configurations
DEVICES = {
    "iphone-x": {
        "name": "iPhone X",
        "viewport": {"width": 375, "height": 812},
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True
    },
    "iphone-12": {
        "name": "iPhone 12",
        "viewport": {"width": 390, "height": 844},
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True
    },
    "pixel-5": {
        "name": "Pixel 5",
        "viewport": {"width": 393, "height": 851},
        "user_agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36",
        "device_scale_factor": 2.625,
        "is_mobile": True,
        "has_touch": True
    },
    "ipad": {
        "name": "iPad",
        "viewport": {"width": 768, "height": 1024},
        "user_agent": "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        "device_scale_factor": 2,
        "is_mobile": True,
        "has_touch": True
    }
}

def capture_screenshots(expo_url, device_name, output_dir):
    """Capture screenshots on specified device"""
    device_config = DEVICES.get(device_name.lower())
    if not device_config:
        print(f"❌ Unknown device: {device_name}")
        print(f"Available devices: {', '.join(DEVICES.keys())}")
        return False
    
    print(f"📱 Capturing screenshots on {device_config['name']}")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(**device_config)
            page = context.new_page()
            
            # Navigate to Expo app
            print(f"🌐 Navigating to {expo_url}")
            page.goto(expo_url)
            page.wait_for_load_state('networkidle')
            
            # Wait for app to load
            time.sleep(3)
            
            # Capture full page screenshot
            screenshot_path = os.path.join(output_dir, f"{device_name.lower()}-full.png")
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved: {screenshot_path}")
            
            # Capture viewport screenshot
            viewport_path = os.path.join(output_dir, f"{device_name.lower()}-viewport.png")
            page.screenshot(path=viewport_path)
            print(f"📸 Viewport screenshot saved: {viewport_path}")
            
            browser.close()
            return True
            
    except Exception as e:
        print(f"❌ Error capturing screenshots: {e}")
        return False

def test_responsive_design(expo_url, output_dir):
    """Test responsive design across all devices"""
    print("🧪 Testing responsive design across all devices")
    
    results = {}
    for device_key, device_config in DEVICES.items():
        print(f"\n📱 Testing {device_config['name']}...")
        
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(**device_config)
                page = context.new_page()
                
                # Navigate to app
                page.goto(expo_url)
                page.wait_for_load_state('networkidle')
                time.sleep(3)
                
                # Check if key elements are visible
                mood_buttons = page.locator('[data-testid="mood-button"]').count()
                guidance_title = page.locator('[data-testid="guidance-title"]').is_visible()
                
                results[device_key] = {
                    "mood_buttons": mood_buttons,
                    "guidance_visible": guidance_title,
                    "screenshot": f"{device_key}-responsive.png"
                }
                
                # Capture screenshot
                screenshot_path = os.path.join(output_dir, results[device_key]["screenshot"])
                page.screenshot(path=screenshot_path, full_page=True)
                
                browser.close()
                
        except Exception as e:
            results[device_key] = {"error": str(e)}
    
    # Print results
    print("\n📊 Responsive Design Test Results:")
    for device_key, result in results.items():
        if "error" in result:
            print(f"❌ {device_key}: {result['error']}")
        else:
            print(f"✅ {device_key}: {result['mood_buttons']} mood buttons, guidance visible: {result['guidance_visible']}")
    
    return results

def main():
    parser = argparse.ArgumentParser(description="Mobile device emulator for testing")
    parser.add_argument("--expo-url", default="http://localhost:8081", help="Expo server URL")
    parser.add_argument("--device", help="Device to emulate (iphone-x, iphone-12, pixel-5, ipad)")
    parser.add_argument("--output", default="screenshots", help="Output directory")
    parser.add_argument("--test-responsive", action="store_true", help="Test responsive design on all devices")
    
    args = parser.parse_args()
    
    if args.test_responsive:
        test_responsive_design(args.expo_url, args.output)
    elif args.device:
        capture_screenshots(args.expo_url, args.device, args.output)
    else:
        print("❌ Please specify --device or --test-responsive")
        print(f"Available devices: {', '.join(DEVICES.keys())}")

if __name__ == "__main__":
    import time
    main()
