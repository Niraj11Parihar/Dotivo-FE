import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { ScreenWrapper } from '../common/ScreenWrapper';
import { theme } from '../../config/constants/theme';
import { GoalCategory, useGoalStore } from '../../store/slices/goalStore';

const CATEGORIES: GoalCategory[] = [
  'Health',
  'Fitness',
  'Productivity',
  'Personal Growth',
  'Study',
];

const PALETTE = [
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function CreateGoalModal() {
  const router = useRouter();
  const { addTemplate, isLoading } = useGoalStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Personal Growth');
  const [targetCount, setTargetCount] = useState('1');
  const [isDailyMinimum, setIsDailyMinimum] = useState(true);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a goal title.');
      return;
    }

    const count = parseInt(targetCount, 10);
    if (isNaN(count) || count < 1) {
      Alert.alert('Invalid Count', 'Target count must be at least 1.');
      return;
    }

    try {
      await addTemplate({
        title: title.trim(),
        category,
        targetCount: count,
        isDailyMinimum,
        isTop3Default: isDailyMinimum,
        color: selectedColor,
        icon: 'circle',
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Check your connection and try again.');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>New Goal Template</Text>
        <Text style={styles.pageSubtitle}>
          Define a habit or goal you want to track daily.
        </Text>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Goal Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Read for 30 mins"
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
            onChange={(e) => setTitle(e.nativeEvent.text)}
            maxLength={60}
            returnKeyType="next"
          />
        </View>

        {/* Target Count */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Count</Text>
          <Text style={styles.sublabel}>
            How many units to count as "done"? (e.g. 8 glasses, 1 session)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
            value={targetCount}
            onChangeText={setTargetCount}
            onChange={(e) => setTargetCount(e.nativeEvent.text)}
            maxLength={3}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={({ pressed }) => [styles.chip, category === cat && styles.chipSelected, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === cat && styles.chipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {PALETTE.map((color) => (
              <Pressable
                key={color}
                style={({ pressed }) => [
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        {/* Daily Minimum Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.label}>Daily Minimum</Text>
            <Text style={styles.sublabel}>
              Required for a "green" win day. Show in Top 3.
            </Text>
          </View>
          <Switch
            value={isDailyMinimum}
            onValueChange={setIsDailyMinimum}
            trackColor={{ false: theme.colors.border, true: selectedColor }}
            thumbColor={isDailyMinimum ? '#fff' : theme.colors.textMuted}
          />
        </View>

        {/* Preview */}
        <View style={[styles.preview, { borderLeftColor: selectedColor }]}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewTitle}>{title || 'Your Goal Title'}</Text>
          <Text style={styles.previewMeta}>
            {category} • {targetCount || '1'} unit{parseInt(targetCount) !== 1 ? 's' : ''} •{' '}
            {isDailyMinimum ? 'Daily Minimum ✓' : 'Bonus Goal'}
          </Text>
        </View>

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.button, { backgroundColor: selectedColor }, isLoading && styles.buttonDisabled, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Saving...' : 'Create Goal'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.l,
    paddingBottom: 48,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.m,
    marginBottom: 4,
  },
  pageSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: theme.spacing.l,
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  sublabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 17,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.2 }],
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.l,
    gap: theme.spacing.m,
  },
  toggleInfo: { flex: 1 },
  preview: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  button: {
    borderRadius: theme.radii.m,
    padding: 16,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
});
