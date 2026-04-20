import React from 'react';
import { StyleSheet, View, ViewStyle, Image } from 'react-native';

interface TrackleyLogoProps {
  size?: number;
  style?: ViewStyle;
}

export function TrackleyLogo({ size = 40, style }: TrackleyLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size, overflow: 'hidden', borderRadius: size / 4 }, style]}>
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
