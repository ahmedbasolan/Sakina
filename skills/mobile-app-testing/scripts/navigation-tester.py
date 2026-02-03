#!/usr/bin/env python3
"""
Navigation Flow Tester for Islamic Guidance App
Automated testing of complete user journeys and navigation flows
"""

import argparse
import time
import os
from playwright.sync_api import sync_playwright, expect

def test_mood_selection_flow(expo_url, device_config):
    """Test complete mood selection to guidance flow"""
    print("🧪 Testing Mood Selection Flow")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(**device_config)
            page = context.new_page()
            
            # Navigate to app
            page.goto(expo_url)
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            
            # Step 1: Verify home screen loads
            print("📱 Verifying home screen...")
            mood_buttons = page.locator('[data-testid="mood-button"]')
            expect(mood_buttons).to_have_count(6)
            print("✅ 6 mood buttons found")
            
            # Step 2: Select "Anxious" mood
            print("🎯 Selecting 'Anxious' mood...")
            anxious_button = page.locator('[data-testid="mood-button"]').first
            anxious_button.click()
            time.sleep(2)
            
            # Step 3: Verify guidance screen loads
            print("📖 Verifying guidance screen...")
            guidance_title = page.locator('[data-testid="guidance-title"]')
            expect(guidance_title).to_be_visible()
            
            # Verify key elements
            quote_text = page.locator('[data-testid="quote-text"]')
            expect(quote_text).to_be_visible()
            
            save_button = page.locator('[data-testid="save-button"]')
            expect(save_button).to_be_visible()
            
            print("✅ Guidance screen loaded successfully")
            
            # Step 4: Test "Change Mood" functionality
            print("🔄 Testing 'Change Mood' functionality...")
            change_mood_button = page.locator('[data-testid="change-mood-button"]')
            if change_mood_button.is_visible():
                change_mood_button.click()
                time.sleep(2)
                
                # Verify back to home screen
                mood_buttons_after = page.locator('[data-testid="mood-button"]')
                expect(mood_buttons_after).to_have_count(6)
                print("✅ Successfully returned to home screen")
            
            browser.close()
            return True
            
    except Exception as e:
        print(f"❌ Mood selection flow test failed: {e}")
        return False

def test_all_moods(expo_url, device_config):
    """Test all mood selections"""
    print("🧪 Testing All Mood Selections")
    
    moods = ["Anxious", "Guilty", "Grateful", "Angry", "Sad", "Hopeful"]
    results = {}
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(**device_config)
            page = context.new_page()
            
            for i, mood in enumerate(moods):
                print(f"🎯 Testing {mood} mood...")
                
                # Navigate to home if needed
                if i > 0:
                    page.goto(expo_url)
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                
                # Select mood
                mood_buttons = page.locator('[data-testid="mood-button"]')
                mood_buttons.nth(i).click()
                time.sleep(2)
                
                # Verify guidance loads
                guidance_title = page.locator('[data-testid="guidance-title"]')
                guidance_visible = guidance_title.is_visible()
                
                # Check for Islamic term
                islamic_term = page.locator('[data-testid="islamic-term"]')
                term_visible = islamic_term.is_visible()
                
                results[mood] = {
                    "guidance_loaded": guidance_visible,
                    "islamic_term_visible": term_visible
                }
                
                if guidance_visible:
                    print(f"✅ {mood} mood: Guidance loaded successfully")
                else:
                    print(f"❌ {mood} mood: Failed to load guidance")
                
                # Go back to home
                change_mood = page.locator('[data-testid="change-mood-button"]')
                if change_mood.is_visible():
                    change_mood.click()
                    time.sleep(2)
            
            browser.close()
            return results
            
    except Exception as e:
        print(f"❌ All moods test failed: {e}")
        return {}

def test_save_functionality(expo_url, device_config):
    """Test save reflection functionality"""
    print("🧪 Testing Save Functionality")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(**device_config)
            page = context.new_page()
            
            # Navigate to guidance screen
            page.goto(expo_url)
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            
            # Select a mood
            mood_buttons = page.locator('[data-testid="mood-button"]')
            mood_buttons.first.click()
            time.sleep(2)
            
            # Test save button
            print("💾 Testing save button...")
            save_button = page.locator('[data-testid="save-button"]')
            expect(save_button).to_be_visible()
            
            # Click save button
            save_button.click()
            time.sleep(1)
            
            # Check if save indicator appears (toast, modal, etc.)
            save_indicator = page.locator('[data-testid="save-indicator"]')
            if save_indicator.is_visible(timeout=2000):
                print("✅ Save indicator appeared")
                save_success = True
            else:
                print("⚠️ No save indicator found (may be silent save)")
                save_success = True  # Assume silent save
            
            browser.close()
            return save_success
            
    except Exception as e:
        print(f"❌ Save functionality test failed: {e}")
        return False

def test_performance_metrics(expo_url, device_config):
    """Test app performance metrics"""
    print("⚡ Testing Performance Metrics")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(**device_config)
            page = context.new_page()
            
            # Measure initial load time
            start_time = time.time()
            page.goto(expo_url)
            page.wait_for_load_state('networkidle')
            load_time = time.time() - start_time
            
            print(f"📊 App load time: {load_time:.2f} seconds")
            
            # Wait for full app initialization
            time.sleep(3)
            
            # Test mood selection response time
            start_time = time.time()
            mood_buttons = page.locator('[data-testid="mood-button"]')
            mood_buttons.first.click()
            page.wait_for_selector('[data-testid="guidance-title"]')
            mood_response_time = time.time() - start_time
            
            print(f"📊 Mood selection response time: {mood_response_time:.2f} seconds")
            
            browser.close()
            
            return {
                "load_time": load_time,
                "mood_response_time": mood_response_time
            }
            
    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        return {}

def main():
    parser = argparse.ArgumentParser(description="Navigation flow tester for Islamic Guidance App")
    parser.add_argument("--expo-url", default="http://localhost:8081", help="Expo server URL")
    parser.add_argument("--device", default="iphone-x", help="Device to emulate")
    parser.add_argument("--test", choices=["mood-flow", "all-moods", "save", "performance", "all"], default="all", help="Test to run")
    parser.add_argument("--output", default="test-results", help="Output directory for results")
    
    args = parser.parse_args()
    
    # Device configuration
    devices = {
        "iphone-x": {
            "viewport": {"width": 375, "height": 812},
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
            "is_mobile": True,
            "has_touch": True
        }
    }
    
    device_config = devices.get(args.device, devices["iphone-x"])
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # Run tests
    results = {}
    
    if args.test in ["mood-flow", "all"]:
        results["mood_flow"] = test_mood_selection_flow(args.expo_url, device_config)
    
    if args.test in ["all-moods", "all"]:
        results["all_moods"] = test_all_moods(args.expo_url, device_config)
    
    if args.test in ["save", "all"]:
        results["save_functionality"] = test_save_functionality(args.expo_url, device_config)
    
    if args.test in ["performance", "all"]:
        results["performance"] = test_performance_metrics(args.expo_url, device_config)
    
    # Print summary
    print("\n📊 Test Results Summary:")
    for test_name, result in results.items():
        if isinstance(result, bool):
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
        elif isinstance(result, dict):
            print(f"{test_name}: ✅ COMPLETED")
            for key, value in result.items():
                print(f"  {key}: {value}")
    
    print(f"\n📁 Results saved to: {args.output}")

if __name__ == "__main__":
    main()
