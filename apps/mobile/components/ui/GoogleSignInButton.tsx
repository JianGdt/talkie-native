import React, { useState } from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  disabled?: boolean;
}

export default function GoogleSignInButton({ disabled }: Props) {
  const { signInWithGoogle, isLoading } = useAuth();
  const [, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center gap-3 border border-slate-200"
      activeOpacity={0.8}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <View className="w-6 h-6">
            <AntDesign name="google" size={24} color="black" />
          </View>

          <Text className="text-slate-700 text-base font-semibold">
            Continue with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
