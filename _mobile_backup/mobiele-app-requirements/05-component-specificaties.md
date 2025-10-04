# Component Specificaties - Smans CRM Mobile App

## Design System & Styling

### 1. Design Tokens
```typescript
// src/constants/design.ts
export const DESIGN_TOKENS = {
  colors: {
    primary: '#007AFF',
    primaryDark: '#0056CC',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    
    // Grays
    gray50: '#F2F2F7',
    gray100: '#E5E5EA',
    gray200: '#D1D1D6',
    gray300: '#C7C7CC',
    gray400: '#AEAEB2',
    gray500: '#8E8E93',
    gray600: '#636366',
    gray700: '#48484A',
    gray800: '#3A3A3C',
    gray900: '#1C1C1E',
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#F2F2F7',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

### 2. Theme Provider
```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext } from 'react';
import { DESIGN_TOKENS } from '@/constants/design';

interface ThemeContextType {
  colors: typeof DESIGN_TOKENS.colors;
  spacing: typeof DESIGN_TOKENS.spacing;
  borderRadius: typeof DESIGN_TOKENS.borderRadius;
  fontSize: typeof DESIGN_TOKENS.fontSize;
  fontWeight: typeof DESIGN_TOKENS.fontWeight;
}

const ThemeContext = createContext<ThemeContextType>(DESIGN_TOKENS);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={DESIGN_TOKENS}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

## Core UI Components

### 1. Button Component
```typescript
// src/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}) => {
  const theme = useTheme();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(variant, theme, disabled),
      borderColor: getBorderColor(variant, theme, disabled),
      borderWidth: variant === 'outline' ? 1 : 0,
      paddingVertical: getPaddingVertical(size, theme),
      paddingHorizontal: getPaddingHorizontal(size, theme),
      borderRadius: theme.borderRadius.md,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.6 : 1,
    },
  ];

  const textStyles = [
    styles.text,
    {
      color: getTextColor(variant, theme, disabled),
      fontSize: getFontSize(size, theme),
      fontWeight: theme.fontWeight.semibold,
    },
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor(variant, theme, disabled)} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
});

// Helper functions
const getBackgroundColor = (variant: string, theme: any, disabled: boolean) => {
  if (disabled) return theme.colors.gray200;
  switch (variant) {
    case 'primary': return theme.colors.primary;
    case 'secondary': return theme.colors.secondary;
    case 'outline': return 'transparent';
    case 'ghost': return 'transparent';
    default: return theme.colors.primary;
  }
};

const getBorderColor = (variant: string, theme: any, disabled: boolean) => {
  if (disabled) return theme.colors.gray200;
  switch (variant) {
    case 'outline': return theme.colors.primary;
    default: return 'transparent';
  }
};

const getTextColor = (variant: string, theme: any, disabled: boolean) => {
  if (disabled) return theme.colors.gray500;
  switch (variant) {
    case 'primary': return '#FFFFFF';
    case 'secondary': return '#FFFFFF';
    case 'outline': return theme.colors.primary;
    case 'ghost': return theme.colors.primary;
    default: return '#FFFFFF';
  }
};

const getPaddingVertical = (size: string, theme: any) => {
  switch (size) {
    case 'sm': return theme.spacing.sm;
    case 'md': return theme.spacing.md;
    case 'lg': return theme.spacing.lg;
    default: return theme.spacing.md;
  }
};

const getPaddingHorizontal = (size: string, theme: any) => {
  switch (size) {
    case 'sm': return theme.spacing.md;
    case 'md': return theme.spacing.lg;
    case 'lg': return theme.spacing.xl;
    default: return theme.spacing.lg;
  }
};

const getFontSize = (size: string, theme: any) => {
  switch (size) {
    case 'sm': return theme.fontSize.sm;
    case 'md': return theme.fontSize.md;
    case 'lg': return theme.fontSize.lg;
    default: return theme.fontSize.md;
  }
};
```

### 2. Input Component
```typescript
// src/components/ui/Input.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  leftIcon,
  rightIcon,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles = [
    styles.inputContainer,
    {
      borderColor: error 
        ? theme.colors.danger 
        : isFocused 
          ? theme.colors.primary 
          : theme.colors.gray300,
      borderRadius: theme.borderRadius.md,
      backgroundColor: disabled ? theme.colors.gray100 : theme.colors.background,
    },
  ];

  const inputStyles = [
    styles.input,
    {
      fontSize: theme.fontSize.md,
      color: disabled ? theme.colors.gray500 : theme.colors.gray900,
      minHeight: multiline ? numberOfLines * 20 : undefined,
    },
  ];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { 
          fontSize: theme.fontSize.sm,
          color: theme.colors.gray700,
          marginBottom: theme.spacing.xs,
        }]}>
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={[styles.iconContainer, { marginRight: theme.spacing.sm }]}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={inputStyles}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray500}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {rightIcon && (
          <TouchableOpacity style={[styles.iconContainer, { marginLeft: theme.spacing.sm }]}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { 
          fontSize: theme.fontSize.sm,
          color: theme.colors.danger,
          marginTop: theme.spacing.xs,
        }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    textAlignVertical: 'top',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontWeight: '500',
  },
});
```

