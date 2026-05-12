/**
 * navigation/AppNavigator.js
 * Root navigator - switches between Auth and Main app flows.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, useAppTheme } from '../utils/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import CommentsScreen from '../screens/main/CommentsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SearchScreen from '../screens/main/SearchScreen';
import InboxScreen from '../screens/main/InboxScreen';
import ChatScreen from '../screens/main/ChatScreen';
import StoryViewerScreen from '../screens/main/StoryViewerScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import PostAnalyticsScreen from '../screens/main/PostAnalyticsScreen';
import LiveScreen from '../screens/main/LiveScreen';
import { Image } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Feed" component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <View style={styles.brandTitle}>
              <View style={styles.brandMark}>
                <Text><Image source={require("../assets/vtwo.png")} style={{ height: 100, width: 100, borderRadius: 50 }} /></Text>
              </View>
              <View>
                <Text style={[styles.brandName, { color: colors.textPrimary }]}>Vee</Text>
                <Text style={[styles.brandSub, { color: colors.textSecondary }]}>Today on your feed</Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Live')}
                activeOpacity={0.85}
              >
                <Ionicons name="radio-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => navigation.getParent()?.navigate('SearchTab', { screen: 'Search' })}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => navigation.getParent()?.navigate('InboxTab', { screen: 'Notifications' })}
                activeOpacity={0.85}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ),
          headerShadowVisible: false,
        })} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Comments' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostAnalytics" component={PostAnalyticsScreen} options={{ title: 'Post analytics' }} />
      <Stack.Screen name="Live" component={LiveScreen} options={{ title: 'Live' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="MyProfile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Comments' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostAnalytics" component={PostAnalyticsScreen} options={{ title: 'Post analytics' }} />
    </Stack.Navigator>
  );
}

function InboxStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Activity' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Comments' }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '' }} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Comments' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostAnalytics" component={PostAnalyticsScreen} options={{ title: 'Post analytics' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors, isDark } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: isDark ? colors.textPrimary : Colors.black,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          backgroundColor: colors.surface,
          height: 56,
          paddingBottom: 6,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            HomeTab:          focused ? 'home'          : 'home-outline',
            SearchTab:        focused ? 'search'        : 'search-outline',
            CreateTab:        focused ? 'add-circle'    : 'add-circle-outline',
            InboxTab:         focused ? 'paper-plane'   : 'paper-plane-outline',
            ProfileTab:       focused ? 'person'        : 'person-outline',
          };
          return (
            <Ionicons
              name={icons[route.name]}
              size={route.name === 'CreateTab' ? 32 : 26}
              color={route.name === 'CreateTab' ? colors.primary : color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="SearchTab" component={SearchStack} />
      <Tab.Screen name="CreateTab" component={CreatePostScreen}
        options={{ headerShown: true, title: 'New Post' }} />
      <Tab.Screen name="InboxTab" component={InboxStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { colors, isDark } = useAppTheme();
  const navTheme = isDark ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      text: colors.textPrimary,
    },
  } : DefaultTheme;
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  brandTitle: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  brandName: { color: Colors.textPrimary, fontWeight: '900', fontSize: 18 },
  brandSub: { color: Colors.textSecondary, fontWeight: '700', fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
});
