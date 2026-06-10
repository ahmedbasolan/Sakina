# 📏 Coding Standards & Guidelines

## 🎯 **Overview**
This document outlines the coding standards and best practices for the Guidance app to ensure consistency, maintainability, and quality across the codebase.

## 📁 **File Organization**

### **Directory Structure**
```
src/
├── components/          # Reusable UI components
│   ├── __tests__/      # Component tests
│   └── *.tsx          # Component files
├── screens/            # Screen components
│   ├── __tests__/      # Screen tests
│   └── *.tsx          # Screen files
├── services/           # Business logic services
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── constants/          # App constants
├── types/              # TypeScript type definitions
├── theme/              # Design system
├── context/            # React contexts
├── navigation/         # Navigation configuration
└── database/           # Database schema and queries
```

### **File Naming**
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUserData.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`)
- **Constants**: camelCase (e.g., `apiConfig.ts`)
- **Types**: camelCase (e.g., `userTypes.ts`)

## 🎨 **Code Style**

### **React Components**
```tsx
// ✅ Good
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Component logic
  }, [userId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.name}>{user?.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14100C',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5EDE3',
  },
});
```

### **TypeScript Best Practices**
```tsx
// ✅ Use proper interfaces and types
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

// ✅ Use union types for enums
type Mood = 'Overwhelmed' | 'Sad' | 'Angry' | 'Tired' | 'Lonely' | 'Grateful' | 'Hopeful' | 'Guilty' | 'Calm';

// ✅ Use generic types where appropriate
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ✅ Use proper function signatures
const fetchUser = async (id: string): Promise<User> => {
  // Implementation
};
```

### **Import Organization**
```tsx
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. React Native imports
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 4. Internal imports (grouped by type)
import { User, Mood } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils';
import { Colors, Typography } from '../theme/DesignSystem';
import { UserProfile } from '../components/UserProfile';
```

## 🔧 **Error Handling**

### **Error Boundaries**
```tsx
// ✅ Wrap components with error boundaries
<ErrorBoundaryEnhanced context="UserProfile">
  <UserProfile userId={userId} />
</ErrorBoundaryEnhanced>
```

### **Async Error Handling**
```tsx
// ✅ Use try-catch with proper error handling
const loadUserData = async (userId: string) => {
  try {
    const response = await userService.fetchUser(userId);
    setUser(response.data);
  } catch (error) {
    console.error('Failed to load user:', error);
    // Show user-friendly error message
    Alert.alert('Error', 'Failed to load user data. Please try again.');
  }
};
```

### **Validation**
```tsx
// ✅ Use validation utilities
const { isValid, errors } = validateEmail(email);
if (!isValid) {
  setErrors(errors);
  return;
}
```

## 🎯 **Performance Best Practices**

### **React Optimization**
```tsx
// ✅ Use React.memo for expensive components
export const UserProfileCard = React.memo<UserProfileCardProps>(({ user }) => {
  return <View>{/* Component content */}</View>;
});

// ✅ Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// ✅ Use useCallback for stable function references
const handlePress = useCallback(() => {
  onPress(item.id);
}, [onPress, item.id]);
```

### **Animation Performance**
```tsx
// ✅ Always use useNativeDriver for transform animations
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Required for transform animations
}).start();
```

### **FlatList Optimization**
```tsx
// ✅ Use FlatList for long lists
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## 🧪 **Testing**

### **Component Testing**
```tsx
// ✅ Test component behavior
import { render, fireEvent, screen } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  it('renders user name correctly', () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('calls onUpdate when update button is pressed', () => {
    const mockOnUpdate = jest.fn();
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    render(<UserProfile user={mockUser} onUpdate={mockOnUpdate} />);
    
    fireEvent.press(screen.getByText('Update'));
    expect(mockOnUpdate).toHaveBeenCalled();
  });
});
```

### **Hook Testing**
```tsx
// ✅ Test custom hooks
import { renderHook, act } from '@testing-library/react-hooks';
import { useUserData } from '../useUserData';

describe('useUserData', () => {
  it('loads user data on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useUserData('1'));
    
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeDefined();
  });
});
```

## 🎨 **Design System**

### **Consistent Styling**
```tsx
// ✅ Use design system tokens
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.wide,
  },
});
```

### **Accessibility**
```tsx
// ✅ Add accessibility props
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Save user profile"
  accessibilityHint="Saves your profile changes"
  accessibilityRole="button"
  onPress={handleSave}
>
  <Text>Save</Text>
</TouchableOpacity>
```

## 📝 **Documentation**

### **Component Documentation**
```tsx
/**
 * User profile card component
 * 
 * @param user - User data to display
 * @param onUpdate - Callback when user is updated
 * @param editable - Whether the profile can be edited
 * 
 * @example
 * <UserProfile 
 *   user={userData} 
 *   onUpdate={handleUpdate}
 *   editable={true}
 * />
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdate,
  editable = false,
}) => {
  // Component implementation
};
```

### **Function Documentation**
```tsx
/**
 * Formats a timestamp into a readable date string
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "JAN 15")
 * 
 * @example
 * formatDate(1642248000000); // "JAN 15"
 */
export const formatDate = (timestamp: number): string => {
  // Implementation
};
```

## 🚀 **Git Workflow**

### **Commit Messages**
```
feat: add user profile screen
fix: resolve crash on empty user list
docs: update API documentation
style: format code with prettier
refactor: extract user service logic
test: add unit tests for user utils
chore: update dependencies
```

### **Branch Naming**
```
feature/user-profile
fix/login-crash
docs/api-updates
hotfix/critical-bug
```

## 🔍 **Code Review Checklist**

### **Before Submitting PR**
- [ ] Code follows style guidelines
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] Performance optimizations are applied
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Accessibility is considered
- [ ] No console.error statements
- [ ] Unused imports are removed
- [ ] Code is self-documenting

### **During Code Review**
- [ ] Logic is correct and efficient
- [ ] Edge cases are handled
- [ ] Security considerations are addressed
- [ ] User experience is considered
- [ ] Code is maintainable and extensible

## 📚 **Resources**

- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro)
- [Expo Documentation](https://docs.expo.dev/)

---

**Remember**: Clean code is not written once, it's evolved through continuous refactoring and improvement. 🌟
