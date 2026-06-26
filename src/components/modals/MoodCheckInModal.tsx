import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { theme } from '../../config/constants/theme';

const MOODS = [
  { value: 1, emoji: '😴', label: 'Exhausted' },
  { value: 2, emoji: '😕', label: 'Tough day' },
  { value: 3, emoji: '😊', label: 'Good' },
  { value: 4, emoji: '💪', label: 'Strong' },
  { value: 5, emoji: '🔥', label: 'On fire!' },
];

interface MoodCheckInModalProps {
  visible: boolean;
  onSelect: (mood: number) => void;
  onDismiss: () => void;
}

export default function MoodCheckInModal({ visible, onSelect, onDismiss }: MoodCheckInModalProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (mood: number) => {
    setSelected(mood);
    setTimeout(() => {
      onSelect(mood);
      setSelected(null);
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>All minimum goals done! 🎉</Text>
          <Text style={styles.subtitle}>How did today feel?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable
                key={m.value}
                style={[
                  styles.moodBtn,
                  selected === m.value && styles.moodBtnSelected,
                ]}
                onPress={() => handleSelect(m.value)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selected === m.value && { color: theme.colors.primary },
                ]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.skipBtn} onPress={onDismiss}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.cardElevated,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    padding: 24,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 20,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: theme.radii.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  moodBtnSelected: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: theme.colors.primary,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { color: theme.colors.textMuted, fontSize: 14 },
});
