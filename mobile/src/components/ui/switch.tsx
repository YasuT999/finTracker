import { Switch as RNSwitch, type SwitchProps } from "react-native";

export function Switch(props: SwitchProps) {
  return <RNSwitch trackColor={{ false: "#ddd", true: "#111" }} thumbColor="#fff" {...props} />;
}