### 3. Card Component
```typescript
// src/components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  variant?: 'default' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  padding = 'md',
  shadow = true,
  variant = 'default',
}) => {
  const theme = useTheme();

  const cardStyles = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: getPadding(padding, theme),
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: variant === 'outlined' ? theme.colors.gray200 : 'transparent',
    },
    shadow && styles.shadow,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

const getPadding = (padding: string, theme: any) => {
  switch (padding) {
    case 'sm': return theme.spacing.sm;
    case 'md': return theme.spacing.md;
    case 'lg': return theme.spacing.lg;
    default: return theme.spacing.md;
  }
};
```

## Screen-Specific Components

### 1. Project Card Component
```typescript
// src/components/projects/ProjectCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';

interface Project {
  id: string;
  title: string;
  customer_name: string;
  address: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimated_hours: number;
  progress_percentage: number;
}

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'in_progress': return theme.colors.primary;
      case 'completed': return theme.colors.success;
      default: return theme.colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Te starten';
      case 'in_progress': return 'Bezig';
      case 'completed': return 'Voltooid';
      default: return status;
    }
  };

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={[styles.title, { 
          fontSize: theme.fontSize.lg,
          color: theme.colors.gray900,
          fontWeight: theme.fontWeight.semibold,
        }]}>
          {project.title}
        </Text>
        <Badge 
          text={getStatusText(project.status)}
          color={getStatusColor(project.status)}
        />
      </View>
      
      <Text style={[styles.customer, {
        fontSize: theme.fontSize.md,
        color: theme.colors.gray700,
        marginVertical: theme.spacing.xs,
      }]}>
        {project.customer_name}
      </Text>
      
      <Text style={[styles.address, {
        fontSize: theme.fontSize.sm,
        color: theme.colors.gray600,
        marginBottom: theme.spacing.sm,
      }]}>
        📍 {project.address}
      </Text>
      
      <View style={styles.footer}>
        <Text style={[styles.hours, {
          fontSize: theme.fontSize.sm,
          color: theme.colors.gray600,
        }]}>
          ⏱️ {project.estimated_hours}h geschat
        </Text>
        
        {project.status === 'in_progress' && (
          <Text style={[styles.progress, {
            fontSize: theme.fontSize.sm,
            color: theme.colors.primary,
            fontWeight: theme.fontWeight.medium,
          }]}>
            {project.progress_percentage}% voltooid
          </Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  customer: {
    fontWeight: '500',
  },
  address: {
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hours: {},
  progress: {},
});
```

### 2. Task Item Component
```typescript
// src/components/tasks/TaskItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Checkbox } from '@/components/ui/Checkbox';
import { useTheme } from '@/contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  block_name?: string;
}

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onPress?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onPress }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
        opacity: task.completed ? 0.7 : 1,
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Checkbox
          checked={task.completed}
          onPress={() => onToggle(task.id)}
          style={styles.checkbox}
        />
        
        <View style={styles.textContainer}>
          {task.block_name && (
            <Text style={[styles.blockName, {
              fontSize: theme.fontSize.xs,
              color: theme.colors.primary,
              fontWeight: theme.fontWeight.medium,
              marginBottom: theme.spacing.xs,
            }]}>
              {task.block_name.toUpperCase()}
            </Text>
          )}
          
          <Text style={[styles.title, {
            fontSize: theme.fontSize.md,
            color: theme.colors.gray900,
            fontWeight: theme.fontWeight.medium,
            textDecorationLine: task.completed ? 'line-through' : 'none',
          }]}>
            {task.title}
          </Text>
          
          {task.description && (
            <Text style={[styles.description, {
              fontSize: theme.fontSize.sm,
              color: theme.colors.gray600,
              marginTop: theme.spacing.xs,
            }]}>
              {task.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Dynamic styles applied inline
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  blockName: {
    letterSpacing: 0.5,
  },
  title: {
    lineHeight: 20,
  },
  description: {
    lineHeight: 18,
  },
});
```

