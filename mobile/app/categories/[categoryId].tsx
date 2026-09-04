import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  categoryCsv,
  countTransactions,
  createTransaction,
  deleteTransaction,
  getCategorySummary,
  getCurrency,
  listTransactions,
} from "../../src/db";
import { formatCurrency, todayISO } from "../../src/format";
import { PAGE_SIZE, type CategorySummary, type Transaction } from "../../src/types";
import { Btn, C, Card, CenterLoad, Empty, Field, Sheet, Stat, TxnRow, TXN_H } from "../../src/ui";

export default function CategoryTxns() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const cid = Number(categoryId);
  const [summary, setSummary] = useState<CategorySummary | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [currency, setCurrencyState] = useState("$");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

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

  const onCreate = useCallback(async () => {
    try {
      await createTransaction(cid, Number(amount), type, desc, todayISO());
      setDesc("");
      setAmount("");
      setType("expense");
      setShowNew(false);
      load();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }, [cid, amount, type, desc, load]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete transaction?", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id).then(load) },
      ]);
    },
    [load]
  );

  const onExport = useCallback(async () => {
    try {
      const csv = await categoryCsv(cid);
      const path = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}category-${cid}.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert("Export failed", (e as Error).message);
    }
  }, [cid]);

  const openNew = useCallback(() => setShowNew(true), []);
  const closeNew = useCallback(() => setShowNew(false), []);
  const toExpense = useCallback(() => setType("expense"), []);
  const toIncome = useCallback(() => setType("income"), []);

  if (loading) return <CenterLoad />;
  return (
    <View style={s.wrap}>
      <Card>
        <Text style={s.title}>{summary?.name ?? ""}</Text>
        <View style={s.stats}>
          <Stat label="Spent" value={formatCurrency(summary?.actual_spending ?? 0, currency)} />
          <Stat label="Left" value={formatCurrency(summary?.remaining_budget ?? 0, currency)} />
        </View>
        <Text style={s.sub}>
          {txns.length} of {total} · {summary?.utilization_percentage ?? 0}% used
        </Text>
      </Card>
      <View style={s.bar}>
        <Btn title="+ Transaction" onPress={openNew} />
        <Btn title="Export CSV" variant="outline" onPress={onExport} />
      </View>
      {txns.length === 0 ? (
        <Empty title="No transactions" hint="Add your first transaction." />
      ) : (
        <FlatList
          data={txns}
          keyExtractor={(t) => String(t.id)}
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
              description={item.description}
              meta={`${item.date} · ${item.type}`}
              amount={`${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount, currency)}`}
              isIncome={item.type === "income"}
              onDelete={() => onDelete(item.id)}
            />
          )}
        />
      )}
      <Sheet visible={showNew} onClose={closeNew} title="New transaction">
        <Field value={desc} onChange={setDesc} placeholder="Description" />
        <Field value={amount} onChange={setAmount} placeholder="Amount" numeric />
        <View style={s.bar}>
          <Btn title="Expense" variant={type === "expense" ? "primary" : "outline"} onPress={toExpense} />
          <Btn title="Income" variant={type === "income" ? "primary" : "outline"} onPress={toIncome} />
        </View>
        <Btn title="Add" onPress={onCreate} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 12, gap: 10 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 6 },
  sub: { fontSize: 12, color: C.sub },
  bar: { flexDirection: "row", gap: 8 },
  list: { gap: 8, paddingBottom: 24 },
});
