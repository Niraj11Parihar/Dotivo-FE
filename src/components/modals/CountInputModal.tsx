import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, TextInput, Keyboard } from 'react-native';
import { theme } from '../../config/constants/theme';
import { X, Check } from 'lucide-react-native';

interface CountInputModalProps {
  visible: boolean;
  goalTitle: string;
  targetCount: number;
  currentCount: number;
  goalColor: string;
  onConfirm: (count: number) => void;
  onDismiss: () => void;
}

export default function CountInputModal({
  visible,
  goalTitle,
  targetCount,
  currentCount,
  goalColor,
  onConfirm,
  onDismiss,
}: CountInputModalProps) {
  const [value, setValue] = useState(String(currentCount));

  const handleConfirm = () => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 0) {
      onConfirm(n);
      Keyboard.dismiss();
    }
  };

  const quickValues = Array.from({ length: Math.min(targetCount, 10) }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={() => { Keyboard.dismiss(); onDismiss(); }}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={[styles.colorBar, { backgroundColor: goalColor }]} />
          <Text style={styles.title} numberOfLines={1}>{goalTitle}</Text>
          <Text style={styles.subtitle}>Target: {targetCount} unit{targetCount !== 1 ? 's' : ''}</Text>

          {/* Quick tap values */}
          {targetCount <= 10 && (
            <View style={styles.quickRow}>
              {quickValues.map(v => (
                <Pressable
                  key={v}
                  style={[styles.quickBtn, value === String(v) && { backgroundColor: goalColor, borderColor: goalColor }]}
                  onPress={() => setValue(String(v))}
                >
                  <Text style={[styles.quickBtnText, value === String(v) && { color: '#fff' }]}>{v}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.quickBtn, value === '0' && { backgroundColor: theme.colors.error, borderColor: theme.colors.error }]}
                onPress={() => setValue('0')}
              >
                <Text style={[styles.quickBtnText, value === '0' && { color: '#fff' }]}>0</Text>
              </Pressable>
            </View>
          )}

          {/* Manual input */}
          <Text style={styles.inputLabel}>Or enter exact count</Text>
          <TextInput
            style={[styles.input, { borderColor: goalColor }]}
            value={value}
            onChangeText={setValue}
            keyboardType="number-pad"
            maxLength={4}
            onSubmitEditing={handleConfirm}
            selectTextOnFocus
          />

          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onDismiss}>
              <X color={theme.colors.textMuted} size={18} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.confirmBtn, { backgroundColor: goalColor }]} onPress={handleConfirm}>
              <Check color="#fff" size={18} />
              <Text style={styles.confirmBtnText}>Set Count</Text>
            </Pressable>
          </View>
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
    marginBottom: 16,
  },
  colorBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  quickBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: theme.radii.s,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quickBtnText: { color: theme.colors.text, fontWeight: '700', fontSize: 15 },
  inputLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radii.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelBtnText: { color: theme.colors.textMuted, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radii.m,
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
