/**
 * components/common/Avatar.js
 * Circular avatar image with fallback to initials.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../utils/theme';
import { normalizeMediaUrl } from '../../api/client';

export default function Avatar({ uri, username = '?', size = 40, style }) {
  const [failed, setFailed] = useState(false);
  const initials = username.slice(0, 1).toUpperCase();
  const imageUri = normalizeMediaUrl(uri);

  useEffect(() => {
    setFailed(false);
  }, [imageUri]);
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {imageUri && !failed ? (
        <Image
          source={{ uri: imageUri }}
          onError={() => setFailed(true)}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: '#E0E0E0' },
  image: { resizeMode: 'cover' },
  fallback: { backgroundColor: '#C7C7C7', justifyContent: 'center', alignItems: 'center' },
  initials: { color: Colors.white, fontWeight: '700' },
});
