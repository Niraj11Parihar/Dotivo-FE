import React, { useState, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../config/constants/theme';
import { useGoalStore } from '../../store/slices/goalStore';
import { GOAL_TEMPLATES, GoalPreset } from '../../config/constants/goalTemplates';
import { Check, ArrowRight, SkipForward } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ONBOARDING_KEY = 'dotivo_onboarded';

interface OnboardingProps {
  onComplete: () => void;
}

const QUICK_TEMPLATES: GoalPreset[] = [
  ...GOAL_TEMPLATES['Fitness'].slice(0, 2),
  ...GOAL_TEMPLATES['Student'].slice(0, 2),
  ...GOAL_TEMPLATES['Sleep'].slice(0, 2),
  ...GOAL_TEMPLATES['Mindfulness'].slice(0, 2),
  ...GOAL_TEMPLATES['Coding / Dev'].slice(0, 2),
];

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedPresets, setSelectedPresets] = useState<Set<number>>(new Set());
  const { addTemplate, setHasOnboarded } = useGoalStore();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    const next = step + 1;
    Animated.spring(progressAnim, {
      toValue: next / 2,
      useNativeDriver: false,
      tension: 40,
    }).start();
    setStep(next);
  };

  const togglePreset = (index: number) => {
    setSelectedPresets(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (next.size >= 5) return prev;
        next.add(index);
      }
      return next;
    });
  };

  const handleFinish = async () => {
    // Add selected templates
    const selected = Array.from(selectedPresets).map(i => QUICK_TEMPLATES[i]);
    for (const preset of selected) {
      try {
        await addTemplate({
          title: preset.title,
          category: preset.category,
          targetCount: preset.targetCount,
          isDailyMinimum: preset.isDailyMinimum,
          isTop3Default: preset.isDailyMinimum,
          color: preset.color,
          icon: 'circle',
          frequencyType: preset.frequencyType,
          selectedDays: preset.selectedDays ?? [],
          reminderTime: '',
        });
      } catch (e) {}
    }
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasOnboarded(true);
    onComplete();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasOnboarded(true);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Skip */}
      <Pressable style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* ── Step 0: Welcome ── */}
      {step === 0 && (
        <View style={styles.stepContainer}>
          <View style={styles.heroGrid}>
            {[1,1,0,1,0,1,1,0,1,1,0,1,1,1,0,1].map((f, i) => (
              <View
                key={i}
                style={[
                  styles.heroDot,
                  f ? styles.heroDotFilled : styles.heroDotEmpty,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepTitle}>Welcome to Dotivo</Text>
          <Text style={styles.stepBody}>
            Every dot is a day. Every green dot is a win.{'\n'}
            Build the grid. Build your life.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={goNext}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <ArrowRight color="#fff" size={18} />
          </Pressable>
        </View>
      )}

      {/* ── Step 1: Pick goals ── */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Pick up to 5 goals</Text>
          <Text style={styles.stepBody}>
            These become your daily minimum habits. You can always edit them later.
          </Text>
          <Text style={styles.selectionCount}>
            {selectedPresets.size}/5 selected
          </Text>
          <ScrollView
            style={styles.presetList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {QUICK_TEMPLATES.map((preset, i) => {
              const isSelected = selectedPresets.has(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetCard, isSelected && { borderColor: preset.color, backgroundColor: preset.color + '12' }]}
                  onPress={() => togglePreset(i)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
                  <View style={styles.presetInfo}>
                    <Text style={styles.presetTitle}>{preset.title}</Text>
                    <Text style={styles.presetMeta}>
                      {preset.category} • {preset.frequencyType === 'specific_days'
                        ? `${preset.selectedDays?.length ?? 0} days/week`
                        : preset.frequencyType}
                    </Text>
                  </View>
                  <View style={[styles.checkCircle, isSelected && { backgroundColor: preset.color, borderColor: preset.color }]}>
                    {isSelected && <Check color="#fff" size={13} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.bottomActionArea}>
            <Pressable
              style={[styles.primaryBtn, selectedPresets.size === 0 && { opacity: 0.5 }]}
              onPress={goNext}
            >
              <Text style={styles.primaryBtnText}>
                {selectedPresets.size > 0 ? `Start with ${selectedPresets.size} goal${selectedPresets.size !== 1 ? 's' : ''}` : 'Continue →'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Step 2: Wallpaper intro ── */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.heroEmoji}>🖼️</Text>
          <Text style={styles.stepTitle}>Your wallpaper, your progress</Text>
          <Text style={styles.stepBody}>
            Dotivo turns your Android home screen into a live progress mirror.
            Every green dot means you showed up that day.{'\n\n'}
            Head to the Wallpaper tab to activate it after adding your first goal.
          </Text>
          <View style={styles.featureList}>
            {[
              '📊 30-day momentum grid',
              '🎨 8 themes + full color control',
              '📝 Custom motivational quotes',
              '🔄 Updates every time you log progress',
            ].map((item, i) => (
              <View key={i} style={styles.featureItem}>
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.primaryBtn} onPress={handleFinish}>
            <Text style={styles.primaryBtnText}>Let's Go! 🚀</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  skipBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  skipText: { color: theme.colors.textMuted, fontSize: 14 },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: 100,
    marginBottom: 28,
  },
  heroDot: { width: 20, height: 20, borderRadius: 5 },
  heroDotFilled: { backgroundColor: theme.colors.primary },
  heroDotEmpty: { backgroundColor: theme.colors.border },
  heroEmoji: { fontSize: 64, marginBottom: 20 },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  stepBody: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: theme.radii.full,
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  selectionCount: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  presetList: { width: '100%', flex: 1 },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetInfo: { flex: 1 },
  presetTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  presetMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bottomActionArea: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    backgroundColor: theme.colors.background,
    paddingTop: 12,
    alignItems: 'center',
  },
  featureList: { width: '100%', gap: 10, marginBottom: 20 },
  featureItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureText: { color: theme.colors.text, fontSize: 15, fontWeight: '500' },
});
