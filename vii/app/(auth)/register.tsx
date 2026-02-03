// app/(auth)/register.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = () => {
    const { fullName, email, phone, password, confirmPassword } = formData;
    
    if (!fullName || !email || !phone || !password || !confirmPassword) {
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
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)'); 
    }, 1500);
  };

  const handleSocialRegister = (provider: string) => {
    Alert.alert(`${provider} Sign Up`, `${provider} registration would be implemented here`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="compass" size={48} color="#0026ff" />
            </View>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Join our travel community</Text>
          </View>

          {/* Social Login Buttons (at the top) */}
          <View style={styles.socialButtonsTop}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => handleSocialRegister('Google')}
            >
              <Feather name="chrome" size={20} color="#DB4437" />
              <Text style={[styles.socialButtonText, styles.googleText]}>
                Sign up with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialRegister('Facebook')}
            >
              <Feather name="facebook" size={20} color="#4267B2" />
              <Text style={[styles.socialButtonText, styles.facebookText]}>
                Sign up with Facebook
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999999"
                value={formData.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999999"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Feather name="phone" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#999999"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999999"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999999"
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>

              <View style={styles.requirementItem}>
                <Feather 
                  name={formData.password.length >= 6 ? 'check-circle' : 'circle'} 
                  size={14} 
                  color={formData.password.length >= 6 ? '#0026ff' : '#999999'} 
                />
                <Text style={styles.requirementText}>At least 6 characters</Text>
              </View>

              <View style={styles.requirementItem}>
                <Feather 
                  name={/[A-Z]/.test(formData.password) ? 'check-circle' : 'circle'} 
                  size={14} 
                  color={/[A-Z]/.test(formData.password) ? '#0026ff' : '#999999'} 
                />
                <Text style={styles.requirementText}>One uppercase letter</Text>
              </View>
              
              <View style={styles.requirementItem}>
                <Feather 
                  name={/\d/.test(formData.password) ? 'check-circle' : 'circle'} 
                  size={14} 
                  color={/\d/.test(formData.password) ? '#0026ff' : '#999999'} 
                />
                <Text style={styles.requirementText}>One number</Text>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.registerButtonText}>Creating Account...</Text>
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

           
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { marginBottom: 16 },
  welcomeText: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666666', textAlign: 'center' },
  socialButtonsTop: { width: '100%', gap: 12, marginBottom: 20 },
  socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 12, borderWidth: 1 },
  googleButton: { borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  facebookButton: { borderColor: '#4267B2', backgroundColor: '#FFFFFF' },
  socialButtonText: { fontSize: 16, fontWeight: '600' },
  googleText: { color: '#1A1A1A' },
  facebookText: { color: '#1A1A1A' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  dividerText: { marginHorizontal: 16, color: '#999999', fontSize: 14, fontWeight: '500' },
  form: { width: '100%', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1A1A1A', height: '100%' },
  eyeIcon: { padding: 8 },
  requirements: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#E5E5E5' },
  requirementsTitle: { fontSize: 14, fontWeight: '600', color: '#666666', marginBottom: 8 },
  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  requirementText: { fontSize: 12, color: '#666666' },
  registerButton: { backgroundColor: '#0026ff', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 10 },
  registerButtonDisabled: { backgroundColor: '#8BBFA8' },
  registerButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  socialButtonsBottom: { alignItems: 'center', marginTop: 16 },
  socialBottomText: { fontSize: 14, color: '#666666', marginBottom: 12 },
  socialIconsRow: { flexDirection: 'row', gap: 24 },
  socialIconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  loginText: { fontSize: 16, color: '#666666' },
  loginLink: { fontSize: 16, color: '#0026ff', fontWeight: 'bold' },
  termsText: { fontSize: 12, color: '#999999', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});