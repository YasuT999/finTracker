import { TextInput, type TextInputProps } from "react-native";

export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#999"
      style={[
        {
          height: 36,
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          paddingHorizontal: 10,
          fontSize: 14,
          backgroundColor: "#fff",
        },
        style as any,
      ]}
      {...props}
    />
  );
}
