import { Button } from "@/components/ui/button";
import { Modal, View, Text, Pressable } from "react-native";

export interface ConfirmModalProps {
  visible: boolean;
  pending?: boolean;
  pendingText?: string;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  isDestructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  pending = false,
  pendingText = "Please wait…",
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Confirm",
  isDestructive = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!pending) onCancel();
      }}
    >
      <Pressable
        onPress={() => {
          if (!pending) onCancel();
        }}
        className="flex-1 bg-black/45 justify-center items-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[356px] bg-card rounded-[14px] p-6 items-center shadow-2xl border border-border/40"
        >
          <Text className="text-base font-bold text-foreground text-center">
            {title}
          </Text>
          <Text className="text-sm font-sans text-foreground text-center mt-1.5 mb-6 leading-relaxed">
            {description}
          </Text>

          <View className="flex-row items-center w-full gap-3">
            <Button
              variant="secondary"
              onPress={onCancel}
              disabled={pending}
              accessibilityRole="button"
              accessibilityState={{ disabled: pending }}
              className="flex-1 w-auto h-auto min-h-12"
              textClassName="text-sm font-bold"
            >
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onPress={onConfirm}
              disabled={pending}
              accessibilityRole="button"
              accessibilityState={{ disabled: pending, busy: pending }}
              className="flex-1 w-auto h-auto min-h-12"
              textClassName="text-sm font-bold"
            >
              {pending ? pendingText : confirmText}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
