import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function FavoriteScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="heart" size={80} color={colors.textMuted} style={{ opacity: 0.3 }} />
      <Text style={[styles.title, { color: colors.text }]}>Favorites</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Your favorite meals will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center' }
});