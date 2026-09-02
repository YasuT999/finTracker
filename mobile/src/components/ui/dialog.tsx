import { Modal, View, Pressable, Text, type ModalProps, ScrollView } from "react-native";

export function Dialog({ visible, onClose, children, ...props }: ModalProps & { visible: boolean; onClose?: () => void; children?: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} {...props}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 16 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, maxHeight: "85%" }}>
          <ScrollView>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DialogHeader({ children, style, ...props }: any) {
  return (
    <View style={[{ gap: 4, marginBottom: 12 }, style]} {...props}>
      {children}
    </View>
  );
}

export function DialogTitle({ children, style, ...props }: any) {
  return (
    <Text style={[{ fontSize: 17, fontWeight: "700" }, style]} {...props}>
      {children}
    </Text>
  );
}

export function DialogDescription({ children, style, ...props }: any) {
  return (
    <Text style={[{ fontSize: 13, opacity: 0.6 }, style]} {...props}>
      {children}
    </Text>
  );
}

export function DialogFooter({ children, style, ...props }: any) {
  return (
    <View style={[{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 16 }, style]} {...props}>
      {children}
    </View>
  );
}
