// Stateful bottom sheet shell (spec 10 — Add Transaction).
// State lives here (screen layer); rendering uses stateless ui.tsx.
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { createTransaction } from "./db";
import { todayISO } from "./format";
import { Btn, Chip, Field, Segmented, Sheet } from "./ui";

export interface SheetCategory {
  id: number;
  name: string;
}

export default function AddTxnSheet(props: {
  visible: boolean;
  onClose: () => void;
  categories: SheetCategory[];
  initialCategoryId?: number;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState(props.initialCategoryId ?? 0);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Expense");
  const [error, setError] = useState("");

  useEffect(() => {
    if (props.visible) {
      setCategoryId(props.initialCategoryId ?? props.categories[0]?.id ?? 0);
      setDesc("");
      setAmount("");
      setType("Expense");
      setError("");
    }
  }, [props.visible, props.initialCategoryId, props.categories]);

  const save = useCallback(async () => {
    if (!categoryId) {
      setError("Pick a category first");
      return;
    }
    try {
      await createTransaction(
        categoryId,
        Number(amount),
        type === "Income" ? "income" : "expense",
        desc,
        todayISO()
      );
      props.onClose();
      props.onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [categoryId, amount, type, desc, props]);

  const close = useCallback(() => {
    Alert.alert("Discard?", "Unsaved changes will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: props.onClose },
    ]);
  }, [props]);

  const hasInput = desc.trim() !== "" || amount.trim() !== "";
  return (
    <Sheet visible={props.visible} onClose={hasInput ? close : props.onClose} title="Add transaction">
      <Field value={amount} onChange={setAmount} placeholder="0.00" numeric large />
      <Field value={desc} onChange={setDesc} placeholder="Description" error={error} />
      <View style={s.chips}>
        {props.categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={c.id === categoryId}
            onPress={() => setCategoryId(c.id)}
          />
        ))}
      </View>
      <Segmented options={["Expense", "Income"]} value={type} onChange={setType} />
      <View style={s.gap} />
      <Btn title="Save" onPress={save} block />
    </Sheet>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  gap: { height: 8 },
});
