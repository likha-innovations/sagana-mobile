import { Modal, View, Text, Pressable } from 'react-native';

export interface ErrorModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  onClose: () => void;
}

export function ErrorModal({
  visible,
  title = 'An error occurred',
  description = 'Try again later.',
  buttonText = 'Okay',
  onClose,
}: ErrorModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        onPress={handleClose}
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
          <Pressable
            onPress={handleClose}
            className="w-full h-11 rounded-full bg-primary items-center justify-center active:opacity-90"
            accessibilityRole="button"
          >
            <Text className="text-sm font-bold text-primary-foreground">
              {buttonText}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
