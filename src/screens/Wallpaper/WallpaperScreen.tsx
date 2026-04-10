import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { theme } from '../../config/constants/theme';
import { useGoalStore, HistoryItem } from '../../store/slices/goalStore';
import { Download, Smartphone, Check, Palette } from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { openWallpaperPicker } from '../../../modules/wallpaper';

import { syncWallpaperData } from '../../utils';

const { width, height: screenHeight } = Dimensions.get('window');
const PREVIEW_SCALE = 0.7;
const PREVIEW_WIDTH = width * PREVIEW_SCALE;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 2;

const WALLPAPER_THEMES: Record<string, { background: string; dotFull: string; dotEmpty: string }> = {
  'Classic Slate': {
    background: '#0F172A',
    dotFull: '#10B981',
    dotEmpty: '#334155',
  },
  'Midnight': {
    background: '#000000',
    dotFull: '#8B5CF6',
    dotEmpty: '#1F2937',
  },
  'Emerald Forest': {
    background: '#064E3B',
    dotFull: '#34D399',
    dotEmpty: '#065F46',
  },
  'Oceanic': {
    background: '#1E3A8A',
    dotFull: '#38BDF8',
    dotEmpty: '#1E40AF',
  },
};

export default function WallpaperScreen() {
  const { history, currentPlan } = useGoalStore();
  const [selectedTheme, setSelectedTheme] = useState('Classic Slate');
  const viewShotRef = useRef<View>(null);

  const activeTheme = WALLPAPER_THEMES[selectedTheme] || WALLPAPER_THEMES['Classic Slate'];

  const today = new Date().toISOString().split('T')[0];
  
  // Get 30 days of history
  const momentumDots = Array.from({ length: 30 }).map((_, i) => {
    if (i === 0) {
      const score = currentPlan?.goals 
        ? currentPlan.goals.filter(g => g.status === 'green').length / Math.max(currentPlan.goals.length, 1)
        : 0;
      return { completionScore: score };
    }
    return history[i - 1];
  });

  const handleSelectTheme = (t: string) => {
    setSelectedTheme(t);
    const todayScore = momentumDots[0]?.completionScore || 0;
    syncWallpaperData(todayScore, history, t);
  };

  const handleApplyAndroid = () => {
    try {
      openWallpaperPicker();
    } catch (e) {
      Alert.alert(
        'Development Build Required',
        'This feature requires a native build. Use "Export Image" for now or run the development build to enable the Live Wallpaper service.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleExportImage = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not supported', 'Wallpaper export is not supported on web.');
        return;
      }

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need permission to save images to your gallery.');
        return;
      }

      if (!captureRef) {
        throw new Error('Native ViewShot module not found');
      }

      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });

      if (Platform.OS === 'android') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Saved!', 'Wallpaper has been saved to your gallery.');
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert(
        'Feature Unavailable',
        'This feature requires a Development Build. Please run "eas build" or "npx expo run:android" to include native modules.'
      );
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dynamic Wallpaper</Text>
        <Text style={styles.subtitle}>
          Your discipline, visualized on your home screen.
        </Text>

        {/* Wallpaper Preview */}
        <View style={styles.previewContainer}>
          <View ref={viewShotRef} collapsable={false} style={styles.phoneFrame}>
            <View style={[styles.wallpaperContent, { backgroundColor: activeTheme.background }]}>
              {/* Mock Status Bar */}
              <View style={styles.statusBarMock} />
              
              {/* Mock Clock */}
              <Text style={styles.clockMock}>09:41</Text>
              <Text style={styles.dateMock}>Friday, April 10</Text>

              {/* Momentum Grid on Wallpaper */}
              <View style={styles.gridOverlay}>
                <View style={styles.gridContainer}>
                  {momentumDots.map((item, i) => {
                    let score = item?.completionScore ?? 0;
                    if (score > 1) score = score / 100;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: activeTheme.dotEmpty },
                          score > 0 && {
                            backgroundColor: activeTheme.dotFull,
                            opacity: 0.2 + score * 0.8,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={styles.wallpaperLabel}>CONSISTENCY GRID</Text>
              </View>

              {/* Bottom Quote Mock */}
              <Text style={styles.quoteMock}>"Discipline equals freedom."</Text>
            </View>
          </View>
        </View>

        {/* Theme Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette color={theme.colors.text} size={20} />
            <Text style={styles.sectionTitle}>Themes</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
            {Object.keys(WALLPAPER_THEMES).map((t) => (
              <Pressable
                key={t}
                style={[styles.themeChip, selectedTheme === t && styles.themeChipSelected]}
                onPress={() => handleSelectTheme(t)}
              >
                <Text style={[styles.themeText, selectedTheme === t && styles.themeTextSelected]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Pressable style={styles.primaryAction} onPress={handleApplyAndroid}>
            <Smartphone color="#fff" size={20} />
            <Text style={styles.primaryActionText}>Apply Live Wallpaper</Text>
          </Pressable>

          <Pressable style={styles.secondaryAction} onPress={handleExportImage}>
            <Download color={theme.colors.text} size={20} />
            <Text style={styles.secondaryActionText}>Export Image (iOS/Save)</Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            The wallpaper updates automatically on Android whenever you complete a goal. On iPhone, use the export option or the Dotivo widget.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.m,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit',
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.m,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  phoneFrame: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: '#334155',
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  wallpaperContent: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statusBarMock: {
    width: '100%',
    height: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  clockMock: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    marginTop: 20,
  },
  dateMock: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
  },
  gridOverlay: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    width: PREVIEW_WIDTH - 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  wallpaperLabel: {
    marginTop: 8,
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
  quoteMock: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: theme.spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  themeScroll: {
    flexDirection: 'row',
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themeChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  themeText: {
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  themeTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionContainer: {
    gap: 12,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: theme.radii.m,
    gap: 10,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryAction: {
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: theme.radii.m,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryActionText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.m,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
