import React, { useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User as UserIcon, Mail, Phone, MapPin, LogOut } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/auth-context';
import { useProfile } from '@/hooks';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser, signOut } = useAuthContext();
  const { data: profileData, isLoading, isRefetching, refetch } = useProfile();

  // Prefer backend /me data, fallback to Clerk user in AuthContext
  const user = profileData || authUser;

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#15803d"
          />
        }
      >
        <Text className="text-2xl font-bold text-slate-900 mb-1">
          User Profile
        </Text>
        <Text className="text-sm text-slate-500 mb-6">
          Manage your account and profile settings.
        </Text>

        {isLoading ? (
          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-8 items-center justify-center mb-6">
            <ActivityIndicator size="small" color="#15803d" />
            <Text className="text-xs text-slate-400 mt-2">Loading profile from backend...</Text>
          </View>
        ) : (
          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 gap-4">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                <UserIcon size={20} color="#15803d" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-slate-400">Name</Text>
                <Text className="text-base font-semibold text-slate-900">
                  {user?.fullName || 'Not provided'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                <Mail size={20} color="#15803d" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-slate-400">Email</Text>
                <Text className="text-base font-semibold text-slate-900">
                  {user?.email || 'Not provided'}
                </Text>
              </View>
            </View>

            {user?.contactNumber && (
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <Phone size={20} color="#15803d" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-slate-400">Contact</Text>
                  <Text className="text-base font-semibold text-slate-900">
                    {user.contactNumber}
                  </Text>
                </View>
              </View>
            )}

            {user?.location && (
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <MapPin size={20} color="#15803d" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-slate-400">Location</Text>
                  <Text className="text-base font-semibold text-slate-900">
                    {user.location}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <Button
          variant="destructive"
          onPress={signOut}
          className="flex-row items-center gap-2"
        >
          <LogOut size={18} color="#ffffff" />
          <Text className="text-sm font-bold text-white">Sign Out</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
