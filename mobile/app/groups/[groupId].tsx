import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import AddTxnSheet from "../../src/AddTxnSheet";
import {
  countGroupTxns,
  createCategory,
  deleteTransaction,
  getCurrency,
  getGroup,
  listCategories,
  listGroupTxns,
  type GroupTxn,
} from "../../src/db";
import type { BudgetGroup, CategorySummary } from "../../src/types";
import { formatCurrency } from "../../src/format";
import { CHART_COLORS, useTheme } from "../../src/theme";
import { PAGE_SIZE } from "../../src/types";
import { Btn, CenterLoad, Chip, EmptyState, FAB, Field, Segmented, Sheet, Toast, TxnRow, TXN_H, useTopPad } from "../../src/ui";

const FILTERS = ["All", "Income", "Expense"] as const;

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHART_COLORS[h % CHART_COLORS.length];
}

export default function GroupDetail() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gid = Number(groupId);
  const router = useRouter();
  const t = useTheme();
  const [group, setGroup] = useState<BudgetGroup | null>(null);
  const [cats, setCats] = useState<CategorySummary[]>([]);
  const [txns, setTxns] = useState<GroupTxn[]>([]);
  const [total, setTotal] = useState(0);
  const [spent, setSpent] = useState(0);
  const [currency, setCurrencyState] = useState("$");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catBudget, setCatBudget] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const topPad = useTopPad();

  const f = filter === "All" ? "all" : filter === "Income" ? "income" : "expense";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, cs, page, n, cur] = await Promise.all([
        getGroup(gid),
        listCategories(gid),
        listGroupTxns(gid, f, PAGE_SIZE, 0),
        countGroupTxns(gid, f),
        getCurrency(),
      ]);
      setGroup(g);
      setCats(cs);
      setTxns(page);
      setTotal(n);
      setSpent(cs.reduce((s, c) => s + c.actual_spending, 0));
      setCurrencyState(cur);
    } finally {
      setLoading(false);
    }
  }, [gid, f]);

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
      const page = await listGroupTxns(gid, f, PAGE_SIZE, txns.length);
      setTxns((p) => [...p, ...page]);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, txns.length, total, gid, f]);

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onDeleteTxn = useCallback(
    (id: number) => {
      Alert.alert("Delete transaction?", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id).then(load) },
      ]);
    },
    [load]
  );

  const onFilter = useCallback((v: string) => setFilter(v as (typeof FILTERS)[number]), []);
  const openNew = useCallback(() => setShowNew(true), []);
  const closeNew = useCallback(() => setShowNew(false), []);
  const onSaved = useCallback(() => {
    load();
    say("Saved ✓");
  }, [load, say]);

  const onCreateCat = useCallback(async () => {
    if (!catName.trim()) return;
    await createCategory(gid, catName, Number(catBudget) || 0);
    setCatName("");
    setCatBudget("");
    setShowCat(false);
    load();
    say("Saved ✓");
  }, [gid, catName, catBudget, load, say]);

  const openCat = useCallback(
    (id: number) =>
      router.push({ pathname: "/categories/[categoryId]", params: { categoryId: String(id) } }),
    [router]
  );

  if (loading) return <CenterLoad />;
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, paddingTop: topPad }]}>
      <View style={s.head}>
        <View style={[s.dotLg, { backgroundColor: t.accent }]} />
        <View style={s.grow}>
          <Text style={[s.h1, { color: t.text }]}>{group?.name ?? ""}</Text>
          <Text style={[s.sub, { color: t.sub }]}>{formatCurrency(spent, currency)} this month</Text>
        </View>
      </View>
      {cats.length > 0 ? (
        <FlatList
          horizontal
          data={cats}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={s.chips}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip label={item.name} dot={colorFor(item.name)} onPress={() => openCat(item.id)} />
          )}
        />
      ) : null}
      <Segmented options={[...FILTERS]} value={filter} onChange={onFilter} />
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
              category={item.category}
              date={item.date}
              amount={`${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount, currency)}`}
              isIncome={item.type === "income"}
              color={colorFor(item.category)}
              onDelete={() => onDeleteTxn(item.id)}
            />
          )}
        />
      )}
      {cats.length === 0 ? (
        <Btn title="＋ New category" variant="ghost" onPress={() => setShowCat(true)} block />
      ) : null}
      <FAB onPress={openNew} label="Add transaction" />
      <AddTxnSheet
        visible={showNew}
        onClose={closeNew}
        categories={cats}
        onSaved={onSaved}
      />
      <Sheet visible={showCat} onClose={() => setShowCat(false)} title="New category">
        <Field value={catName} onChange={setCatName} placeholder="e.g. Groceries" />
        <Field value={catBudget} onChange={setCatBudget} placeholder="Budget" numeric />
        <Btn title="Save" onPress={onCreateCat} block />
      </Sheet>
      <Toast message={toast} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  dotLg: { width: 16, height: 16, borderRadius: 3, transform: [{ rotate: "45deg" }] },
  grow: { flex: 1 },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  chips: { gap: 8 },
  list: { gap: 8, paddingBottom: 110 },
});
