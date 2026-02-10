import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Account created! Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-900"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-bold text-white mb-2">
              Create Account
            </Text>
            <Text className="text-gray-400 text-base">
              Sign up to get started
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-gray-300 mb-2 text-sm font-medium">
                Username
              </Text>
              <TextInput
                className="bg-gray-800 text-white px-4 py-4 rounded-xl text-base"
                placeholder="johndoe"
                placeholderTextColor="#6b7280"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-gray-300 mb-2 text-sm font-medium">
                Email
              </Text>
              <TextInput
                className="bg-gray-800 text-white px-4 py-4 rounded-xl text-base"
                placeholder="your@email.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-gray-300 mb-2 text-sm font-medium">
                Password
              </Text>
              <TextInput
                className="bg-gray-800 text-white px-4 py-4 rounded-xl text-base"
                placeholder="Min. 6 characters"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-gray-300 mb-2 text-sm font-medium">
                Confirm Password
              </Text>
              <TextInput
                className="bg-gray-800 text-white px-4 py-4 rounded-xl text-base"
                placeholder="Re-enter password"
                placeholderTextColor="#6b7280"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className={`bg-blue-600 py-4 rounded-xl mt-6 ${
                loading ? 'opacity-50' : ''
              }`}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold text-base">
                {loading ? 'Creating account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}