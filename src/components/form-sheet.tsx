import { useState } from "react";
import { Modal, Pressable, View, ScrollView, KeyboardAvoidingView, Platform, Text } from "react-native";

interface FormSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => Promise<void>;
  submitLabel?: string;
  submitDisabled?: boolean;
  children: React.ReactNode;
}

export function FormSheet({
  visible,
  title,
  onClose,
  onSubmit,
  submitLabel = "Save",
  submitDisabled,
  children,
}: FormSheetProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!onSubmit || busy || submitDisabled) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "web" ? "overFullScreen" : "pageSheet"}
      transparent={Platform.OS === "web"}
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-background web:items-center web:justify-center web:bg-black/50 web:p-4">
        <View className="h-full w-full bg-background web:h-auto web:max-h-[90vh] web:max-w-xl web:rounded-2xl web:border web:border-border web:shadow-2xl web:overflow-hidden">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Pressable onPress={close} hitSlop={8} disabled={busy}>
              <Text className={`text-base ${busy ? "text-muted-foreground/50" : "text-muted-foreground"}`}>Cancel</Text>
            </Pressable>
            <Text className="text-base font-semibold text-foreground">{title}</Text>
            <Pressable onPress={submit} disabled={busy || submitDisabled} hitSlop={8}>
              <Text
                className={`text-base font-semibold ${
                  busy || submitDisabled ? "text-muted-foreground/50" : "text-primary"
                }`}
              >
                {busy ? "Saving…" : submitLabel}
              </Text>
            </Pressable>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 web:flex-initial">
            <ScrollView keyboardShouldPersistTaps="handled" className="flex-1 web:max-h-[75vh]" contentContainerClassName="p-4 gap-4">
              {error ? (
                <View className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <Text className="text-sm text-destructive">{error}</Text>
                </View>
              ) : null}
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}
