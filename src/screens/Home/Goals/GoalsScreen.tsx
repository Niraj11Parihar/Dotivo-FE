import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, Pressable, View } from "react-native";
import { ScreenWrapper } from "../../../components/common/ScreenWrapper";
import { theme } from "../../../config/constants/theme";
import { useGoalStore } from "../../../store/slices/goalStore";

export default function GoalsScreen() {
  const { templates, fetchTemplates, isLoading, removeTemplate } = useGoalStore();
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Goals</Text>
          <Text style={styles.subtitle}>Define your daily minimum wins.</Text>
        </View>
        <Pressable 
          style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.7 : 1 }]} 
          onPress={() => router.push("/modal" as any)}
        >
          <Plus color="#fff" size={24} />
        </Pressable>
      </View>

      {isLoading && templates.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.goalCard}>
              <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{item.title}</Text>
                <Text style={styles.goalDetail}>
                  Target: {item.targetCount} • {item.category}
                </Text>
              </View>
              {item.isDailyMinimum && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Min</Text>
                </View>
              )}
              <Pressable
                style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  Alert.alert("Delete Goal", "Are you sure you want to remove this goal template?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => removeTemplate(item._id) },
                  ]);
                }}
              >
                <Trash2 color={theme.colors.textMuted} size={20} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No templates yet. Click + to create one.</Text>}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.m,
    marginTop: theme.spacing.l,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight as any,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  list: {
    padding: theme.spacing.m,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorIndicator: {
    width: 12,
    height: 40,
    borderRadius: 6,
    marginRight: theme.spacing.m,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  goalDetail: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.xl,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
