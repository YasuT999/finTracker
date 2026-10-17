import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CHART_COLORS, useTheme } from "../../src/theme";
import {
  Btn,
  Card,
  Chip,
  DonutChart,
  Field,
  LineChart,
  Segmented,
  useTopPad,
} from "../../src/ui";
import {
  bestCagr,
  computeCagrs,
  fetchFund,
  investedSeries,
  inr,
  searchFunds,
  simulateSip,
  simulateSwp,
  sipFutureValue,
  type Cagrs,
  type FundDetail,
  type FundMeta,
} from "../../src/funds";

const TENURES = [5, 10, 15, 20, 25, 30];

interface CompareItem {
  code: number;
  name: string;
  nav: string;
  cagrs: Cagrs;
}

function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

function pv(v: number | null): string {
  return v == null ? "n/a" : v.toFixed(1) + "%";
}

function Stepper(props: { sign: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={props.onPress} style={[s.step, { borderColor: t.border }]} hitSlop={6}>
      <Text style={[s.stepText, { color: t.text }]}>{props.sign}</Text>
    </Pressable>
  );
}

export default function Funds() {
  const t = useTheme();
  const topPad = useTopPad();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FundMeta[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fund, setFund] = useState<FundDetail | null>(null);
  const [cagrs, setCagrs] = useState<Cagrs | null>(null);
  const [loadingFund, setLoadingFund] = useState(false);
  const [mode, setMode] = useState("");
  const [view, setView] = useState("Graph");
  const [sipAmt, setSipAmt] = useState("10000");
  const [sipYears, setSipYears] = useState(10);
  const [sipRate, setSipRate] = useState("12");
  const [swpAmt, setSwpAmt] = useState("1000000");
  const [swpWd, setSwpWd] = useState("10000");
  const [swpYears, setSwpYears] = useState(20);
  const [swpRate, setSwpRate] = useState("10");
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [compare, setCompare] = useState<CompareItem[]>([]);
  const [chartW, setChartW] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function onQuery(v: string) {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        setResults(await searchFunds(v.trim()));
        setStatus(null);
      } catch {
        setResults([]);
        setStatus("Search failed. Check your connection.");
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  async function pick(code: number) {
    setResults([]);
    setQuery("");
    setLoadingFund(true);
    setStatus(null);
    try {
      const f = await fetchFund(code);
      const c = computeCagrs(f);
      setFund(f);
      setCagrs(c);
      const b = bestCagr(c);
      if (b != null) {
        setSipRate(b.toFixed(1));
        setSwpRate(b.toFixed(1));
      }
      setHidden({});
    } catch {
      setStatus("Could not load this fund. Try another.");
    } finally {
      setLoadingFund(false);
    }
  }

  const isSip = mode === "SIP";
  const isSwp = mode === "SWP";

  const invested = isSip ? num(sipAmt) * Math.round(sipYears * 12) : num(swpAmt);
  let fv = 0;
  let gain = 0;
  let withdrawn = 0;
  let remaining = 0;
  let depletedAt: number | null = null;
  let points: number[] = [];
  let auxPoints: number[] = [];

  if (isSip) {
    fv = sipFutureValue(num(sipAmt), num(sipRate), sipYears);
    points = simulateSip(num(sipAmt), num(sipRate), sipYears);
    auxPoints = investedSeries(num(sipAmt), sipYears);
    gain = fv - invested;
    remaining = fv;
  } else if (isSwp) {
    const r = simulateSwp(num(swpAmt), num(swpWd), num(swpRate), swpYears);
    points = r.points;
    auxPoints = r.withdrawnPts;
    remaining = r.final;
    withdrawn = r.totalOut;
    gain = withdrawn + remaining - invested;
    depletedAt = r.depletedAt;
  }

  const lineSeries = isSip
    ? [
        { name: "Corpus value", color: t.primary, values: points },
        { name: "Amount invested", color: t.accent, values: auxPoints },
      ]
    : [
        { name: "Remaining balance", color: t.primary, values: points },
        { name: "Total withdrawn", color: t.danger, values: auxPoints },
      ];
  const pieData = isSip
    ? [
        { name: "Invested", amount: invested },
        { name: "Gains", amount: Math.max(gain, 0) },
      ]
    : [
        { name: "Withdrawn", amount: withdrawn },
        { name: "Remaining", amount: Math.max(remaining, 0) },
      ];
  const visibleSeries = lineSeries.filter((x) => !hidden[x.name]);
  const visiblePie = pieData.filter((x) => !hidden[x.name]);
  const legendItems = view === "Graph" ? lineSeries.map((x) => x.name) : pieData.map((x) => x.name);
  const legendColor = (name: string): string => {
    const l = lineSeries.find((x) => x.name === name);
    if (l) return l.color;
    const idx = visiblePie.findIndex((x) => x.name === name);
    return idx >= 0 ? CHART_COLORS[idx % CHART_COLORS.length] : t.sub;
  };

  const inCompare = fund != null && compare.some((c) => c.code === fund.code);
  const compareFull = compare.length >= 5;

  function toggleCompare() {
    if (!fund || !cagrs || inCompare || compareFull) return;
    setCompare((cs) => [...cs, { code: fund.code, name: fund.name, nav: fund.latest.nav, cagrs }]);
  }

  const bdRows: { label: string; value: number; color: string; big?: boolean }[] = mode
    ? [
        { label: "Total invested", value: invested, color: t.primary },
        { label: "Interest gained", value: gain, color: t.success },
        ...(isSwp ? [{ label: "Total withdrawn", value: withdrawn, color: t.danger }] : []),
        {
          label: isSip ? "Future value" : "Remaining amount",
          value: remaining,
          color: t.success,
          big: true,
        },
      ]
    : [];

  const cagrChips = cagrs
    ? [
        { label: "1Y", v: cagrs.y1 },
        { label: "3Y", v: cagrs.y3 },
        { label: "5Y", v: cagrs.y5 },
        { label: "10Y", v: cagrs.y10 },
      ]
    : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[s.wrap, { paddingTop: topPad }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[s.h1, { color: t.text }]}>Funds</Text>

      <Card>
        <Field
          value={query}
          onChange={onQuery}
          placeholder="Search funds… e.g. Parag Parikh Flexi Cap"
        />
        {searching ? <Text style={[s.caption, { color: t.sub }]}>Searching…</Text> : null}
        {status ? (
          <Text style={[s.caption, { color: t.danger }]}>{status}</Text>
        ) : null}
        {results.map((f) => (
          <View key={f.code} style={[s.resRow, { borderTopColor: t.border }]}>
            <Pressable onPress={() => pick(f.code)} style={s.rowGrow} hitSlop={6}>
              <Text style={[s.body, { color: t.text }]} numberOfLines={2}>
                {f.name}
              </Text>
            </Pressable>
            <MaterialIcons name="chevron-right" size={20} color={t.sub} />
          </View>
        ))}
        {loadingFund ? <Text style={[s.caption, { color: t.sub }]}>Loading fund…</Text> : null}
      </Card>

      {fund && cagrs ? (
        <Card>
          <Text style={[s.h2, { color: t.text }]}>{fund.name}</Text>
          <Text style={[s.caption, { color: t.sub }]}>
            {[fund.house, fund.category].filter(Boolean).join(" · ")}
          </Text>
          <View style={s.navRow}>
            <View>
              <Text style={[s.caption, { color: t.sub }]}>Latest NAV</Text>
              <Text style={[s.navVal, { color: t.primary }]}>₹{fund.latest.nav}</Text>
            </View>
            <Text style={[s.caption, { color: t.sub }]}>as on {fund.latest.date}</Text>
          </View>
          <View style={s.chips}>
            {cagrChips.map((c) => (
              <View key={c.label} style={[s.cagrChip, { backgroundColor: t.bg, borderColor: t.border }]}>
                <Text style={[s.cagrLbl, { color: t.sub }]}>{c.label}</Text>
                <Text style={[s.cagrVal, { color: t.primary }]}>{pv(c.v)}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 12 }}>
            <Btn
              title={inCompare ? "Added to compare ✓" : compareFull ? "Compare full (5)" : "＋ Add to compare"}
              onPress={toggleCompare}
              variant={inCompare || compareFull ? "ghost" : "primary"}
              size="sm"
              block
            />
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={[s.h2, { color: t.text }]}>Choose SIP or SWP</Text>
        <Segmented options={["SIP", "SWP"]} value={mode} onChange={setMode} />
        {!mode ? (
          <Text style={[s.caption, { color: t.sub }]}>
            Pick an option to plan with your fund's historical returns.
          </Text>
        ) : null}
      </Card>

      {mode ? (
        <Card>
          <Text style={[s.h2, { color: t.text }]}>{isSip ? "SIP inputs" : "SWP inputs"}</Text>

          <Text style={[s.caption, { color: t.sub }]}>
            {isSip ? "Monthly investment (₹)" : "Lumpsum investment (₹)"}
          </Text>
          <View style={s.amtRow}>
            <Stepper
              sign="−"
              onPress={() =>
                isSip
                  ? setSipAmt(String(Math.max(500, num(sipAmt) - 500)))
                  : setSwpAmt(String(Math.max(100000, num(swpAmt) - 50000)))
              }
            />
            <View style={{ flex: 1 }}>
              <Field
                value={isSip ? sipAmt : swpAmt}
                onChange={isSip ? setSipAmt : setSwpAmt}
                placeholder="Amount"
                numeric
              />
            </View>
            <Stepper
              sign="+"
              onPress={() =>
                isSip
                  ? setSipAmt(String(num(sipAmt) + 500))
                  : setSwpAmt(String(num(swpAmt) + 50000))
              }
            />
          </View>

          {isSwp ? (
            <>
              <Text style={[s.caption, { color: t.sub }]}>Monthly withdrawal (₹)</Text>
              <View style={s.amtRow}>
                <Stepper
                  sign="−"
                  onPress={() => setSwpWd(String(Math.max(1000, num(swpWd) - 1000)))}
                />
                <View style={{ flex: 1 }}>
                  <Field value={swpWd} onChange={setSwpWd} placeholder="Withdrawal" numeric />
                </View>
                <Stepper sign="+" onPress={() => setSwpWd(String(num(swpWd) + 1000))} />
              </View>
            </>
          ) : null}

          <Text style={[s.caption, { color: t.sub }]}>Tenure (years)</Text>
          <View style={s.chips}>
            {TENURES.map((y) => (
              <Chip
                key={y}
                label={`${y}Y`}
                selected={(isSip ? sipYears : swpYears) === y}
                onPress={() => (isSip ? setSipYears(y) : setSwpYears(y))}
              />
            ))}
          </View>

          <Text style={[s.caption, { color: t.sub }]}>Expected return (% p.a.)</Text>
          <Field
            value={isSip ? sipRate : swpRate}
            onChange={isSip ? setSipRate : setSwpRate}
            placeholder="e.g. 12"
            numeric
          />
        </Card>
      ) : null}

      {mode ? (
        <Card>
          <Segmented options={["Graph", "Pie"]} value={view} onChange={setView} />
          <View
            onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
            style={{ marginTop: 12, minHeight: 184 }}
          >
            {view === "Graph" ? (
              chartW > 0 && visibleSeries.length ? (
                <LineChart series={visibleSeries} width={chartW} />
              ) : (
                <Text style={[s.caption, { color: t.sub }]}>Tap legend items to show lines.</Text>
              )
            ) : visiblePie.length ? (
              <DonutChart
                data={visiblePie}
                centerLabel={isSip ? inr(fv) : inr(remaining)}
                format={inr}
              />
            ) : (
              <Text style={[s.caption, { color: t.sub }]}>Tap legend items to show slices.</Text>
            )}
          </View>
          <View style={s.chips}>
            {legendItems.map((name) => (
              <Chip
                key={name}
                label={name}
                dot={legendColor(name)}
                selected={!hidden[name]}
                onPress={() => setHidden((h) => ({ ...h, [name]: !h[name] }))}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {mode ? (
        <Card>
          <Text style={[s.h2, { color: t.text }]}>Breakdown</Text>
          {bdRows.map((r) => (
            <View key={r.label} style={s.bdRow}>
              <View style={s.bdLeft}>
                <View style={[s.dot, { backgroundColor: r.color }]} />
                <Text style={[s.body, { color: t.sub }]}>{r.label}</Text>
              </View>
              <Text
                style={[
                  r.big ? s.bdBig : s.bdVal,
                  { color: r.big ? t.success : t.text },
                ]}
              >
                {inr(r.value)}
              </Text>
            </View>
          ))}
          {depletedAt != null ? (
            <Text style={[s.caption, { color: t.danger }]}>
              Corpus depletes in {depletedAt} months (~{(depletedAt / 12).toFixed(1)} yrs).
              Reduce withdrawal or extend growth.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {compare.length ? (
        <Card>
          <Text style={[s.h2, { color: t.text }]}>Compare ({compare.length}/5)</Text>
          <View style={s.chips}>
            {compare.map((c) => {
              const r = bestCagr(c.cagrs);
              const v = r == null ? 0 : sipFutureValue(num(sipAmt), r, sipYears);
              return (
                <Chip
                  key={c.code}
                  label={`${c.name.split(" - ")[0]} · ${r == null ? "n/a" : inr(v)}`}
                  selected
                  onPress={() => setCompare((cs) => cs.filter((x) => x.code !== c.code))}
                />
              );
            })}
          </View>
          <Text style={[s.caption, { color: t.sub }]}>
            Tap a fund chip to remove it. SIP value uses the inputs above with each fund's
            historical CAGR (5Y preferred).
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 12, paddingBottom: 40 },
  h1: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  caption: { fontSize: 12, fontWeight: "500", marginTop: 6 },
  body: { fontSize: 15 },
  rowGrow: { flex: 1, paddingVertical: 4 },
  resRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    marginTop: 4,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  navVal: { fontSize: 24, fontWeight: "700", fontVariant: ["tabular-nums"] },
  cagrChip: { borderRadius: 10, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, alignItems: "center" },
  cagrLbl: { fontSize: 10, fontWeight: "600" },
  cagrVal: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  amtRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  step: { width: 40, height: 44, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 20, fontWeight: "600" },
  bdRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  bdLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bdVal: { fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"] },
  bdBig: { fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
});
