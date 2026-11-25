import { useState } from "react";
import { Modal, Pressable, Text, View, ActivityIndicator } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          <Text className="mt-2 text-sm leading-5 text-muted-foreground">{message}</Text>
          <View className="mt-6 flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              disabled={busy}
              hitSlop={8}
              className="rounded-lg px-4 py-2"
            >
              <Text className="text-sm font-medium text-muted-foreground">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              className={`min-w-20 items-center justify-center rounded-lg px-4 py-2 ${
                tone === "danger" ? "bg-destructive" : "bg-primary"
              } ${busy ? "opacity-60" : ""}`}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-sm font-semibold text-white">{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
