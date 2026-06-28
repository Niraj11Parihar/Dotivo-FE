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
  Modal,
} from 'react-native';
import { ScreenWrapper } from '../common/ScreenWrapper';
import { theme } from '../../config/constants/theme';
import { useGoalStore } from '../../store/slices/goalStore';
import { GOAL_TEMPLATES, GOAL_CATEGORIES, GoalPreset } from '../../config/constants/goalTemplates';
import { CheckIcon as Check, ChevronLeftIcon as ChevronLeft, ClockIcon as Clock, XIcon as X } from '../../svg';

const PALETTE = [
  '#10B981', '#34D399', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#F59E0B', '#EF4444', '#F97316', '#14B8A6',
  '#D4AF37', '#38BDF8',
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CreateGoalModalProps {
  initialData?: {
    _id: string;
    title: string;
    category: string;
    targetCount: number;
    isDailyMinimum: boolean;
    color: string;
    frequencyType?: string;
    selectedDays?: number[];
    reminderTime?: string;
  };
}

export default function CreateGoalModal({ initialData }: CreateGoalModalProps) {
  const router = useRouter();
  const { addTemplate, updateTemplate, isLoading } = useGoalStore();
  const isEditing = !!initialData;

  const [step, setStep] = useState<'template' | 'form'>(isEditing ? 'form' : 'template');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Personal Growth');
  const [targetCount, setTargetCount] = useState(String(initialData?.targetCount ?? 1));
  const [isDailyMinimum, setIsDailyMinimum] = useState(initialData?.isDailyMinimum ?? true);
  const [selectedColor, setSelectedColor] = useState(initialData?.color ?? PALETTE[0]);
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'specific_days'>(
    (initialData?.frequencyType as any) ?? 'daily'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.selectedDays ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(!!initialData?.reminderTime);
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime ?? '09:00');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const applyTemplate = (preset: GoalPreset) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTargetCount(String(preset.targetCount));
    setIsDailyMinimum(preset.isDailyMinimum);
    setSelectedColor(preset.color);
    setFrequencyType(preset.frequencyType);
    setSelectedDays(preset.selectedDays ?? []);
    setStep('form');
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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
    if (frequencyType === 'specific_days' && selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day.');
      return;
    }

    const data = {
      title: title.trim(),
      category,
      targetCount: count,
      isDailyMinimum,
      isTop3Default: isDailyMinimum,
      color: selectedColor,
      icon: 'circle',
      frequencyType,
      selectedDays: frequencyType === 'specific_days' ? selectedDays : [],
      reminderTime: reminderEnabled ? reminderTime : '',
    };

    try {
      if (isEditing && initialData) {
        await updateTemplate(initialData._id, data);
      } else {
        await addTemplate(data);
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Check your connection and try again.');
    }
  };

  // ── Template Picker Step ─────────────────────────────────────────
  if (step === 'template') {
    return (
      <ScreenWrapper>
        <View style={styles.templateHeader}>
          <Text style={styles.templateTitle}>Quick Start</Text>
          <Text style={styles.templateSubtitle}>Pick a template or start from scratch</Text>
        </View>
        <ScrollView contentContainerStyle={styles.templateContainer} showsVerticalScrollIndicator={false}>
          {/* Start from scratch */}
          <Pressable
            style={styles.scratchBtn}
            onPress={() => setStep('form')}
          >
            <Text style={styles.scratchBtnIcon}>✏️</Text>
            <View>
              <Text style={styles.scratchBtnText}>Start from scratch</Text>
              <Text style={styles.scratchBtnSub}>Define your own custom goal</Text>
            </View>
            <ChevronLeft color={theme.colors.textMuted} size={18} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>

          {Object.entries(GOAL_TEMPLATES).map(([categoryName, presets]) => (
            <View key={categoryName} style={styles.templateSection}>
              <Text style={styles.templateCategoryLabel}>{categoryName}</Text>
              {presets.map((preset, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.templateCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => applyTemplate(preset)}
                >
                  <View style={[styles.templateColorDot, { backgroundColor: preset.color }]} />
                  <View style={styles.templateCardInfo}>
                    <Text style={styles.templateCardTitle}>{preset.title}</Text>
                    <Text style={styles.templateCardMeta}>
                      {preset.targetCount > 1 ? `${preset.targetCount} units` : '1 session'} •{' '}
                      {preset.frequencyType === 'specific_days'
                        ? preset.selectedDays?.map(d => DAY_NAMES[d]).join(', ')
                        : preset.frequencyType}
                    </Text>
                  </View>
                  {preset.isDailyMinimum && (
                    <View style={styles.templateMinBadge}>
                      <Text style={styles.templateMinBadgeText}>MIN</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ── Form Step ────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        {/* Back button (only in create mode) */}
        {!isEditing && (
          <Pressable style={styles.backBtn} onPress={() => setStep('template')}>
            <ChevronLeft color={theme.colors.textMuted} size={20} />
            <Text style={styles.backBtnText}>Templates</Text>
          </Pressable>
        )}

        <Text style={styles.formTitle}>{isEditing ? 'Edit Goal' : 'New Goal'}</Text>
        <Text style={styles.formSubtitle}>
          {isEditing ? 'Update your habit or goal.' : 'Define a habit or goal to track.'}
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
            maxLength={60}
          />
        </View>

        {/* Color Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.paletteRow}>
            {PALETTE.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Check color="#fff" size={14} />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <Pressable style={styles.categoryBtn} onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.categoryBtnText}>{category}</Text>
            <ChevronLeft color={theme.colors.textMuted} size={16} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        </View>

        {/* Target Count */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Count</Text>
          <Text style={styles.sublabel}>How many units = "done"? (e.g. 8 glasses, 1 session)</Text>
          <View style={styles.countRow}>
            <Pressable
              style={styles.countBtn}
              onPress={() => setTargetCount(String(Math.max(1, parseInt(targetCount) - 1)))}
            >
              <Text style={styles.countBtnText}>−</Text>
            </Pressable>
            <TextInput
              style={styles.countInput}
              placeholder="1"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={targetCount}
              onChangeText={setTargetCount}
              maxLength={4}
            />
            <Pressable
              style={styles.countBtn}
              onPress={() => setTargetCount(String(parseInt(targetCount || '0') + 1))}
            >
              <Text style={styles.countBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipRow}>
            {(['daily', 'specific_days', 'weekly'] as const).map(f => (
              <Pressable
                key={f}
                style={[styles.chip, frequencyType === f && styles.chipActive]}
                onPress={() => setFrequencyType(f)}
              >
                <Text style={[styles.chipText, frequencyType === f && styles.chipTextActive]}>
                  {f === 'specific_days' ? 'Specific Days' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          {frequencyType === 'specific_days' && (
            <View style={styles.daysRow}>
              {DAY_LABELS.map((label, i) => (
                <Pressable
                  key={i}
                  style={[styles.dayBtn, selectedDays.includes(i) && styles.dayBtnActive]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[styles.dayBtnText, selectedDays.includes(i) && styles.dayBtnTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Reminder */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Clock color={theme.colors.textMuted} size={18} />
              <View>
                <Text style={styles.toggleLabel}>Daily Reminder</Text>
                <Text style={styles.toggleSub}>Get a gentle nudge</Text>
              </View>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: theme.colors.border, true: selectedColor }}
              thumbColor="#fff"
            />
          </View>
          {reminderEnabled && (
            <TextInput
              style={[styles.input, { marginTop: 10, marginBottom: 0 }]}
              placeholder="HH:MM (e.g. 09:00)"
              placeholderTextColor={theme.colors.textMuted}
              value={reminderTime}
              onChangeText={setReminderTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          )}
        </View>

        {/* Daily Minimum Toggle */}
        <View style={styles.toggleCard}>
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleLeft}>
              <Text style={{ fontSize: 18 }}>⭐</Text>
              <View>
                <Text style={styles.toggleLabel}>Daily Minimum</Text>
                <Text style={styles.toggleSub}>Required for a "win" day. Shows in Top 3.</Text>
              </View>
            </View>
            <Switch
              value={isDailyMinimum}
              onValueChange={setIsDailyMinimum}
              trackColor={{ false: theme.colors.border, true: selectedColor }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Preview */}
        <View style={[styles.preview, { borderLeftColor: selectedColor }]}>
          <Text style={styles.previewLabel}>PREVIEW</Text>
          <Text style={styles.previewTitle} numberOfLines={1}>{title || 'Your Goal Title'}</Text>
          <Text style={styles.previewMeta}>
            {category} • {targetCount || '1'} unit{parseInt(targetCount) !== 1 ? 's' : ''}{' '}
            • {frequencyType === 'specific_days'
              ? selectedDays.map(d => DAY_NAMES[d]).join(', ') || 'No days selected'
              : frequencyType}
            {isDailyMinimum ? ' • Daily Min ⭐' : ''}
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: selectedColor, opacity: (pressed || isLoading) ? 0.75 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitBtnText}>
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView>
              {GOAL_CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                  onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
                >
                  <Text style={[styles.categoryOptionText, category === cat && { color: theme.colors.primary }]}>
                    {cat}
                  </Text>
                  {category === cat && <Check color={theme.colors.primary} size={16} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Template step
  templateHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  templateTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  templateSubtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  templateContainer: { padding: 16, paddingTop: 12 },
  scratchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  scratchBtnIcon: { fontSize: 24 },
  scratchBtnText: { color: theme.colors.text, fontWeight: '700', fontSize: 15 },
  scratchBtnSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  templateSection: { marginBottom: 20 },
  templateCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 2,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateColorDot: { width: 10, height: 10, borderRadius: 5 },
  templateCardInfo: { flex: 1 },
  templateCardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  templateCardMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  templateMinBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  templateMinBadgeText: { color: theme.colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Form step
  formContainer: { padding: 20, paddingBottom: 48 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: { color: theme.colors.textMuted, fontSize: 14 },
  formTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  formSubtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  sublabel: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryBtnText: { color: theme.colors.text, fontSize: 16 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBtnText: { color: theme.colors.text, fontSize: 22, fontWeight: '300' },
  countInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '700',
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  chipText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: theme.colors.primary },
  daysRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.radii.s,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayBtnActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: theme.colors.primary },
  dayBtnText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 12 },
  dayBtnTextActive: { color: theme.colors.primary },
  toggleCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleLabel: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  toggleSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  preview: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  previewTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  previewMeta: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  submitBtn: {
    borderRadius: theme.radii.m,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: theme.colors.textMuted, fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.cardElevated,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    padding: 20,
    maxHeight: '70%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryOptionActive: { backgroundColor: 'rgba(16,185,129,0.04)' },
  categoryOptionText: { color: theme.colors.text, fontSize: 16 },
});
