import { useState } from "react";
import { View, Pressable } from "react-native";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import type { SafeUser } from "@/lib/types";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  autoComplete?: "name" | "email" | "organization" | "current-password" | "new-password";
  multiline?: boolean;
  error?: string | null;
}

export function TextField({ label, value, onChangeText, multiline, error, ...rest }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      {label ? <Text size="sm" weight="medium" className="text-muted-foreground">{label}</Text> : null}
      <Input className={multiline ? "min-h-20 items-start py-2.5" : ""}>
        <InputField
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          {...rest}
        />
      </Input>
      {error ? <Text size="xs" className="text-destructive">{error}</Text> : null}
    </View>
  );
}

interface PasswordTextFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: "password" | "new-password" | "current-password";
}

export function PasswordTextField({ label, value, onChangeText, placeholder, error, autoComplete }: PasswordTextFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View className="gap-1.5">
      {label ? <Text size="sm" weight="medium" className="text-muted-foreground">{label}</Text> : null}
      <Input>
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete={autoComplete}
        />
        <InputSlot className="pr-3">
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8} accessibilityLabel={show ? "Hide password" : "Show password"}>
            {show ? (
              <EyeOffIcon size={18} color="rgb(var(--muted-foreground))" strokeWidth={1.8} />
            ) : (
              <EyeIcon size={18} color="rgb(var(--muted-foreground))" strokeWidth={1.8} />
            )}
          </Pressable>
        </InputSlot>
      </Input>
      {error ? <Text size="xs" className="text-destructive">{error}</Text> : null}
    </View>
  );
}

interface ChipRowProps<T extends string> {
  label?: string;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}

export function ChipRow<T extends string>({ label, options, labels, value, onChange, disabled }: ChipRowProps<T>) {
  return (
    <View className="gap-1.5">
      {label ? <Text size="sm" weight="medium" className="text-muted-foreground">{label}</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt === value;
          const content = (
            <Text size="xs" weight="medium" className={active ? "text-primary-foreground font-semibold" : "text-secondary-foreground"}>
              {labels?.[opt] ?? opt.replace(/_/g, " ")}
            </Text>
          );
          if (disabled) {
            return (
              <View key={opt} className={`rounded-full px-3.5 py-1.5 opacity-60 ${active ? "bg-primary" : "bg-secondary"}`}>
                {content}
              </View>
            );
          }
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`rounded-full px-3.5 py-1.5 ${active ? "bg-primary" : "bg-secondary"}`}
            >
              {content}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface UserPickerProps {
  label: string;
  users: SafeUser[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowUnassigned?: boolean;
}

export function UserPicker({ label, users, value, onChange, allowUnassigned = true }: UserPickerProps) {
  const active = users.filter((u) => u.active !== false);
  return (
    <View className="gap-1.5">
      <Text size="sm" weight="medium" className="text-muted-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {allowUnassigned ? (
          <Pressable
            onPress={() => onChange(null)}
            className={`rounded-full px-3.5 py-1.5 ${value === null ? "bg-primary" : "bg-secondary"}`}
          >
            <Text size="xs" weight="medium" className={value === null ? "text-primary-foreground font-semibold" : "text-secondary-foreground"}>
              Unassigned
            </Text>
          </Pressable>
        ) : null}
        {active.map((u) => {
          const isActive = value === u.id;
          return (
            <Pressable
              key={u.id}
              onPress={() => onChange(u.id)}
              className={`rounded-full px-3.5 py-1.5 ${isActive ? "bg-primary" : "bg-secondary"}`}
            >
              <Text size="xs" weight="medium" className={isActive ? "text-primary-foreground font-semibold" : "text-secondary-foreground"}>
                {u.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function userName(users: SafeUser[], id: string | null | undefined): string {
  if (!id) return "Unassigned";
  return users.find((u) => u.id === id)?.name ?? "Unassigned";
}
