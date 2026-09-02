import { useEffect, useState } from "react";
import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { Text, View } from "@/components/Themed";
import { api } from "@/src/api";
import type { DashboardSummary } from "@/src/types";

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard
      .summary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {summary ? (
        <View style={styles.card}>
          <Text>Years: {summary.year_count}</Text>
          <Text>Months: {summary.month_count}</Text>
          <Text>Transactions: {summary.total_transactions}</Text>
          <Text>Avg spending: {summary.avg_monthly_spending}</Text>
          {summary.highest_spend_month ? <Text>Highest: {summary.highest_spend_month.name}</Text> : null}
        </View>
      ) : (
        <Text>No data yet</Text>
      )}
      <Link href="/(tabs)/years" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Go to Years →</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  card: { gap: 6, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8 },
  link: { marginTop: 12, padding: 12, backgroundColor: "#2f95dc", borderRadius: 8, alignItems: "center" },
  linkText: { color: "#fff", fontWeight: "600" },
});
