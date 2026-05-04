import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '../../context/PreferencesContext';
import { Colors, BorderRadius, Spacing, Typography } from '../../utils/theme';

const FONT_OPTIONS = [
  { label: 'Small', value: 0.92 },
  { label: 'Default', value: 1 },
  { label: 'Large', value: 1.12 },
];

export default function SettingsScreen() {
  const { preferences, updatePreference } = usePreferences();

  const ToggleRow = ({ icon, label, description, value, onValueChange }) => (
    <View style={styles.row}>
      <View style={styles.iconWrap}><Ionicons name={icon} size={20} color={Colors.primary} /></View>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: Colors.primary }} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Display</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}><Ionicons name="contrast-outline" size={20} color={Colors.primary} /></View>
          <View style={styles.rowText}>
            <Text style={styles.label}>Theme</Text>
            <Text style={styles.description}>Choose how Vee looks on this device.</Text>
          </View>
        </View>
        <View style={styles.segmented}>
          {['light', 'dark', 'system'].map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[styles.segment, preferences.theme === theme && styles.segmentActive]}
              onPress={() => updatePreference('theme', theme)}
            >
              <Text style={[styles.segmentText, preferences.theme === theme && styles.segmentTextActive]}>
                {theme[0].toUpperCase() + theme.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.subLabel}>Font size</Text>
        <View style={styles.segmented}>
          {FONT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[styles.segment, preferences.fontScale === option.value && styles.segmentActive]}
              onPress={() => updatePreference('fontScale', option.value)}
            >
              <Text style={[styles.segmentText, preferences.fontScale === option.value && styles.segmentTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Experience</Text>
      <View style={styles.card}>
        <ToggleRow
          icon="play-circle-outline"
          label="Autoplay videos"
          description="Play videos automatically inside feed cards."
          value={preferences.autoplayVideos}
          onValueChange={(value) => updatePreference('autoplayVideos', value)}
        />
        <ToggleRow
          icon="accessibility-outline"
          label="Reduce motion"
          description="Use calmer transitions where supported."
          value={preferences.reduceMotion}
          onValueChange={(value) => updatePreference('reduceMotion', value)}
        />
        <ToggleRow
          icon="stats-chart-outline"
          label="Analytics hints"
          description="Show creator guidance inside post analytics."
          value={preferences.analyticsHints}
          onValueChange={(value) => updatePreference('analyticsHints', value)}
        />
      </View>

      <Text style={styles.sectionTitle}>Privacy</Text>
      <View style={styles.card}>
        <ToggleRow
          icon="lock-closed-outline"
          label="Private account"
          description="Keep account privacy preference on this device."
          value={preferences.privateAccount}
          onValueChange={(value) => updatePreference('privateAccount', value)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF5F7', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowText: { flex: 1 },
  label: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: '700' },
  description: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  subLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '700', paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  segmented: { flexDirection: 'row', margin: Spacing.md, marginTop: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: BorderRadius.sm },
  segmentActive: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  segmentText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '600' },
  segmentTextActive: { color: Colors.textPrimary },
});