### 3. Camera Capture Component
```typescript
// src/components/camera/CameraCapture.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';

interface CameraCaptureProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
  category?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  category = 'general',
}) => {
  const theme = useTheme();
  const cameraRef = useRef<Camera>(null);
  const [type, setType] = useState(CameraType.back);
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        onCapture(photo.uri);
      } catch (error) {
        Alert.alert('Fout', 'Kon foto niet maken');
        console.error(error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const toggleCameraType = () => {
    setType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.colors.background }]}>
                ✕
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.categoryText, {
              color: theme.colors.background,
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.medium,
            }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)} foto
            </Text>
            
            <TouchableOpacity onPress={toggleCameraType} style={styles.flipButton}>
              <Text style={[styles.flipText, { color: theme.colors.background }]}>
                🔄
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={[styles.captureButton, {
                  borderColor: theme.colors.background,
                  backgroundColor: isCapturing ? theme.colors.gray500 : 'transparent',
                }]}
                onPress={takePicture}
                disabled={isCapturing}
              >
                <View style={[styles.captureInner, {
                  backgroundColor: theme.colors.background,
                }]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  flipButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipText: {
    fontSize: 20,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
```

## Utility Components

### 1. Loading Component
```typescript
// src/components/ui/Loading.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Laden...',
  size = 'large',
  fullScreen = false,
}) => {
  const theme = useTheme();

  const containerStyles = [
    styles.container,
    fullScreen && styles.fullScreen,
    {
      backgroundColor: fullScreen ? theme.colors.background : 'transparent',
    },
  ];

  return (
    <View style={containerStyles}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={[styles.message, {
          color: theme.colors.gray700,
          fontSize: theme.fontSize.md,
          marginTop: theme.spacing.md,
        }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  message: {
    textAlign: 'center',
  },
});
```

### 2. Badge Component
```typescript
// src/components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface BadgeProps {
  text: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined';
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  color,
  size = 'md',
  variant = 'filled',
}) => {
  const theme = useTheme();
  const badgeColor = color || theme.colors.primary;

  const badgeStyles = [
    styles.badge,
    {
      backgroundColor: variant === 'filled' ? badgeColor : 'transparent',
      borderColor: badgeColor,
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: getPaddingHorizontal(size, theme),
      paddingVertical: getPaddingVertical(size, theme),
    },
  ];

  const textStyles = [
    styles.text,
    {
      color: variant === 'filled' ? '#FFFFFF' : badgeColor,
      fontSize: getFontSize(size, theme),
      fontWeight: theme.fontWeight.medium,
    },
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    lineHeight: 16,
  },
});

const getPaddingHorizontal = (size: string, theme: any) => {
  switch (size) {
    case 'sm': return theme.spacing.sm;
    case 'md': return theme.spacing.md;
    case 'lg': return theme.spacing.lg;
    default: return theme.spacing.md;
  }
};

const getPaddingVertical = (size: string, theme: any) => {
  switch (size) {
    case 'sm': return theme.spacing.xs;
    case 'md': return theme.spacing.sm;
    case 'lg': return theme.spacing.md;
    default: return theme.spacing.sm;
  }
};

const getFontSize = (size: string, theme: any) => {
  switch (size) {
    case 'sm': return theme.fontSize.xs;
    case 'md': return theme.fontSize.sm;
    case 'lg': return theme.fontSize.md;
    default: return theme.fontSize.sm;
  }
};
```

## Navigation Components

### 1. Header Component
```typescript
// src/components/navigation/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  backgroundColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  rightAction,
  backgroundColor,
}) => {
  const theme = useTheme();
  const router = useRouter();

  const headerStyles = [
    styles.header,
    {
      backgroundColor: backgroundColor || theme.colors.background,
      borderBottomColor: theme.colors.gray200,
    },
  ];

  return (
    <SafeAreaView style={headerStyles}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={[styles.backText, { color: theme.colors.primary }]}>
                ← Terug
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.centerSection}>
          <Text style={[styles.title, {
            color: theme.colors.gray900,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
          }]}>
            {title}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
              {rightAction.icon}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 16,
  },
  title: {
    textAlign: 'center',
  },
  actionButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## Component Usage Guidelines

### 1. Consistent Spacing
- Gebruik altijd theme.spacing waarden voor margins en padding
- Volg de 8pt grid (spacing.xs = 4, spacing.sm = 8, etc.)

### 2. Color Usage
- Gebruik semantic colors (primary, success, warning, danger)
- Gebruik gray scale voor neutrale elementen
- Respecteer contrast ratios voor accessibility

### 3. Typography
- Gebruik consistent fontSize en fontWeight uit theme
- Zorg voor juiste line heights voor leesbaarheid

### 4. Touch Targets
- Minimum touch target van 44dp/pt
- Gebruik activeOpacity={0.7} voor feedback

### 5. Platform Differences
- Respecteer iOS en Android design patterns
- Gebruik Platform.select() waar nodig voor platform-specifieke styling