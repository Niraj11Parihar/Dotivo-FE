import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  Platform,
  TextInput,
  ImageBackground,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { theme } from '../../config/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoalStore } from '../../store/slices/goalStore';
import {
  Download, Smartphone, Palette, Image as ImageIcon,
  Type, Grid, X, ChevronRight, Check, RefreshCw, Plus
} from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { openWallpaperPicker } from '../../../modules/wallpaper';
import {
  syncWallpaperData, WallpaperConfig, getWallpaperPayload,
  DEFAULT_WALLPAPER_CONFIG, DotShape, DotSize,
} from '../../utils/wallpaper';
import { WALLPAPER_THEMES, WallpaperTheme, getThemeById } from '../../config/constants/wallpaperThemes';
const { width } = Dimensions.get('window');
const PREVIEW_SCALE = 0.62;
const PREVIEW_WIDTH = width * PREVIEW_SCALE;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * (19.5 / 9); // modern phone aspect ratio

const DOT_SHAPES: { id: DotShape; label: string }[] = [
  { id: 'square', label: '▪' },
  { id: 'rounded', label: '▪' },
  { id: 'circle', label: '●' },
  { id: 'diamond', label: '◆' },
];

const DOT_SIZES: { id: DotSize; label: string; px: number }[] = [
  { id: 'small', label: 'S', px: 8 },
  { id: 'medium', label: 'M', px: 12 },
  { id: 'large', label: 'L', px: 16 },
];

function getDotRadius(shape: DotShape, size: number): number {
  switch (shape) {
    case 'square': return 2;
    case 'rounded': return size * 0.3;
    case 'circle': return size / 2;
    case 'diamond': return 2;
    default: return size * 0.3;
  }
}

function getDotSizePx(dotSize: DotSize): number {
  return DOT_SIZES.find(d => d.id === dotSize)?.px ?? 12;
}

// Section wrapper for collapsible sections
function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={sectionStyles.container}>
      <Pressable style={sectionStyles.header} onPress={() => setOpen(o => !o)}>
        <View style={sectionStyles.headerLeft}>
          {icon}
          <Text style={sectionStyles.title}>{title}</Text>
        </View>
        <ChevronRight
          color={theme.colors.textMuted}
          size={16}
          style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
        />
      </Pressable>
      {open && <View style={sectionStyles.body}>{children}</View>}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  body: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: theme.colors.border },
});

// Inline color swatch row
function ColorRow({
  label, value, onPress,
}: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={colorRowStyles.row}>
      <Text style={colorRowStyles.label}>{label}</Text>
      <Pressable
        style={[colorRowStyles.swatch, { backgroundColor: value }]}
        onPress={onPress}
      />
    </View>
  );
}

const colorRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: { color: theme.colors.textMuted, fontSize: 14 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});

