import { View, type ViewProps } from "react-native";

export function Separator({ style, ...props }: ViewProps & { orientation?: "horizontal" | "vertical" }) {
  const orientation = (props as any).orientation ?? "horizontal";
  return (
    <View
      style={[
        orientation === "horizontal" ? { height: 1, backgroundColor: "#e5e5e5", width: "100%" } : { width: 1, backgroundColor: "#e5e5e5", height: "100%" },
        style as any,
      ]}
      {...props}
    />
  );
}
