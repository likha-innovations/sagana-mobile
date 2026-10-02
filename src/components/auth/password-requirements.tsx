import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password?: string;
  unmetRequirements?: string[];
  hasAttemptedSubmit?: boolean;
}

export function PasswordRequirements({
  password = '',
  unmetRequirements,
  hasAttemptedSubmit = false,
}: PasswordRequirementsProps) {
  // Legacy support if unmetRequirements array is explicitly passed without password
  if (unmetRequirements && unmetRequirements.length > 0 && !password) {
    return (
      <View className="mt-2 w-full pl-2">
        {unmetRequirements.map((req, index) => (
          <View key={index} className="flex-row items-center gap-2 mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-destructive" />
            <Text className="text-[13px] font-sans text-destructive leading-6">{req}</Text>
          </View>
        ))}
      </View>
    );
  }

  const rules = [
    {
      id: 'length',
      label: 'At least 12+ characters',
      valid: password.length >= 12,
    },
    {
      id: 'number',
      label: 'Must have a number (0–9)',
      valid: /\d/.test(password),
    },
    {
      id: 'symbol',
      label: 'Must have a special symbol (e.g., !@#$)',
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  return (
    <View className="w-full mt-2 pl-1 gap-1.5">
      {rules.map((rule) => {
        const isError = hasAttemptedSubmit && !rule.valid;

        return (
          <View key={rule.id} className="flex-row items-center gap-2">
            {rule.valid ? (
              <View className="w-4 h-4 rounded-full bg-primary/20 items-center justify-center">
                <Check size={11} color="#718619" strokeWidth={3} />
              </View>
            ) : isError ? (
              <View className="w-4 h-4 items-center justify-center">
                <View className="w-1.5 h-1.5 rounded-full bg-destructive" />
              </View>
            ) : (
              <View className="w-4 h-4 items-center justify-center">
                <View className="w-1.5 h-1.5 rounded-full bg-[#96958F]" />
              </View>
            )}
            <Text
              className={cn(
                'text-[13px] leading-5',
                rule.valid
                  ? 'text-primary font-medium'
                  : isError
                  ? 'text-destructive font-sans'
                  : 'text-[#96958F] font-sans'
              )}
            >
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
