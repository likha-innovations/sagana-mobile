import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wifi,
  WifiOff,
  Radio,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  Trash2,
  RotateCw,
} from 'lucide-react-native';
import * as toast from 'burnt';
import { useSocket } from '@/hooks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    isConnected,
    latency,
    latestPong,
    latestMqtt,
    logs,
    sendSocketPing,
    sendMqttCommand,
    isSendingMqtt,
    clearLogs,
  } = useSocket();

  const [pingMessage, setPingMessage] = useState('Hello from Sagana Mobile!');

  const handleSendSocketPing = () => {
    const sent = sendSocketPing(pingMessage);
    if (sent) {
      toast.toast({
        title: 'Ping Sent',
        message: 'Emitted ping to Socket.IO gateway',
        preset: 'done',
      });
    }
  };

  const handleSendMqttPing = () => {
    sendMqttCommand(
      { deviceId: 'mobile-client', action: 'ping' },
      {
        onSuccess: () => {
          toast.toast({
            title: 'MQTT Ping Sent',
            message: 'Dispatched command to MQTT broker',
            preset: 'done',
          });
        },
      }
    );
  };

  const formatReceivedData = (data: unknown) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null && 'message' in data) {
      return String((data as any).message);
    }
    return JSON.stringify(data);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Live Web & MQTT Communications
            </Text>
          </View>
          <View
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi size={13} color="#10b981" />
                <Text className="text-xs font-semibold text-emerald-600">LIVE</Text>
              </>
            ) : (
              <>
                <WifiOff size={13} color="#f43f5e" />
                <Text className="text-xs font-semibold text-rose-600">OFFLINE</Text>
              </>
            )}
          </View>
        </View>

        <View className="gap-4 mb-5">
          <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
            <CardHeader className="flex-row items-center justify-between pb-2 border-b border-border/50">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 rounded-lg bg-emerald-700/10 items-center justify-center">
                  <Zap size={18} color="#047857" />
                </View>
                <View>
                  <CardTitle className="text-base">Socket.IO Message</CardTitle>
                  <CardDescription>Live reply from server / web client</CardDescription>
                </View>
              </View>
              {latency !== null && (
                <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  <Clock size={12} color="#047857" />
                  <Text className="text-xs font-medium text-emerald-700">{latency}ms</Text>
                </View>
              )}
            </CardHeader>
            <CardContent className="gap-3 pt-3">
              <View className="rounded-xl bg-card border border-border p-3.5 shadow-sm">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Received Data
                </Text>
                {latestPong ? (
                  <View className="gap-1">
                    <Text className="text-base font-semibold text-foreground">
                      {formatReceivedData(latestPong.received)}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <Text className="text-xs text-muted-foreground">
                        Source: <Text className="font-medium text-foreground">{latestPong.source}</Text>
                      </Text>
                      <Text className="text-[10px] font-mono text-muted-foreground">
                        {new Date(latestPong.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="py-2 items-center justify-center">
                    <Text className="text-xs text-muted-foreground">
                      Waiting for ping from web client or mobile...
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-2">
                <TextInput
                  value={pingMessage}
                  onChangeText={setPingMessage}
                  placeholder="Type a test ping message..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
                />
                <Button
                  variant="default"
                  size="sm"
                  onPress={handleSendSocketPing}
                  disabled={!isConnected}
                  className="w-auto px-4 gap-1.5"
                >
                  <Send size={14} color="#ffffff" />
                  <Text className="text-white font-medium text-xs">Ping</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          <Card className="border-sky-500/20 bg-sky-500/[0.02]">
            <CardHeader className="flex-row items-center justify-between pb-2 border-b border-border/50">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 rounded-lg bg-sky-700/10 items-center justify-center">
                  <Radio size={18} color="#0284c7" />
                </View>
                <View>
                  <CardTitle className="text-base">MQTT Event</CardTitle>
                  <CardDescription>Topic: sagana/pong</CardDescription>
                </View>
              </View>
              <View className="flex-row items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} color="#0284c7" />
                <Text className="text-xs font-medium text-sky-700">ACTIVE</Text>
              </View>
            </CardHeader>
            <CardContent className="gap-3 pt-3">
              <View className="rounded-xl bg-card border border-border p-3.5 shadow-sm">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Latest MQTT Payload
                </Text>
                {latestMqtt ? (
                  <View className="gap-1">
                    <Text className="text-base font-semibold text-foreground">
                      {latestMqtt.message}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <Text className="text-xs font-mono text-sky-700">
                        {latestMqtt.topic}
                      </Text>
                      <Text className="text-[10px] font-mono text-muted-foreground">
                        {new Date(latestMqtt.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="py-2 items-center justify-center">
                    <Text className="text-xs text-muted-foreground">
                      No MQTT messages received yet.
                    </Text>
                  </View>
                )}
              </View>

              <Button
                variant="outline"
                size="sm"
                onPress={handleSendMqttPing}
                loading={isSendingMqtt}
                className="gap-2 border-sky-200 bg-sky-50/60 active:bg-sky-100"
              >
                <RotateCw size={14} color="#0284c7" />
                <Text className="text-sky-700 font-medium text-xs">
                  Dispatch MQTT Test Ping
                </Text>
              </Button>
            </CardContent>
          </Card>
        </View>

        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

        {logs.slice(0, 5).map((log) => (
          <View
            key={log.id}
            className="mb-2 rounded-lg border border-border bg-card p-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <View
                className={`h-2 w-2 rounded-full ${
                  log.type.includes('pong')
                    ? 'bg-emerald-500'
                    : log.type === 'error'
                      ? 'bg-rose-500'
                      : 'bg-sky-500'
                }`}
              />
              <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
                {log.title}
              </Text>
            </View>
            <Text className="text-[10px] font-mono text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
