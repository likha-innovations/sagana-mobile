import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { barangayApi } from "@/api/barangays.api";
import { userApi } from "@/api/user.api";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useAuthContext } from "@/context/auth-context";
import { ApiError } from "@/types";
import type { Barangay } from "@/types/barangay";
import {
  changeBarangayCode,
  isCompleteBarangayCode,
} from "@/lib/barangay-code";

export default function BarangayCodeScreen() {
  const router = useRouter();
  const { invalid } = useLocalSearchParams<{ invalid?: string }>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { isSignedIn, user, signOut, setSignupBarangay } = useAuthContext();
  const [code, setCode] = useState("");
  const [error, setError] = useState(
    invalid ? "The code has changed. Enter the current barangay code." : "",
  );
  const [loading, setLoading] = useState(false);
  const [matchedBarangay, setMatchedBarangay] = useState<Barangay | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const whySheet = useRef<BottomSheetModal>(null);
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
    [],
  );

  const exit = useCallback(() => setConfirmExit(true), []);

  const returnToLogin = () => {
    setConfirmExit(false);
    setSignupBarangay(null);
    if (isSignedIn) void signOut();
    else router.replace("/(auth)/sign-in");
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (whyOpen) {
            whySheet.current?.dismiss();
            return true;
          }
          exit();
          return true;
        },
      );
      return () => subscription.remove();
    }, [exit, whyOpen]),
  );

  useEffect(() => {
    if (!isCompleteBarangayCode(code)) return;
    let active = true;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const barangay = await barangayApi.validateCode(code);
        if (!active) return;
        Keyboard.dismiss();
        setMatchedBarangay(barangay);
      } catch (error) {
        if (active) {
          setError(
            error instanceof ApiError && error.statusCode === 400
              ? "The code is not recognized"
              : error instanceof ApiError && error.statusCode === 429
                ? "Too many attempts. Please wait and try again."
                : "Unable to check the code. Check your connection and try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [code]);

  const continueWithBarangay = async () => {
    if (!matchedBarangay || loading) return;
    if (!isSignedIn || !user?.birthday) {
      setMatchedBarangay(null);
      setSignupBarangay({ ...matchedBarangay, code });
      router.replace("/(auth)/sign-up");
      return;
    }
    setLoading(true);
    try {
      await userApi.assignBarangay(code);
      await queryClient.invalidateQueries({ queryKey: ["signup-profile", user.id] });
      setMatchedBarangay(null);
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setMatchedBarangay(null);
      setError(
        error instanceof ApiError && error.statusCode === 400
          ? "The code is not recognized"
          : error instanceof ApiError && error.statusCode === 429
            ? "Too many attempts. Please wait and try again."
            : "Unable to check the code. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const changeCharacter = (text: string, index: number) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const nextCode = changeBarangayCode(code, text, index);
    setError("");
    setCode(nextCode);
    if (cleaned.length >= 6) inputs.current[5]?.focus();
    else if (cleaned && index < 5) {
      const previous = code[index]?.trim();
      const replacing = previous && cleaned.length > 1 &&
        (cleaned.startsWith(previous) || cleaned.endsWith(previous));
      inputs.current[
        Math.min(index + cleaned.length - (replacing ? 1 : 0), 5)
      ]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 pt-5">
        <Pressable
          onPress={exit}
          accessibilityRole="button"
          accessibilityLabel="Return to login"
          className="h-12 w-12 justify-center"
        >
          <ChevronLeft size={24} color="#414141" />
        </Pressable>
        <Text className="mt-6 text-xl font-bold text-foreground">
          Enter your barangay's code
        </Text>
        <Text className="mt-2 text-sm font-sans text-muted-foreground">
          Ask your barangay administrator for the code to complete your
          registration.
        </Text>
        <View className="mt-8 flex-row justify-between gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <View
              key={index}
              className={`flex-1 h-14 rounded-xl border bg-card ${error === "The code is not recognized" ? "border-destructive" : "border-border"}`}
            >
            <TextInput
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              value={code[index]?.trim() ?? ""}
              onChangeText={(text) => changeCharacter(text, index)}
              onKeyPress={(event) => {
                if (
                  event.nativeEvent.key === "Backspace" &&
                  !code[index]?.trim() &&
                  index > 0
                ) {
                  setError("");
                  setCode((current) => changeBarangayCode(current, "", index - 1));
                  inputs.current[index - 1]?.focus();
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ color: "transparent" }}
              caretHidden
              editable={!loading}
              accessibilityLabel={`Barangay code character ${index + 1} of 6`}
              className="h-full w-full text-center text-xl font-bold"
            />
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <Text accessible={false} className="text-xl font-bold text-foreground">
                {code[index]?.trim() ?? ""}
              </Text>
            </View>
            </View>
          ))}
        </View>
        {!!error && (
          <Text
            accessibilityRole="alert"
            className="mt-3 text-sm font-sans text-destructive"
          >
            {error}
          </Text>
        )}
        {loading && <ActivityIndicator className="mt-3" />}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Keyboard.dismiss();
            setWhyOpen(true);
            whySheet.current?.present();
          }}
          className="mt-6 self-start py-2"
        >
          <Text className="text-sm font-bold text-primary">
            Why do we do this?
          </Text>
        </Pressable>
      </View>
      <ConfirmModal
        visible={!!matchedBarangay}
        title="Barangay confirmed"
        description={`You will be under ${matchedBarangay?.name ?? ""}.`}
        cancelText="Change code"
        confirmText="Continue"
        pending={loading}
        onCancel={() => {
          setMatchedBarangay(null);
          setCode("");
        }}
        onConfirm={() => void continueWithBarangay()}
      />
      <ConfirmModal
        visible={confirmExit}
        title="Return to login?"
        description="You will need to enter your barangay code again."
        cancelText="Cancel"
        confirmText="Go back"
        onCancel={() => setConfirmExit(false)}
        onConfirm={returnToLogin}
      />
      <BottomSheetModal
        ref={whySheet}
        snapPoints={["90%"]}
        maxDynamicContentSize={height * 0.9}
        enablePanDownToClose
        enableOverDrag={false}
        onDismiss={() => setWhyOpen(false)}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#FAF9EE",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
        handleIndicatorStyle={{ backgroundColor: "#C8C7BE", width: 40, height: 4 }}
      >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}
          >
            <Text className="mt-2 mb-5 text-xl font-bold text-foreground">Why do we do this?</Text>
            <View className="gap-y-4">
              <View>
                <Text className="mb-1 text-sm font-bold text-foreground">Verified Access</Text>
                <Text className="text-sm font-sans text-muted-foreground leading-5">
                  The organization code confirms that you're a legitimate operator under a registered barangay/facility partnered with SAGANA. This prevents unauthorized individuals from creating operator accounts and accessing machine controls.
                </Text>
              </View>
              <View>
                <Text className="mb-1 text-sm font-bold text-foreground">Proper Facility Assignment</Text>
                <Text className="text-sm font-sans text-muted-foreground leading-5">
                  Your organization code links your account to the correct facility, so the batches, sensor data, and reports you manage are tied to the right location — not mixed up with another barangay's data.
                </Text>
              </View>
              <View>
                <Text className="mb-1 text-sm font-bold text-foreground">Admin Accountability</Text>
                <Text className="text-sm font-sans text-muted-foreground leading-5">
                  Since the code is provided by your barangay admin, it ensures every operator account is issued with their knowledge and approval, keeping a clear record of who has access to the system.
                </Text>
              </View>
            </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => whySheet.current?.dismiss()}
            className="mt-3 h-12 w-full items-center justify-center rounded-full bg-primary"
          >
            <Text className="text-sm font-bold text-primary-foreground">I Agree</Text>
          </Pressable>
          </BottomSheetScrollView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}
