import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import AddTxnSheet from "../../src/AddTxnSheet";
import {
  categoryCsv,
  countTransactions,
  deleteCategory,
  deleteTransaction,
  getCategorySummary,
  getCurrency,
  listTransactions,
} from "../../src/db";
import { formatCurrency } from "../../src/format";
import { CHART_COLORS, useTheme } from "../../src/theme";
import { PAGE_SIZE, type CategorySummary, type Transaction } from "../../src/types";
import { Btn, Card, CenterLoad, EmptyState, FAB, Stat, Toast, TxnRow, TXN_H, useTopPad } from "../../src/ui";

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHART_COLORS[h % CHART_COLORS.length];
}

export default function CategoryTxns() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const cid = Number(categoryId);
  const router = useRouter();
  const t = useTheme();
  const [summary, setSummary] = useState<CategorySummary | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const topPad = useTopPad();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, page, n, cur] = await Promise.all([
        getCategorySummary(cid),
        listTransactions(cid, PAGE_SIZE, 0),
        countTransactions(cid),
        getCurrency(),
      ]);
      setSummary(sum);
      setTxns(page);
      setTotal(n);
      setCurrencyState(cur);
    } finally {
      setLoading(false);
    }
  }, [cid]);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || txns.length >= total) return;
    setLoadingMore(true);
    try {
      const page = await listTransactions(cid, PAGE_SIZE, txns.length);
      setTxns((p) => [...p, ...page]);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, txns.length, total, cid]);

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete transaction?", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id).then(load) },
      ]);
    },
    [load]
  );

  const onDeleteCat = useCallback(() => {
    Alert.alert("Delete category?", "Transactions inside will be deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCategory(cid);
          router.back();
        },
      },
    ]);
  }, [cid, router]);

  const onExport = useCallback(async () => {
    try {
      const csv = await categoryCsv(cid);
      const file = new File(Paths.cache, `category-${cid}.csv`);
      await file.write(csv);
      await Sharing.shareAsync(file.uri);
    } catch (e) {
      Alert.alert("Export failed", (e as Error).message);
    }
  }, [cid]);

  const fmt = useCallback((n: number) => formatCurrency(n, currency), [currency]);
  const openNew = useCallback(() => setShowNew(true), []);
  const closeNew = useCallback(() => setShowNew(false), []);
  const onSaved = useCallback(() => {
    load();
    say("Saved ✓");
  }, [load, say]);

  if (loading) return <CenterLoad />;
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <Text style={[s.h1, { color: t.text }]}>{summary?.name ?? ""}</Text>
      <Card>
        <View style={s.stats}>
          <Stat label="Spent" value={fmt(summary?.actual_spending ?? 0)} />
          <Stat label="Left" value={fmt(summary?.remaining_budget ?? 0)} />
        </View>
        <Text style={[s.sub, { color: t.sub }]}>
          {txns.length} of {total} · {summary?.utilization_percentage ?? 0}% used
        </Text>
      </Card>
      <View style={s.bar}>
        <Btn title="Export CSV" variant="ghost" size="sm" onPress={onExport} />
        <Btn title="Delete category" variant="ghost" size="sm" onPress={onDeleteCat} />
      </View>
      {txns.length === 0 ? (
        <EmptyState title="No transactions" hint="Tap + to add one." />
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(x) => String(x.id)}
          getItemLayout={(_, i) => ({ length: TXN_H, offset: TXN_H * i, index: i })}
          windowSize={5}
          maxToRenderPerBatch={20}
          initialNumToRender={20}
          removeClippedSubviews
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TxnRow
              name={item.description}
              category={summary?.name ?? ""}
              date={item.date}
              amount={`${item.type === "income" ? "+" : "-"}${fmt(item.amount)}`}
              isIncome={item.type === "income"}
              color={colorFor(summary?.name ?? "")}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <FAB onPress={openNew} label="Add transaction" />
      <AddTxnSheet
        visible={showNew}
        onClose={closeNew}
        categories={summary ? [{ id: summary.id, name: summary.name }] : []}
        initialCategoryId={cid}
        onSaved={onSaved}
      />
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12 },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  stats: { flexDirection: "row", gap: 12, marginBottom: 6 },
  sub: { fontSize: 12 },
  bar: { flexDirection: "row", gap: 8 },
  list: { gap: 8, paddingBottom: 110 },
});
