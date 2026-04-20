import React, { useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ParticleProps {
  index: number;
  color: string;
  onFinished: () => void;
}

const Particle = ({ index, color, onFinished }: ParticleProps) => {
  const t = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  // Random trajectory
  const angle = (Math.PI * 2 * index) / 12 + (Math.random() * 0.5);
  const distance = 60 + Math.random() * 80;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance;

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withDelay(400, withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinished)();
      }))
    );
    t.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: t.value * targetX },
        { translateY: t.value * targetY },
        { scale: (1 - t.value * 0.5) * (0.8 + Math.random() * 0.4) },
        { rotate: `${t.value * 360}deg` }
      ],
    };
  });

  return (
    <Animated.View 
      style={[
        styles.particle, 
        { backgroundColor: color },
        style
      ]} 
    />
  );
};

export interface CrystalBurstRef {
  trigger: (x: number, y: number) => void;
}

const CrystalBurst = forwardRef<CrystalBurstRef>((_, ref) => {
  const [bursts, setBursts] = useState<{ id: string; x: number; y: number }[]>([]);

  useImperativeHandle(ref, () => ({
    trigger: (x, y) => {
      const id = Math.random().toString(36).substr(2, 9);
      setBursts(prev => [...prev, { id, x, y }]);
    }
  }));

  const removeBurst = (id: string) => {
    setBursts(prev => prev.filter(b => b.id !== id));
  };

  const COLORS = ['#818CF8', '#10D9A0', '#F59E0B', '#F43F5E', '#00D9F5'];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bursts.map(burst => (
        <View 
          key={burst.id} 
          style={[styles.burstContainer, { left: burst.x, top: burst.y }]}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <Particle 
              key={`${burst.id}-${i}`} 
              index={i} 
              color={COLORS[i % COLORS.length]} 
              onFinished={() => {
                // We only need to cleanup the burst once all particles are done
                // For simplicity, we'll just cleanup the burst after a set time
              }}
            />
          ))}
          {/* Automatic cleanup after animation duration */}
          <CleanupHelper onFinish={() => removeBurst(burst.id)} delay={1200} />
        </View>
      ))}
    </View>
  );
});

const CleanupHelper = ({ onFinish, delay }: { onFinish: () => void; delay: number }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, delay);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

const styles = StyleSheet.create({
  burstContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2, // Crystal/Diamond shape
    transform: [{ rotate: '45deg' }],
  },
});

export default CrystalBurst;
