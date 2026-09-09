import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wifi,
  WifiOff,
  Send,
  Activity,
  Thermometer,
  Droplets,
  Cpu,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as toast from 'burnt';
import { useSocket } from '@/hooks';
import { Button } from '@/components/ui';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, latestTelemetry, logs, sendCommand, clearLogs } = useSocket();
  const [commandText, setCommandText] = useState('');

  const handleSendCommand = (textToSend?: string) => {
    const value = (textToSend ?? commandText).trim();
    if (!value) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sent = sendCommand(value);

    if (sent) {
      setCommandText('');
      toast.toast({
        title: 'Command Sent',
        message: `Published to sagana/commands: ${value}`,
        preset: 'done',
      });
    }
  };

  const handleChipPress = (preset: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSendCommand(preset);
  };

  // Extracts numeric metrics if present in incoming telemetry payload
  const tempVal =
    latestTelemetry && typeof latestTelemetry === 'object' && 'temperature' in latestTelemetry
      ? String(latestTelemetry.temperature)
      : null;

  const humidityVal =
    latestTelemetry && typeof latestTelemetry === 'object' && 'humidity' in latestTelemetry
      ? String(latestTelemetry.humidity)
      : null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Live Hardware Stream & Control
            </Text>
          </View>

          <View
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <View
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
            {isConnected ? (
              <>
                <Wifi size={12} color="#10b981" />
                <Text className="text-xs font-semibold text-emerald-600">ONLINE</Text>
              </>
            ) : (
              <>
                <WifiOff size={12} color="#f43f5e" />
                <Text className="text-xs font-semibold text-rose-600">OFFLINE</Text>
              </>
            )}
          </View>
        </View>

        {/* Section 1: Live Telemetry */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Activity size={16} color="#10b981" />
              <Text className="text-sm font-semibold text-foreground">
                Live Telemetry
              </Text>
            </View>
            <Text className="text-[11px] font-mono text-muted-foreground">
              sagana/stream
            </Text>
          </View>

          {latestTelemetry ? (
            <View className="gap-3">
              {/* Structured Metrics Tiles */}
              {(tempVal !== null || humidityVal !== null) && (
                <View className="flex-row gap-3">
                  {tempVal !== null && (
                    <View className="flex-1 rounded-2xl bg-card border border-border p-4 shadow-sm">
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="h-7 w-7 rounded-lg bg-orange-500/10 items-center justify-center">
                          <Thermometer size={15} color="#f97316" />
                        </View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase">
                          Temp
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold tracking-tight text-foreground">
                        {tempVal}°C
                      </Text>
                    </View>
                  )}

                  {humidityVal !== null && (
                    <View className="flex-1 rounded-2xl bg-card border border-border p-4 shadow-sm">
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="h-7 w-7 rounded-lg bg-sky-500/10 items-center justify-center">
                          <Droplets size={15} color="#0284c7" />
                        </View>
                        <Text className="text-xs font-medium text-muted-foreground uppercase">
                          Humidity
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold tracking-tight text-foreground">
                        {humidityVal}%
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Raw JSON Box */}
              <View className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <Text className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  Raw Payload
                </Text>
                <Text className="font-mono text-xs text-foreground leading-5">
                  {JSON.stringify(latestTelemetry, null, 2)}
                </Text>
              </View>
            </View>
          ) : (
            <View className="py-8 items-center justify-center rounded-2xl bg-card border border-dashed border-border p-6 shadow-sm">
              <Cpu size={24} color="#94a3b8" />
              <Text className="text-sm font-medium text-foreground mt-2.5">
                Waiting for Telemetry
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-1">
                Publish a message to sagana/stream in HiveMQ
              </Text>
            </View>
          )}
        </View>

        {/* Section 2: Command Dispatch */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">
              Send Command
            </Text>
            <Text className="text-[11px] font-mono text-muted-foreground">
              sagana/commands
            </Text>
          </View>

          <View className="rounded-2xl bg-card border border-border p-4 shadow-sm gap-3">
            {/* Quick Action Chips */}
            <View className="flex-row flex-wrap gap-2">
              {['RELAY_ON', 'RELAY_OFF', '{"state":1}', '{"state":0}'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => handleChipPress(preset)}
                  disabled={!isConnected}
                  className="rounded-lg bg-muted px-2.5 py-1.5 border border-border active:opacity-60"
                >
                  <Text className="text-[11px] font-mono text-foreground font-medium">
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input & Send Button */}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={commandText}
                onChangeText={setCommandText}
                placeholder="Type command (e.g. RELAY_ON)..."
                placeholderTextColor="#94a3b8"
                returnKeyType="send"
                onSubmitEditing={() => handleSendCommand()}
                className="flex-1 h-11 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground"
              />
              <Button
                variant="default"
                size="default"
                onPress={() => handleSendCommand()}
                disabled={!isConnected || !commandText.trim()}
                className="w-auto px-4 h-11 gap-1.5"
              >
                <Send size={14} color="#ffffff" />
                <Text className="text-white font-medium text-xs">Send</Text>
              </Button>
            </View>
          </View>
        </View>

        {/* Section 3: Activity Stream */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">
              Recent Activity ({logs.length})
            </Text>
            {logs.length > 0 && (
              <TouchableOpacity
                onPress={clearLogs}
                className="flex-row items-center gap-1 py-1 px-2 rounded-md active:bg-muted"
              >
                <Trash2 size={12} color="#94a3b8" />
                <Text className="text-xs text-muted-foreground">Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {logs.length > 0 ? (
            logs.slice(0, 4).map((log) => (
              <View
                key={log.id}
                className="mb-2 rounded-xl border border-border bg-card p-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View
                    className={`h-2 w-2 rounded-full ${
                      log.type === 'telemetry'
                        ? 'bg-emerald-500'
                        : log.type === 'command'
                          ? 'bg-sky-500'
                          : log.type === 'error'
                            ? 'bg-rose-500'
                            : 'bg-muted-foreground'
                    }`}
                  />
                  <View className="flex-1">
                    <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
                      {log.title}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={1}>
                      {typeof log.payload === 'object'
                        ? JSON.stringify(log.payload)
                        : String(log.payload)}
                    </Text>
                  </View>
                </View>
                <Text className="text-[10px] font-mono text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <View className="py-4 items-center justify-center">
              <Text className="text-xs text-muted-foreground">No recent events recorded</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
