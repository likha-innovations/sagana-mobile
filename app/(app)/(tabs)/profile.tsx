import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/context/auth-context';
import { useProfile, useBarangays } from '@/hooks';
import { GoogleIcon } from '@/components/icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser, signOut, clerkUser } = useAuthContext();
  const { data: profileData } = useProfile();
  const { data: barangays = [] } = useBarangays();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const isGoogleUser = clerkUser?.externalAccounts?.some(
    (acc: any) => acc.provider === 'oauth_google' || acc.verification?.strategy === 'oauth_google'
  );

  const user = profileData || authUser;

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NN';

  let barangayName = 'Unknown Location';
  if (user?.barangay) {
    if (typeof user.barangay === 'object' && user.barangay.name) {
      barangayName = user.barangay.name;
    } else if (typeof user.barangay === 'string') {
      const bId = user.barangay;
      barangayName = barangays.find(b => b.id === bId || b.name === bId)?.name || bId;
    }
  }

  const handleLogout = async () => {
    setIsLogoutModalVisible(false);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await signOut();
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 48),
          paddingBottom: insets.bottom + 100, // Account for floating tab bar
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-8">
          {/* Header */}
          <Text className="text-[32px] font-bold text-foreground">
            Account
          </Text>

          {/* User Card */}
          <View className="flex-row items-center p-4 bg-card border border-border rounded-[14px] gap-4">
            <LinearGradient
              colors={['#C9E752', '#518251']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ borderRadius: 28 }}
              className="w-14 h-14 items-center justify-center"
            >
              <Text className="text-[20px] font-bold text-background">{userInitials}</Text>
            </LinearGradient>
            
            <View className="flex-1 gap-1">
              <Text className="text-[14px] font-bold text-foreground">
                {user?.fullName || 'Neo Isaiah D. Nimo'}
              </Text>
              <Text className="text-[14px] text-foreground font-sans">
                {barangayName}
              </Text>
            </View>
          </View>

          {/* Action Row */}
          {isGoogleUser ? (
            <View className="flex-row items-center h-[60px] px-4.5 bg-card border border-border rounded-[8px] gap-4">
              <GoogleIcon size={18} />
              <Text className="text-[14px] text-foreground font-sans flex-1">
                Signed in with Google
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/change-password/current-password');
              }}
              className="flex-row items-center h-[60px] px-4.5 bg-card border border-border rounded-[8px] gap-4"
            >
              <Lock size={18} color="#96958F" />
              <Text className="text-[14px] text-foreground font-sans flex-1">
                Change password
              </Text>
            </TouchableOpacity>
          )}

          {/* Log Out Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsLogoutModalVisible(true);
            }}
            className="h-[45px] bg-destructive/[0.08] rounded-full items-center justify-center mt-4"
          >
            <Text className="text-[14px] font-bold text-destructive">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full bg-card border border-border rounded-[14px] p-6 gap-6 items-center shadow-md">
            <View className="gap-2.5 items-center">
              <Text className="text-[14px] font-bold text-foreground">
                Log Out?
              </Text>
              <Text className="text-[14px] text-foreground font-sans text-center">
                You can still log in anytime.
              </Text>
            </View>
            
            <View className="flex-row w-full gap-2">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsLogoutModalVisible(false)}
                className="flex-1 h-[45px] bg-secondary rounded-full items-center justify-center"
              >
                <Text className="text-[14px] font-bold text-[#414141]">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogout}
                className="flex-1 h-[45px] bg-destructive rounded-full items-center justify-center"
              >
                <Text className="text-[14px] font-bold text-[#FAF9EE]">
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
