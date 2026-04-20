import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CrystalCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CrystalCard({ children, style }: CrystalCardProps) {
  const colors = useTheme();

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.card,
        borderColor: colors.border,
      }, 
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      }
    }),
  },
});
