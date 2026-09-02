import { useState } from "react";
import { Modal, Pressable, View, Text, FlatList } from "react-native";

type Option = { label: string; value: string };

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ height: 36, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 10, justifyContent: "center", backgroundColor: "#fff" }}
      >
        <Text style={{ opacity: selected ? 1 : 0.5 }}>{selected?.label ?? placeholder}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "60%", paddingBottom: 16 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
              <Text style={{ fontWeight: "600" }}>{placeholder}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(i) => i.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                  style={{ padding: 14, borderBottomWidth: 1, borderColor: "#f5f5f5" }}
                >
                  <Text style={{ fontWeight: item.value === value ? "700" : "400" }}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
