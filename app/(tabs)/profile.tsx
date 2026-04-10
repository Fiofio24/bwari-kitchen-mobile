import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="person-circle-outline" size={100} color={colors.textMuted} style={{ opacity: 0.5 }} />
      <Text style={[styles.title, { color: colors.text }]}>User Profile</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Account settings and history coming soon!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center' }
});