import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '../hooks/useTheme';

interface GlassContainerProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  style,
  intensity = 30,
  tint: tintProp,
  borderRadius = 24,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.background === '#050505' || theme.background.startsWith('#0');
  const tint = tintProp || (isDark ? 'dark' : 'light');

  return (
    <View 
      style={[
        styles.wrapper, 
        { 
          borderRadius,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: theme.border,
        }, 
        style
      ]} 
      {...props}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={tint === 'dark' ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: tint === 'dark' 
                ? 'rgba(30, 30, 40, 0.85)' 
                : 'rgba(255, 255, 255, 0.7)',
              borderRadius,
            },
          ]}
        />
      )}
      <View style={[styles.content, { borderRadius }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    padding: 16,
  },
});
