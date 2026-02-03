// app/(tabs)/profile.tsx
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthProvider';

export default function ProfileTabScreen() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authContext?.logout();
              // Navigation is handled by AuthProvider state change
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Refresh user profile
  const handleRefreshProfile = async () => {
    if (!authContext?.user) return;
    
    setIsRefreshing(true);
    try {
      await authContext?.getUserProfile();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format user location
  const formatLocation = (user: any) => {
    if (user?.city && user?.country) {
      return `${user.city}, ${user.country}`;
    } else if (user?.city) {
      return user.city;
    } else if (user?.country) {
      return user.country;
    }
    return 'Location not set';
  };

  // Format member since date
  const formatMemberSince = (createdAt: string) => {
    if (!createdAt) return 'N/A';
    const date = new Date(createdAt);
    return date.getFullYear().toString();
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    { id: 1, icon: 'user', label: 'My Profile', screen: '/profile/edit' },
    { id: 2, icon: 'briefcase', label: 'My Bookings', screen: '/profile/bookings' },
    { id: 3, icon: 'heart', label: 'My Favorites', screen: '/profile/favorites' },
    { id: 4, icon: 'map-pin', label: 'Saved Places', screen: '/profile/saved' },
    { id: 5, icon: 'credit-card', label: 'Payment Methods', screen: '/profile/payments' },
    { id: 6, icon: 'settings', label: 'Settings', screen: '/profile/settings' },
    { id: 7, icon: 'help-circle', label: 'Help Center', screen: '/profile/help' },
  ];

  // Show loading state if auth is still loading
  if (authContext?.isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0026ff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  // If user is not authenticated, show message
  if (!authContext?.isAuthenticated || !authContext?.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Feather name="user-x" size={64} color="#999" />
          <Text style={styles.notAuthenticatedTitle}>Not Signed In</Text>
          <Text style={styles.notAuthenticatedText}>
            Please sign in to view your profile
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const user = authContext.user;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        {/* <View style={styles.headerCard}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View> */}
        <View style={styles.headerCard}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={20} color="#1A1A1A" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>My Profile</Text>
                  <View style={styles.backButton} />
                </View>
        

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user.name || user.email)}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={16} color="#0026ff" />
            </View>
          </View>
          
          <Text style={styles.userName}>{user.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userLocation}>
            📍 {formatLocation(user)}
          </Text>
          
          {/* Additional user info if available */}
          {/* {(user.phone || user.bio) && (
            <View style={styles.additionalInfo}>
              {user.phone && (
                <View style={styles.infoRow}>
                  <Feather name="phone" size={16} color="#666" />
                  <Text style={styles.infoText}>{user.phone}</Text>
                </View>
              )}
              {user.bio && (
                <View style={styles.infoRow}>
                  <Feather name="info" size={16} color="#666" />
                  <Text style={styles.infoText} numberOfLines={2}>
                    {user.bio}
                  </Text>
                </View>
              )}
            </View>
          )} */}
          
          <TouchableOpacity 
            style={styles.refreshProfileButton}
            onPress={handleRefreshProfile}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                <Text style={styles.refreshProfileButtonText}>Refresh Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => router.push(item.screen as any)}
            >
              <View style={styles.menuItemLeft}>
                <Feather name={item.icon as any} size={22} color="#0026ff" />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={22} color="#C41E3A" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Visit Morocco Now v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FAFAFA'
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666' 
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 8,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#0026ff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 14,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0026ff',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 20, 
    marginVertical: 20, 
    padding: 24, 
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E5E5' 
  },
  avatarContainer: { 
    position: 'relative', 
    marginBottom: 16 
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#0026ff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  verifiedBadge: { 
    position: 'absolute', 
    bottom: 4, 
    right: 4, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 10, 
    padding: 2 
  },
  userName: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1A1A1A', 
    marginBottom: 4,
    textAlign: 'center'
  },
  userEmail: { 
    fontSize: 16, 
    color: '#666666', 
    marginBottom: 8,
    textAlign: 'center'
  },
  userLocation: { 
    fontSize: 14, 
    color: '#666666', 
    marginBottom: 20,
    textAlign: 'center'
  },
  refreshProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0026ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  refreshProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  additionalInfo: {
    marginTop: 16,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  menuSection: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 20, 
    marginBottom: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E5E5E5' 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1A1A1A', 
    marginBottom: 16, 
    marginTop: 8 
  },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  menuItemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  menuItemLabel: { 
    fontSize: 16, 
    color: '#1A1A1A' 
  },
  signOutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    marginHorizontal: 20, 
    marginBottom: 20, 
    paddingVertical: 16, 
    backgroundColor: '#FFE5E5', 
    borderRadius: 12 
  },
  signOutText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#C41E3A' 
  },
  footer: { 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  footerText: { 
    fontSize: 12, 
    color: '#999999' 
  },
});
