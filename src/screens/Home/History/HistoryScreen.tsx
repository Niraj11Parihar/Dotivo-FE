import React, { useEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../../../components/common/Card";
import { ScreenWrapper } from "../../../components/common/ScreenWrapper";
import { theme } from "../../../config/constants/theme";
import { planService } from "../../../config/restClient";
import { useGoalStore } from "../../../store/slices/goalStore";
export default function HistoryScreen() {
  const { history, fetchHistory, isLoading, currentStreak, bestStreak, greenDaysThisMonth } = useGoalStore();

  const handleExport = async () => {
    try {
      Alert.alert("Generating Grid...", "Your 30-day motivation wallpaper is being prepared.");
      await planService.exportWallpaper();
      Alert.alert("Success", "Wallpaper generated! Check your backend / S3 URL.");
    } catch (error) {
      Alert.alert("Export Failed", "Make sure the wallpaper export backend is implemented.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const greenDays = history.filter((d) => d.status === "green").length;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Your 30-day momentum grid.</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Text style={styles.exportButtonText}>Export Wallpaper</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Green Days (30d)</Text>
            <Text style={styles.statValue}>{greenDays}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{currentStreak > 0 ? `🔥 ${currentStreak}d` : '—'}</Text>
          </Card>
        </View>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>{bestStreak > 0 ? `${bestStreak}d` : '—'}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Wins This Month</Text>
            <Text style={styles.statValue}>{greenDaysThisMonth}</Text>
          </Card>
        </View>

        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>30-Day Grid</Text>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <View style={styles.grid}>
              {Array.from({ length: 30 }).map((_, i) => {
                const day = history[i];
                return (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      day?.status === "green" && styles.dotGreen,
                      day?.status === "partial" && styles.dotPartial,
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotGreen]} />
            <Text style={styles.legendText}>Win (Daily Min Met)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotPartial]} />
            <Text style={styles.legendText}>Partial Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.dot} />
            <Text style={styles.legendText}>Incomplete</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.m,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.l,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  exportButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.m,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.l,
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.m,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  gridSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: theme.spacing.m,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  dot: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
  },
  dotGreen: {
    backgroundColor: theme.colors.primary,
  },
  dotPartial: {
    backgroundColor: theme.colors.primaryMuted,
  },
  legend: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.s,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legendText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});
