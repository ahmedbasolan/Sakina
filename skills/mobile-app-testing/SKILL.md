---
name: mobile-app-testing
description: Toolkit for testing React Native and mobile applications using Playwright and Expo. Supports verifying mobile UI functionality, debugging navigation flows, testing content loading, and capturing device screenshots. Optimized for Islamic Guidance App testing including mood selection, guidance display, and database interactions.
license: Complete terms in LICENSE.txt
---

# Mobile App Testing

To test your Islamic Guidance App and other React Native applications, use Playwright automation with mobile device emulation.

**Helper Scripts Available:**

- `scripts/expo-test-runner.py` - Manages Expo server lifecycle and testing
- `scripts/device-emulator.py` - Mobile device emulation and screenshot capture
- `scripts/navigation-tester.py` - Automated navigation flow testing

**Always run scripts with `--help` first** to see usage. These scripts are designed as black-box tools to avoid context pollution.

## Islamic Guidance App Testing Scenarios

### Critical User Flows to Test

1. **Mood Selection Flow**
   - Launch app → Select mood → Verify guidance loads
   - Test all mood options (anxious, guilty, grateful, etc.)
   - Verify Islamic terms display correctly

2. **Guidance Screen Display**
   - Verify premium UI renders correctly
   - Test quote typography and spacing
   - Check save/share functionality
   - Test "Change mood" navigation

3. **Database Operations**
   - Test content loading from SQLite
   - Verify anti-repetition logic
   - Test save reflection functionality

## Decision Tree: Choosing Your Approach

```
Testing Task → Is Expo server running?
    ├─ No → Run: python scripts/expo-test-runner.py --help
    │        Then use the helper + write test script
    │
    └─ Yes → Direct testing approach:
            1. Launch browser with mobile viewport
            2. Navigate to Expo URL
            3. Wait for app to load
            4. Execute test scenarios
```

## Example: Testing Mood Selection

```bash
# Start Expo and run mood selection tests
python scripts/expo-test-runner.py \
  --expo-url "http://localhost:8084" \
  --test-script "test_mood_selection.py"
```

**Test Script Example:**

```python
from playwright.sync_api import sync_playwright

def test_mood_selection():
    with sync_playwright() as p:
        # Mobile device emulation
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},  # iPhone X
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        )
        page = context.new_page()

        # Navigate to Expo app
        page.goto('http://localhost:8084')
        page.wait_for_load_state('networkidle')

        # Test mood selection
        mood_buttons = page.locator('[data-testid="mood-button"]')
        expect(mood_buttons).to_have_count(6)

        # Select "Anxious" mood
        mood_buttons.first.click()
        page.wait_for_timeout(2000)

        # Verify guidance screen loads
        guidance_title = page.locator('[data-testid="guidance-title"]')
        expect(guidance_title).to_be_visible()

        browser.close()
```

## Device Emulation

### Supported Devices

- **iPhone X** (375x812) - Primary testing device
- **iPhone 12** (390x844) - Larger iPhone testing
- **Pixel 5** (393x851) - Android testing
- **iPad** (768x1024) - Tablet testing

### Responsive Testing

```python
# Test different screen sizes
devices = [
    {'width': 375, 'height': 812, 'name': 'iPhone X'},
    {'width': 390, 'height': 844, 'name': 'iPhone 12'},
    {'width': 393, 'height': 851, 'name': 'Pixel 5'}
]

for device in devices:
    context = browser.new_context(
        viewport=device,
        user_agent=get_mobile_ua(device['name'])
    )
    # Run tests on each device
```

## Navigation Flow Testing

### Automated Flow Testing

```python
def test_complete_user_flow():
    # 1. Launch app
    # 2. Select mood
    # 3. View guidance
    # 4. Test save functionality
    # 5. Test share functionality
    # 6. Test change mood navigation
    # 7. Return to home
```

### Performance Testing

- **Load Time Testing** - Measure app initialization
- **Content Loading** - Test database query performance
- **Animation Performance** - Verify smooth transitions

## Screenshot Capture

### Visual Regression Testing

```python
# Capture screenshots for visual comparison
page.screenshot(path='screenshots/home_screen.png', full_page=True)
page.screenshot(path='screenshots/guidance_screen.png', full_page=True)
```

### Device-Specific Screenshots

```python
# Test on multiple devices
for device in devices:
    page.set_viewport_size(device)
    screenshot_name = f"screenshots/{device['name']}_home.png"
    page.screenshot(path=screenshot_name)
```

## Best Practices

### Testing Strategy

1. **Start with happy paths** - Test ideal user flows first
2. **Add edge cases** - Test error conditions and edge cases
3. **Performance monitoring** - Track load times and responsiveness
4. **Visual consistency** - Ensure UI consistency across devices

### Common Pitfalls

❌ **Don't** test before waiting for `networkidle`
❌ **Don't** ignore device-specific behaviors
❌ **Don't** forget to test Arabic text rendering

✅ **Do** test on multiple screen sizes
✅ **Do** verify database operations
✅ **Do** test offline functionality

## Reference Files

- **examples/** - Test examples:
  - `mood_selection_test.py` - Complete mood selection flow
  - `guidance_display_test.py` - Guidance screen rendering
  - `database_operations_test.py` - SQLite testing
  - `responsive_design_test.py` - Multi-device testing

## Islamic Content Testing

### Arabic Text Rendering

- Verify Arabic fonts display correctly
- Test RTL (right-to-left) text direction
- Check text alignment in guidance content

### Cultural Sensitivity

- Verify Islamic terms display respectfully
- Test color schemes for cultural appropriateness
- Verify content accuracy and proper attribution

## Troubleshooting

### Common Issues

1. **Expo server not running** - Use expo-test-runner.py
2. **App not loading** - Wait for networkidle state
3. **Selectors not found** - Use data-testid attributes
4. **Flaky tests** - Add proper waits and retries

### Debug Mode

```python
# Run tests in headed mode for debugging
browser = p.chromium.launch(headless=False, slow_mo=1000)
```
