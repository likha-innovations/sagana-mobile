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
      onButtonPress={handleDone}
      loading={loading}
    />
  );
}
