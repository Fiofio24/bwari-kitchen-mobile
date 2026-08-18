import React from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  ScrollView, 
  ViewStyle, 
  StyleProp 
} from 'react-native';

interface SafeKeyboardWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * A universal wrapper for any screen that contains text inputs.
 * It automatically handles pushing the screen up when the keyboard opens 
 * and allows users to tap buttons immediately without closing the keyboard first.
 */
export default function SafeKeyboardWrapper({ 
  children, 
  style, 
  contentContainerStyle 
}: SafeKeyboardWrapperProps) {
  
  return (
    <KeyboardAvoidingView 
      style={[styles.keyboardAvoid, style]} 
      // iOS prefers 'padding', Android strictly needs 'height' to avoid overlap
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false} 
        // THIS IS THE UX MAGIC: Allows instant taps on buttons while keyboard is open
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        // Ensures the scrollview fills the screen even if content is small
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, 
  }
});