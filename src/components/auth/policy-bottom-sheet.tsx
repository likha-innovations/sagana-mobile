import { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

export interface PolicyBottomSheetProps {
  type: 'tos' | 'privacy' | null;
  onDismiss?: () => void;
}

export const PolicyBottomSheet = forwardRef<BottomSheetModal, PolicyBottomSheetProps>(
  function PolicyBottomSheet({ type, onDismiss }, ref) {
    const isTos = type === 'tos';
    const snapPoints = useMemo(() => ['75%', '88%'], []);

    const handleActionPress = useCallback(() => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }, [ref]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        name="policy-modal"
        snapPoints={snapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: '#FAF9EE',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
        handleIndicatorStyle={{
          backgroundColor: '#C8C7BE',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView className="flex-1 px-6 pb-6">
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            className="flex-1"
          >
            <Text className="text-[20px] font-bold text-foreground mb-1.5 text-left mt-2">
              {isTos ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <Text className="text-[13px] font-sans text-muted-foreground mb-5 text-left leading-relaxed">
              {isTos
                ? 'Please review the following terms before continuing your registration.'
                : 'At SAGANA, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information when you use our services.'}
            </Text>

            {isTos ? (
              <View className="gap-y-4">
                <View>
                  <Text className="text-sm font-bold text-foreground mb-1">
                    Account Creation
                  </Text>
                  <Text className="text-xs font-sans text-foreground/80 leading-relaxed">
                    You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-foreground mb-1">
                    Usage Guidelines
                  </Text>
                  <Text className="text-xs font-sans text-foreground/80 leading-relaxed">
                    The platform is intended for professional use only. You agree not to use the service for any unlawful or unauthorized purposes.
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-foreground mb-1">
                    Data Privacy
                  </Text>
                  <Text className="text-xs font-sans text-foreground/80 leading-relaxed">
                    We take your privacy seriously. Please refer to our Privacy Policy for details on how your data is collected, stored, and processed.
                  </Text>
                </View>
              </View>
            ) : (
              <View className="gap-y-4">
                <View>
                  <Text className="text-sm font-bold text-foreground mb-1">
                    Information We Collect
                  </Text>
                  <Text className="text-xs font-sans text-foreground/80 leading-relaxed">
                    We collect the information you provide to us, such as your name, birthday, and contact details. We also collect usage data to improve your experience.
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-foreground mb-1">
                    How We Use It
                  </Text>
                  <Text className="text-xs font-sans text-foreground/80 leading-relaxed">
                    Your data is used to verify your identity, provide you with personalized services, and comply with legal requirements. We never sell your data to third parties.
                  </Text>
                </View>
              </View>
            )}
          </BottomSheetScrollView>

          <Pressable
            onPress={handleActionPress}
            className="w-full h-[45px] rounded-full bg-primary items-center justify-center active:opacity-90 mt-3"
            accessibilityRole="button"
          >
            <Text className="text-sm font-bold text-primary-foreground">
              {isTos ? 'I Agree' : 'I Understand'}
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