export default function WallpaperScreen() {
  const insets = useSafeAreaInsets();
  const { history, currentPlan, customThemes, saveCustomTheme, quotes } = useGoalStore();
  const viewShotRef = useRef<View>(null);

  // ── Config State ──────────────────────────────────────────────────
  const [selectedThemeId, setSelectedThemeId] = useState('classic_slate');
  const [config, setConfig] = useState<WallpaperConfig>(DEFAULT_WALLPAPER_CONFIG);
  const [bgImageUri, setBgImageUri] = useState<string | null>(null);

  // Color Picker & Custom Theme
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [colorTarget, setColorTarget] = useState<'primary' | 'empty' | 'bg' | 'titleColor' | 'subtitleColor' | null>(null);
  const [showSaveThemeModal, setShowSaveThemeModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeEmoji, setNewThemeEmoji] = useState('✨');

  // Load persisted config on mount
  useEffect(() => {
    getWallpaperPayload().then((payload) => {
      if (payload?.config) {
        setConfig(payload.config);
        setSelectedThemeId(payload.themeId || 'classic_slate');
        if (payload.config.backgroundImage.enabled && payload.config.backgroundImage.uri) {
          setBgImageUri(payload.config.backgroundImage.uri);
        }
      }
    });
  }, []);

  // Sync config to native & AsyncStorage whenever it changes (debounced)
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSync = useCallback((cfg: WallpaperConfig) => {
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      const todayScore = currentPlan?.goals
        ? currentPlan.goals.filter(g => g.status === 'green').length /
        Math.max(currentPlan.goals.length, 1)
        : 0;
      syncWallpaperData(todayScore, history, selectedThemeId, cfg);
    }, 600);
  }, [history, currentPlan, selectedThemeId]);

  const updateConfig = useCallback((patch: Partial<WallpaperConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch } as WallpaperConfig;
      doSync(next);
      return next;
    });
  }, [doSync]);

  const updateColors = (patch: Partial<WallpaperConfig['colors']>) =>
    updateConfig({ colors: { ...config.colors, ...patch } });

  const updateText = (patch: Partial<WallpaperConfig['text']>) =>
    updateConfig({ text: { ...config.text, ...patch } });

  const updateLayout = (patch: Partial<WallpaperConfig['layout']>) =>
    updateConfig({ layout: { ...config.layout, ...patch } });

  // ── Theme Selection ───────────────────────────────────────────────
  const handleSelectTheme = (t: WallpaperTheme) => {
    setSelectedThemeId(t.id);
    const next: WallpaperConfig = {
      ...config,
      colors: { primary: t.dotFull, empty: t.dotEmpty, background: t.background },
      text: { ...config.text, titleColor: t.titleColor, subtitleColor: t.subtitleColor },
    };
    setConfig(next);
    doSync(next);
  };

  // ── Color Picker ──────────────────────────────────────────────────
  const openPicker = (target: typeof colorTarget) => {
    setColorTarget(target);
    setColorPickerVisible(true);
  };

  const handleColorPicked = (color: string) => {
    setSelectedThemeId('custom');
    if (colorTarget === 'primary') updateColors({ primary: color });
    else if (colorTarget === 'empty') updateColors({ empty: color });
    else if (colorTarget === 'bg') updateColors({ background: color });
    else if (colorTarget === 'titleColor') updateText({ titleColor: color });
    else if (colorTarget === 'subtitleColor') updateText({ subtitleColor: color });
    setColorPickerVisible(false);
  };

  const handleSaveCustomTheme = () => {
    if (!newThemeName.trim() || !newThemeEmoji.trim()) return;
    const newId = `custom_${Date.now()}`;
    saveCustomTheme({
      id: newId,
      name: newThemeName.trim(),
      emoji: newThemeEmoji.trim(),
      colors: {
        primary: config.colors.primary,
        empty: config.colors.empty,
        background: config.colors.background,
      }
    });
    setSelectedThemeId(newId);
    setShowSaveThemeModal(false);
    setNewThemeName('');
    setNewThemeEmoji('✨');
  };

  // ── Background Image ─────────────────────────────────────────────
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setBgImageUri(uri);
      let finalUri = uri;
      if (Platform.OS === 'android') {
        try {
          const filename = uri.split('/').pop() || 'wallpaper_bg.jpg';
          const newPath = (FileSystem.documentDirectory as string) + filename;
          await FileSystem.copyAsync({ from: uri, to: newPath });
          finalUri = newPath;
        } catch (e) { }
      }
      updateConfig({ backgroundImage: { enabled: true, uri: finalUri } });
    }
  };

  const handleRemoveImage = () => {
    setBgImageUri(null);
    updateConfig({ backgroundImage: { enabled: false, uri: '' } });
  };

  // ── Reset to theme defaults ─────────────────────────────────────
  const handleReset = () => {
    const t = getThemeById(selectedThemeId);
    handleSelectTheme(t);
    setBgImageUri(null);
    const resetConfig: WallpaperConfig = {
      ...DEFAULT_WALLPAPER_CONFIG,
      colors: { primary: t.dotFull, empty: t.dotEmpty, background: t.background },
      text: {
        ...DEFAULT_WALLPAPER_CONFIG.text,
        titleColor: t.titleColor,
        subtitleColor: t.subtitleColor,
      },
    };
    setConfig(resetConfig);
    doSync(resetConfig);
  };

  // ── Apply Live Wallpaper ─────────────────────────────────────────
  const handleApplyAndroid = () => {
    try {
      openWallpaperPicker();
    } catch (e) {
      Alert.alert(
        'Development Build Required',
        'This feature requires a native build. Use "Export Image" for now or run the development build.',
        [{ text: 'OK' }]
      );
    }
  };

  // ── Export Image ─────────────────────────────────────────────────
  const handleExportImage = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not supported', 'Export is not supported on web.');
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need permission to save images to your gallery.');
        return;
      }
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      if (Platform.OS === 'android') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Saved! 🎉', 'Wallpaper preview saved to your gallery.');
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      Alert.alert('Feature Unavailable', 'Please run a Development Build to use this feature.');
    }
  };

  // ── Preview Rendering ─────────────────────────────────────────────
  const momentumDots = Array.from({ length: 30 }).map((_, i) => {
    if (i === 0) {
      const score = currentPlan?.goals
        ? currentPlan.goals.filter(g => g.status === 'green').length /
        Math.max(currentPlan.goals.length, 1)
        : 0;
      return { completionScore: score };
    }
    return history[i - 1];
  });

  const dotPx = getDotSizePx(config.layout.dotSize);
  const dotBorderRadius = getDotRadius(config.layout.dotShape, dotPx);
  const previewDotPx = Math.max(4, Math.floor((PREVIEW_WIDTH - 48) / config.layout.columns) - 5);
  const previewBorderRadius = getDotRadius(config.layout.dotShape, previewDotPx);

  const WallpaperPreviewContent = (
    <View
      ref={viewShotRef}
      collapsable={false}
      style={[styles.phoneFrame, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
    >
      {bgImageUri ? (
        <ImageBackground
          source={{ uri: bgImageUri }}
          style={styles.wallpaperBg}
          imageStyle={{ borderRadius: 28, opacity: 0.75 }}
        >
          <View style={[styles.wallpaperBg, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
            <WallpaperContentInner
              config={config}
              momentumDots={momentumDots}
              previewDotPx={previewDotPx}
              previewBorderRadius={previewBorderRadius}
            />
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.wallpaperBg, { backgroundColor: config.colors.background }]}>
          <WallpaperContentInner
            config={config}
            momentumDots={momentumDots}
            previewDotPx={previewDotPx}
            previewBorderRadius={previewBorderRadius}
          />
        </View>
      )}
    </View>
  );

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Live Wallpaper</Text>
            <Text style={styles.subtitle}>Your discipline, visualized.</Text>
          </View>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <RefreshCw color={theme.colors.textMuted} size={16} />
          </Pressable>
        </View>

        {/* Phone Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.phoneOuter}>
            <View style={styles.phoneSpeaker} />
            {WallpaperPreviewContent}
            <View style={styles.phoneBottom} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.primaryAction, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleApplyAndroid}
          >
            <Smartphone color="#fff" size={18} />
            <Text style={styles.primaryActionText}>Apply Live Wallpaper</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryAction, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleExportImage}
          >
            <Download color={theme.colors.text} size={18} />
            <Text style={styles.secondaryActionText}>Save Image</Text>
          </Pressable>
        </View>

        {/* Theme Presets */}
        <Section icon={<Palette color={theme.colors.primary} size={18} />} title="Theme Presets">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <Pressable
              style={[styles.themeCard, selectedThemeId === 'custom' && styles.themeCardSelected]}
              onPress={() => {
                setSelectedThemeId('custom');
                setShowSaveThemeModal(true);
              }}
            >
              <View style={[styles.themeCardBg, { backgroundColor: theme.colors.cardElevated, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' }]}>
                <Plus color={theme.colors.textMuted} size={32} />
              </View>
            </Pressable>
            {[...WALLPAPER_THEMES, ...customThemes].map((t) => {
              const isSelected = selectedThemeId === t.id;
              const bg = (t as any).background || (t as any).colors?.background;
              const dotF = (t as any).dotFull || (t as any).colors?.primary;
              const dotE = (t as any).dotEmpty || (t as any).colors?.empty;

              return (
                <Pressable
                  key={t.id}
                  style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                  onPress={() => {
                    setSelectedThemeId(t.id);
                    const next: WallpaperConfig = {
                      ...config,
                      colors: { primary: dotF, empty: dotE, background: bg },
                      text: {
                        ...config.text,
                        titleColor: (t as any).titleColor || config.text.titleColor,
                        subtitleColor: (t as any).subtitleColor || config.text.subtitleColor
                      },
                    };
                    setConfig(next);
                    doSync(next);
                  }}
                >
                  <View style={[styles.themeCardBg, { backgroundColor: bg }]}>
                    <View style={styles.themeCardDots}>
                      {[1, 1, 0, 1, 0, 1, 1, 0, 1].map((filled, i) => (
                        <View
                          key={i}
                          style={[
                            styles.themeCardDot,
                            { backgroundColor: filled ? dotF : dotE },
                          ]}
                        />
                      ))}
                    </View>
                    {isSelected && (
                      <View style={styles.themeCardCheck}>
                        <Check color="#fff" size={12} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.themeCardEmoji, { fontSize: 24, marginTop: 4 }]}>{t.emoji}</Text>
                  <Text style={[styles.themeCardName, isSelected && { color: theme.colors.primaryLight }]}>
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

        </Section>

        {/* Colors */}
        <Section icon={<Palette color={theme.colors.primary} size={18} />} title="Colors">
          <ColorRow label="Completed dot" value={config.colors.primary} onPress={() => openPicker('primary')} />
          <ColorRow label="Empty dot" value={config.colors.empty} onPress={() => openPicker('empty')} />
          <ColorRow label="Background" value={config.colors.background} onPress={() => openPicker('bg')} />
          <ColorRow label="Title color" value={config.text.titleColor} onPress={() => openPicker('titleColor')} />
          <View style={[colorRowStyles.row, { borderBottomWidth: 0 }]}>
            <Text style={colorRowStyles.label}>Subtitle color</Text>
            <Pressable
              style={[colorRowStyles.swatch, { backgroundColor: config.text.subtitleColor }]}
              onPress={() => openPicker('subtitleColor')}
            />
          </View>
        </Section>

        {/* Text */}
        <Section icon={<Type color={theme.colors.primary} size={18} />} title="Motivational Text">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={config.text.title}
              onChangeText={(v) => updateText({ title: v })}
              placeholder="e.g. DOTIVO"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={20}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subtitle</Text>
            <TextInput
              style={styles.textInput}
              value={config.text.subtitle}
              onChangeText={(v) => updateText({ subtitle: v })}
              placeholder="e.g. CONSISTENCY"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={30}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quote on wallpaper</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 56 }]}
              value={config.text.quoteText}
              onChangeText={(v) => updateText({ quoteText: v })}
              placeholder="Your motivational quote..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={100}
            />
            <Pressable
              style={styles.autofillQuoteBtn}
              onPress={() => updateText({ quoteText: quotes.length > 0 ? quotes[new Date().getDate() % quotes.length] : '' })}
            >
              <Text style={styles.autofillQuoteBtnText}>Use today's quote</Text>
            </Pressable>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.inputLabel}>Show text on wallpaper</Text>
            <Switch
              value={config.text.showText}
              onValueChange={(v) => updateText({ showText: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.inputLabel}>Show quote on wallpaper</Text>
            <Switch
              value={config.text.showQuote}
              onValueChange={(v) => updateText({ showQuote: v })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </Section>

        {/* Grid Layout (Advanced Customization) */}
        <Section icon={<Grid color={theme.colors.primary} size={18} />} title="Advanced Customization">
          {/* Columns */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Columns</Text>
          <View style={styles.chipRow}>
            {[4, 5, 6, 7, 8].map(col => (
              <Pressable
                key={col}
                style={[styles.chip, config.layout.columns === col && styles.chipActive]}
                onPress={() => updateLayout({ columns: col })}
              >
                <Text style={[styles.chipText, config.layout.columns === col && styles.chipTextActive]}>
                  {col}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Dot Shape */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Dot Shape</Text>
          <View style={styles.chipRow}>
            {DOT_SHAPES.map(s => (
              <Pressable
                key={s.id}
                style={[
                  styles.chip,
                  { minWidth: 56 },
                  config.layout.dotShape === s.id && styles.chipActive,
                ]}
                onPress={() => updateLayout({ dotShape: s.id })}
              >
                <Text style={[
                  styles.chipText,
                  { fontSize: s.id === 'diamond' ? 14 : 18 },
                  config.layout.dotShape === s.id && styles.chipTextActive,
                ]}>
                  {s.label}
                </Text>
                <Text style={[styles.chipSubText, config.layout.dotShape === s.id && { color: theme.colors.primaryLight }]}>
                  {s.id}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Dot Size */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Dot Size</Text>
          <View style={styles.chipRow}>
            {DOT_SIZES.map(s => (
              <Pressable
                key={s.id}
                style={[styles.chip, { flex: 1 }, config.layout.dotSize === s.id && styles.chipActive]}
                onPress={() => updateLayout({ dotSize: s.id })}
              >
                <Text style={[styles.chipText, config.layout.dotSize === s.id && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Opacity range */}
          <View style={{ marginTop: 16 }}>
            <View style={styles.opacityRow}>
              <Text style={styles.inputLabel}>Min opacity (empty days)</Text>
              <Text style={styles.opacityValue}>{Math.round(config.layout.dotOpacityMin * 100)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map(v => (
                <Pressable
                  key={v}
                  style={[
                    styles.sliderStop,
                    config.layout.dotOpacityMin === v && styles.sliderStopActive,
                  ]}
                  onPress={() => updateLayout({ dotOpacityMin: v })}
                >
                  <Text style={[styles.sliderStopText, config.layout.dotOpacityMin === v && { color: '#fff' }]}>
                    {Math.round(v * 100)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.opacityRow, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>Max opacity (completed days)</Text>
              <Text style={styles.opacityValue}>{Math.round(config.layout.dotOpacityMax * 100)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
                <Pressable
                  key={v}
                  style={[
                    styles.sliderStop,
                    config.layout.dotOpacityMax === v && styles.sliderStopActive,
                  ]}
                  onPress={() => updateLayout({ dotOpacityMax: v })}
                >
                  <Text style={[styles.sliderStopText, config.layout.dotOpacityMax === v && { color: '#fff' }]}>
                    {Math.round(v * 100)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Section>

        {/* Background Image */}
        <Section icon={<ImageIcon color={theme.colors.primary} size={18} />} title="Background Image">
          {bgImageUri ? (
            <View style={styles.bgImageRow}>
              <Image source={{ uri: bgImageUri }} style={styles.bgImageThumb} />
              <View style={styles.bgImageInfo}>
                <Text style={styles.bgImageLabel}>Custom image active</Text>
                <Pressable onPress={handleRemoveImage}>
                  <Text style={styles.bgImageRemove}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.pickImageBtn} onPress={handlePickImage}>
              <ImageIcon color={theme.colors.primary} size={20} />
              <Text style={styles.pickImageBtnText}>Select from Gallery</Text>
            </Pressable>
          )}
          <Text style={styles.bgImageNote}>
            Your background image will be visible behind the momentum grid on the wallpaper.
          </Text>
        </Section>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Changes save automatically. Tap "Apply Live Wallpaper" to activate the live wallpaper on your Android home screen.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal visible={colorPickerVisible} animationType="fade" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select a color</Text>

            {colorPickerVisible && (
              <ColorPicker
                style={{ width: '100%', gap: 16, flex: 1 }}
                value={
                  colorTarget === 'primary' ? config.colors.primary :
                    colorTarget === 'empty' ? config.colors.empty :
                      colorTarget === 'bg' ? config.colors.background :
                        colorTarget === 'titleColor' ? config.text.titleColor :
                          colorTarget === 'subtitleColor' ? config.text.subtitleColor : '#ffffff'
                }
                onComplete={(color) => {
                  'worklet';
                  runOnJS(handleColorPicked)(color.hex);
                }}
              >
                <Preview style={{ height: 40, borderRadius: 8, marginBottom: 8 }} />
                <Panel1 style={{ flex: 1, borderRadius: 8, marginBottom: 8 }} />
                <HueSlider style={{ height: 32, borderRadius: 16 }} />
              </ColorPicker>
            )}

            <Pressable style={styles.pickerCloseBtn} onPress={() => setColorPickerVisible(false)}>
              <X color={theme.colors.textMuted} size={18} />
              <Text style={styles.pickerCloseBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Save Theme Modal */}
      <Modal visible={showSaveThemeModal} animationType="fade" transparent>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { gap: 16 }]}>
            <Text style={styles.pickerTitle}>Save Theme Preset</Text>

            <View>
              <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Emoji</Text>
              <TextInput
                style={styles.textInput}
                value={newThemeEmoji}
                onChangeText={setNewThemeEmoji}
                maxLength={2}
              />
            </View>

            <View>
              <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Theme Name</Text>
              <TextInput
                style={styles.textInput}
                value={newThemeName}
                onChangeText={setNewThemeName}
                placeholder="e.g. My Custom Vibe"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={20}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable
                style={[styles.primaryAction, { flex: 1, backgroundColor: theme.colors.card }]}
                onPress={() => setShowSaveThemeModal(false)}
              >
                <Text style={[styles.primaryActionText, { color: theme.colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryAction, { flex: 1, opacity: newThemeName.trim() ? 1 : 0.5 }]}
                onPress={handleSaveCustomTheme}
                disabled={!newThemeName.trim()}
              >
                <Text style={styles.primaryActionText}>Save Theme</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

// Wallpaper inner content (extracted to avoid duplication between BG image / plain BG)
function WallpaperContentInner({
  config,
  momentumDots,
  previewDotPx,
  previewBorderRadius,
}: {
  config: WallpaperConfig;
  momentumDots: Array<{ completionScore: number } | undefined>;
  previewDotPx: number;
  previewBorderRadius: number;
}) {
  return (
    <View style={innerStyles.content}>
      <View style={innerStyles.statusBar} />
      {config.text.showText && (
        <>
          <Text style={innerStyles.clock}>09:41</Text>
          <Text style={[innerStyles.dateText, { color: config.text.subtitleColor }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </>
      )}
      <View style={innerStyles.gridCard}>
        <View style={[innerStyles.grid, { gap: Math.max(2, Math.floor(previewDotPx * 0.3)) }]}>
          {momentumDots.map((item, i) => {
            let score = item?.completionScore ?? 0;
            if (score > 1) score = score / 100;
            const opacity = score > 0
              ? config.layout.dotOpacityMin + score * (config.layout.dotOpacityMax - config.layout.dotOpacityMin)
              : config.layout.dotOpacityMin;
            return (
              <View
                key={i}
                style={[
                  {
                    width: previewDotPx,
                    height: previewDotPx,
                    borderRadius: previewBorderRadius,
                    backgroundColor: score > 0 ? config.colors.primary : config.colors.empty,
                    opacity: score > 0 ? opacity : 0.4,
                  },
                  config.layout.dotShape === 'diamond' && { transform: [{ rotate: '45deg' }] }
                ]}
              />
            );
          })}
        </View>
        {config.text.showText && (
          <View style={innerStyles.textBlock}>
            <Text style={[innerStyles.titleText, { color: config.text.titleColor }]} numberOfLines={1}>
              {config.text.title}
            </Text>
            <Text style={[innerStyles.subtitleText, { color: config.text.subtitleColor }]} numberOfLines={1}>
              {config.text.subtitle}
            </Text>
          </View>
        )}
      </View>
      {config.text.showQuote && config.text.quoteText ? (
        <Text style={[innerStyles.quoteText, { color: config.text.subtitleColor }]} numberOfLines={3}>
          "{config.text.quoteText}"
        </Text>
      ) : null}
    </View>
  );
}

const innerStyles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  statusBar: { width: '100%', height: 16 },
  clock: { fontSize: 36, fontWeight: '200', color: '#fff', marginTop: 16, letterSpacing: -1 },
  dateText: { fontSize: 9, marginBottom: 12 },
  gridCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  textBlock: { marginTop: 8, alignItems: 'center' },
  titleText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  subtitleText: { fontSize: 5, letterSpacing: 1.5, marginTop: 2 },
  quoteText: {
    fontSize: 6,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 10,
    lineHeight: 9,
    opacity: 0.7,
  },
});

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 2 },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  phoneOuter: {
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 36,
    padding: 6,
    borderWidth: 2,
    borderColor: '#2a2a4a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  phoneSpeaker: {
    width: 40,
    height: 4,
    backgroundColor: '#2a2a4a',
    borderRadius: 2,
    marginBottom: 6,
  },
  phoneFrame: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  phoneBottom: {
    width: 30,
    height: 4,
    backgroundColor: '#2a2a4a',
    borderRadius: 2,
    marginTop: 6,
  },
  wallpaperBg: { flex: 1, borderRadius: 28 },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: theme.radii.m,
    gap: 8,
  },
  primaryActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryAction: {
    flex: 1,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: theme.radii.m,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryActionText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  themeCard: {
    alignItems: 'center',
    marginRight: 10,
    opacity: 0.7,
  },
  themeCardSelected: { opacity: 1 },
  themeCardBg: {
    width: 64,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  themeCardDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    width: 40,
    justifyContent: 'center',
  },
  themeCardDot: { width: 9, height: 9, borderRadius: 2 },
  themeCardCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCardEmoji: { fontSize: 14, marginTop: 4 },
  themeCardName: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2, fontWeight: '600' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 6, fontWeight: '600' },
  textInput: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.m,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  autofillQuoteBtn: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  autofillQuoteBtnText: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'nowrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.s,
    backgroundColor: theme.colors.cardElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minWidth: 40,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  chipText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 15 },
  chipTextActive: { color: theme.colors.primaryLight },
  chipSubText: { color: theme.colors.textFaint, fontSize: 8, marginTop: 2, fontWeight: '600' },
  opacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  opacityValue: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
  sliderTrack: { flexDirection: 'row', gap: 6, marginTop: 8 },
  sliderStop: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.s,
    backgroundColor: theme.colors.cardElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  sliderStopActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  sliderStopText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.cardElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radii.m,
    paddingVertical: 16,
    marginTop: 12,
  },
  pickImageBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  bgImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.m,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bgImageThumb: { width: 56, height: 56, borderRadius: 8 },
  bgImageInfo: { flex: 1 },
  bgImageLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  bgImageRemove: { color: theme.colors.error, fontSize: 13, marginTop: 4 },
  bgImageNote: { fontSize: 12, color: theme.colors.textMuted, marginTop: 10, lineHeight: 17 },
  infoBox: {
    padding: 14,
    backgroundColor: 'rgba(99,102,241,0.06)',
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    marginTop: 4,
  },
  infoText: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 18 },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '88%',
    height: 420,
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  pickerCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerCloseBtnText: { color: theme.colors.text, fontWeight: '600' },
});
