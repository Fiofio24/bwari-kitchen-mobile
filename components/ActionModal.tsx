import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { scale } from '../constants/Sizes'; // <-- IMPORTED MASTER SCALE

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmBtnColor?: string;
}

export default function ActionModal({ 
  visible, 
  onClose, 
  onConfirm,
  title,
  message,
  iconName,
  iconColor = '#D32F2F', // Default to red
  confirmText = 'Yes',
  cancelText = 'Cancel',
  confirmBtnColor = '#D32F2F' // Default to red button
}: ActionModalProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRendering, setIsRendering] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
      ]).start();
    } else if (!visible && isRendering) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true })
      ]).start(() => setIsRendering(false));
    }
  }, [visible, isRendering, fadeAnim, scaleAnim]);

  if (!isRendering) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      {/* Background shadow */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      </TouchableWithoutFeedback>
      
      {/* The Alert Box */}
      <Animated.View style={[
        styles.card, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }] 
        }
      ]}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={scale(32)} color={iconColor} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {message}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]} 
            onPress={onClose} 
            activeOpacity={0.7}
          >
            <Text style={[styles.btnText, { color: colors.text }]}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: confirmBtnColor }]} 
            onPress={onConfirm} 
            activeOpacity={0.7}
          >
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// PRO CSS COMPLIANCE
const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '80%',
    maxWidth: scale(320),
    borderRadius: scale(25),
    padding: scale(25),
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
  },
  iconCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  title: {
    fontSize: scale(20),
    fontWeight: 'bold',
    marginBottom: scale(8),
  },
  message: {
    fontSize: scale(15),
    textAlign: 'center',
    marginBottom: scale(25),
    lineHeight: scale(22),
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: scale(15),
  },
  btn: {
    flex: 1,
    paddingVertical: scale(14),
    borderRadius: scale(35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: scale(15),
    fontWeight: 'bold',
  },
  confirmText: {
    color: '#FFF',
    fontSize: scale(15),
    fontWeight: 'bold',
  },
});