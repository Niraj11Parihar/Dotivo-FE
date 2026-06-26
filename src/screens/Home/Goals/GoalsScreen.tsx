import { useRouter } from 'expo-router';
import { Plus, Pencil, Trash2, Target, Repeat } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  View,
  Modal,
} from 'react-native';
import { ScreenWrapper } from '../../../components/common/ScreenWrapper';
import { theme } from '../../../config/constants/theme';
import { useGoalStore, GoalTemplate } from '../../../store/slices/goalStore';
import CreateGoalModal from '../../../components/modals/CreateGoalModal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getFrequencyLabel(template: GoalTemplate): string {
  if (template.frequencyType === 'specific_days' && template.selectedDays?.length) {
    return template.selectedDays.map(d => DAY_NAMES[d]).join(', ');
  }
  if (template.frequencyType === 'weekly') return 'Weekly';
  return 'Daily';
}

export default function GoalsScreen() {
  const { templates, fetchTemplates, isLoading, removeTemplate } = useGoalStore();
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = (item: GoalTemplate) => {
    Alert.alert('Remove Goal', `Remove "${item.title}" from your goals?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeTemplate(item._id),
      },
    ]);
  };

  const minimumGoals = templates.filter(t => t.isDailyMinimum);
  const bonusGoals = templates.filter(t => !t.isDailyMinimum);

  const renderGoalCard = ({ item }: { item: GoalTemplate }) => (
    <View style={styles.goalCard}>
      <View style={[styles.accentBar, { backgroundColor: item.color }]} />
      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.goalMeta}>
          <View style={styles.metaPill}>
            <Target size={10} color={theme.colors.textMuted} />
            <Text style={styles.metaText}>
              {item.targetCount > 1 ? `${item.targetCount} units` : '1 session'}
            </Text>
          </View>
          <View style={styles.metaPill}>
            <Repeat size={10} color={theme.colors.textMuted} />
            <Text style={styles.metaText}>{getFrequencyLabel(item)}</Text>
          </View>
          {item.category ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.goalActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => setEditingTemplate(item)}
        >
          <Pencil color={theme.colors.textMuted} size={17} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => handleDelete(item)}
        >
          <Trash2 color={theme.colors.error} size={17} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Goals</Text>
          <Text style={styles.subtitle}>
            {templates.length === 0 ? 'Add your first goal below.' : `${templates.length} goal${templates.length !== 1 ? 's' : ''} tracked`}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.push('/modal' as any)}
        >
          <Plus color="#fff" size={22} />
        </Pressable>
      </View>

      {isLoading && templates.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : templates.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>
            Add goals to start tracking your daily wins. We have templates ready for students, fitness, coding, and more.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/modal' as any)}>
            <Plus color="#fff" size={18} />
            <Text style={styles.emptyBtnText}>Add First Goal</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {minimumGoals.length > 0 && (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>⭐ Daily Minimums</Text>
                  </View>
                  <Text style={styles.sectionCount}>{minimumGoals.length}</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => {
            const isLastMinimum = item.isDailyMinimum && index === minimumGoals.length - 1 && bonusGoals.length > 0;
            return (
              <>
                {renderGoalCard({ item })}
                {isLastMinimum && bonusGoals.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionBadge, styles.sectionBadgeBonus]}>
                      <Text style={[styles.sectionBadgeText, { color: theme.colors.warning }]}>🎯 Bonus Goals</Text>
                    </View>
                    <Text style={styles.sectionCount}>{bonusGoals.length}</Text>
                  </View>
                )}
              </>
            );
          }}
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={!!editingTemplate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingTemplate(null)}
      >
        {editingTemplate && (
          <CreateGoalModal
            initialData={editingTemplate}
          />
        )}
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: theme.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  sectionBadgeBonus: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
  },
  sectionBadgeText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  sectionCount: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  goalInfo: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  goalTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  goalMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' },
  goalActions: { flexDirection: 'row', paddingRight: 8, gap: 2 },
  actionBtn: {
    padding: 10,
    borderRadius: theme.radii.s,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.radii.full,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
