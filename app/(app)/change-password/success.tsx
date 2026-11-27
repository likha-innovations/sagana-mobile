import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/context/auth-context';
import { SuccessScreen } from '@/components/ui/success-screen';

export default function ChangePasswordSuccessScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleDone = async () => {
    setLoading(true);
    try {
      // Force sign out so they have to log in with new password
      await signOut();
    } catch {
      // If signOut fails, redirect to sign-in
      router.replace('/(auth)/sign-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuccessScreen
      title="You are all set!"
      description="You can now login to your account using your new password."
      buttonText="Done"
      alignText="left"
      mascotWidth={264}
      mascotHeight={264}
      lottieSource={require('@/assets/icons/mascot/onboarding/sagana_celebrate.lottie')}
      fallbackImageSource={require('@/assets/icons/mascot/sagana_celebrate.png')}
      onButtonPress={handleDone}
      loading={loading}
    />
  );
}
