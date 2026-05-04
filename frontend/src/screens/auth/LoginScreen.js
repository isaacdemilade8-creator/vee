/**
 * screens/auth/LoginScreen.js
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email or username is required.';
    if (!password.trim()) newErrors.password = 'Password is required.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    const result = await login({ email: email.trim(), password });
    setLoading(false);
    if (!result.success) Alert.alert('Login Failed', result.message);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={['#833AB4','#FD1D1D','#FCAF45']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.logoGradient}>
            <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
          </LinearGradient>
          <Text style={styles.appName}>Vee</Text>
          <Text style={styles.tagline}>Share your world</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email or username"
            placeholderTextColor={Colors.textSecondary}
            value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" returnKeyType="next" autoCorrect={false}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            placeholderTextColor={Colors.textSecondary}
            value={password} onChangeText={setPassword}
            secureTextEntry returnKeyType="done" onSubmitEditing={handleLogin}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <TouchableOpacity style={[styles.loginButton, loading && styles.disabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.loginButtonText}>Log In</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoGradient: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  logoImage: { width: 48, height: 48, borderRadius: 12 },
  appName: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  form: { width: '100%' },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, height: 48, marginBottom: Spacing.sm },
  inputError: { borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: Typography.xs, marginBottom: Spacing.sm },
  loginButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
  disabled: { opacity: 0.7 },
  loginButtonText: { color: Colors.white, fontSize: Typography.base, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '600', marginHorizontal: Spacing.md },
  registerRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.lg },
  registerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  registerLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
});
