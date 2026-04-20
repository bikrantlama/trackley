import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Extrapolate,
  Easing
} from 'react-native-reanimated';
import { useTheme, useThemeId } from '@/hooks/useTheme';

const { width, height } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function PremiumBackground({ children }: { children: React.ReactNode }) {
  const colors = useTheme();
  const themeId = useThemeId();
  const isLiquidGlass = themeId === 'liquidglass';
  
  // Shared values for floating blobs
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);

  // Liquid glass animation values
  const liquidOpacity = useSharedValue(0.15);
  const liquidShift = useSharedValue(0);

  useEffect(() => {
    // Animate blobs in a "breathing" fashion
    const duration = 15000;
    
    blob1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.3, { duration }),
        withTiming(-width * 0.1, { duration }),
        withTiming(0, { duration })
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.2, { duration: duration * 1.2 }),
        withTiming(-height * 0.1, { duration: duration * 1.2 }),
        withTiming(0, { duration: duration * 1.2 })
      ),
      -1,
      true
    );

    blob2X.value = withRepeat(
      withSequence(
        withTiming(-width * 0.4, { duration: duration * 0.8 }),
        withTiming(width * 0.2, { duration: duration * 0.8 }),
        withTiming(0, { duration: duration * 0.8 })
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(-height * 0.3, { duration: duration * 1.5 }),
        withTiming(height * 0.1, { duration: duration * 1.5 }),
        withTiming(0, { duration: duration * 1.5 })
      ),
      -1,
      true
    );

    blob3X.value = withRepeat(
      withSequence(
        withTiming(width * 0.2, { duration: duration * 1.3 }),
        withTiming(-width * 0.3, { duration: duration * 1.3 }),
        withTiming(0, { duration: duration * 1.3 })
      ),
      -1,
      true
    );

    // Liquid glass specific animation
    if (isLiquidGlass) {
      liquidOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      liquidShift.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isLiquidGlass]);

  const animStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));

  const animStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));

  const animStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob3X.value }, { translateY: blob3Y.value }],
  }));

  const liquidStyle = useAnimatedStyle(() => ({
    opacity: liquidOpacity.value,
    transform: [{ translateX: liquidShift.value * 20 }, { translateY: liquidShift.value * -15 }],
  }));

  // Liquid Glass gradient positions
  const liquidGradStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: liquidShift.value * 30 }],
  }));

  if (isLiquidGlass) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Subtle Gradient Background */}
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(0,122,255,0.03)', 'rgba(88,86,214,0.02)', 'transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Blobs */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View 
          style={[
            styles.blob, 
            animStyle1, 
            { 
              backgroundColor: colors.primary + '25', 
              width: width * 0.8, 
              height: width * 0.8,
              top: height * 0.1,
              left: width * 0.1,
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.blob, 
            animStyle2, 
            { 
              backgroundColor: colors.secondary + '30', 
              width: width * 0.9, 
              height: width * 0.9,
              bottom: height * 0.1,
              right: -width * 0.2,
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.blob, 
            animStyle3, 
            { 
              backgroundColor: colors.accent + '20', 
              width: width * 0.7, 
              height: width * 0.7,
              top: height * 0.5,
              left: -width * 0.1,
            }
          ]} 
        />
      </View>

      {/* Blur Overlay */}
      <BlurView 
        intensity={Platform.OS === 'ios' ? 80 : 100} 
        tint={themeId === 'crystal' ? 'light' : 'dark'} 
        style={StyleSheet.absoluteFill} 
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.6,
  },
  liquidBlob: {
    position: 'absolute',
    borderRadius: 1000,
  },
});
