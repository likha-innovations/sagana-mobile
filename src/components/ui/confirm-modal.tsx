import { Modal, View, Text, Pressable, TouchableOpacity } from 'react-native';

export interface ConfirmModalProps {
  visible: boolean;
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
  title,
  description,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isDestructive = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-black/45 justify-center items-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[320px] bg-card rounded-3xl p-6 items-center shadow-2xl border border-border/40"
        >
          <Text className="text-base font-bold text-foreground text-center">
            {title}
          </Text>
          <Text className="text-xs font-sans text-muted-foreground text-center mt-1.5 mb-6 leading-relaxed">
            {description}
          </Text>
          
          <View className="flex-row items-center w-full gap-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 h-11 rounded-full bg-secondary items-center justify-center"
            >
              <Text className="text-sm font-bold text-foreground text-center">
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              className={`flex-1 h-11 rounded-full items-center justify-center ${
                isDestructive ? 'bg-destructive' : 'bg-primary'
              }`}
            >
              <Text className="text-[13px] font-bold text-white text-center">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
