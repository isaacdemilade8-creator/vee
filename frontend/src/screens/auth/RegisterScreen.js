/**
 * screens/auth/RegisterScreen.js
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, useAppTheme } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useAppTheme();
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    setErrors({});
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (!result.success) {
      if (result.errors && Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    }
  };

  const renderField = ({ field, placeholder, keyboardType, secureTextEntry, autoCapitalize, returnKeyType = 'next' }) => (
    <View style={styles.fieldWrapper}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }, errors[field] && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={form[field]}
        onChangeText={update(field)}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={!!secureTextEntry}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
        returnKeyType={returnKeyType}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field][0]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always" keyboardDismissMode="none" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join Vee today</Text>
        </View>

        <View style={styles.form}>
          {renderField({ field: 'full_name', placeholder: 'Full name' })}
          {renderField({ field: 'username', placeholder: 'Username', autoCapitalize: 'none' })}
          {renderField({ field: 'email', placeholder: 'Email address', keyboardType: 'email-address', autoCapitalize: 'none' })}
          {renderField({ field: 'password', placeholder: 'Password (min 8 characters)', secureTextEntry: true })}
          {renderField({ field: 'password_confirmation', placeholder: 'Confirm password', secureTextEntry: true, returnKeyType: 'done' })}

          <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.textSecondary }]}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxxl },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl, marginTop: Spacing.xl },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6 },
  form: { width: '100%' },
  fieldWrapper: { marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, height: 48 },
  inputError: { borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: Typography.xs, marginTop: 4 },
  button: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  disabled: { opacity: 0.7 },
  buttonText: { color: Colors.white, fontSize: Typography.base, fontWeight: '600' },
  terms: { color: Colors.textSecondary, fontSize: Typography.xs, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.xl },
  loginText: { fontSize: Typography.sm, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
});
