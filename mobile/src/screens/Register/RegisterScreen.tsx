import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/types';

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const { register } = useAuth();

  // ======= VALIDATE FORM =======
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Họ tên không được quá 50 ký tự';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (password.length > 100) {
      newErrors.password = 'Mật khẩu không được quá 100 ký tự';
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ======= CLEAR ERROR KHI GÕ =======
  const handleNameChange = (text: string): void => {
    setName(text);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (text: string): void => {
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  // ======= XỬ LÝ ĐĂNG KÝ =======
  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      // Nếu thành công, AuthContext sẽ tự chuyển màn hình
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Đăng ký thất bại';
      Alert.alert('Đăng ký thất bại', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ======= RENDER =======
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <Text style={styles.title}>✨ Tạo tài khoản</Text>
          <Text style={styles.subtitle}>
            Đăng ký để bắt đầu trò chuyện
          </Text>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ tên</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Nhập họ tên của bạn"
              placeholderTextColor="#999"
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
            />
            {errors.name && (
              <Text style={styles.errorText}>⚠️ {errors.name}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="example@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={styles.errorText}>⚠️ {errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                placeholder="Ít nhất 6 ký tự"
                placeholderTextColor="#999"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                maxLength={100}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>⚠️ {errors.password}</Text>
            )}

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width:
                        password.length < 6
                          ? '30%'
                          : password.length < 10
                          ? '60%'
                          : '100%',
                      backgroundColor:
                        password.length < 6
                          ? '#FF3B30'
                          : password.length < 10
                          ? '#FF9500'
                          : '#34C759',
                    },
                  ]}
                />
                <Text style={styles.strengthText}>
                  {password.length < 6
                    ? 'Yếu'
                    : password.length < 10
                    ? 'Trung bình'
                    : 'Mạnh'}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                maxLength={100}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>
                ⚠️ {errors.confirmPassword}
              </Text>
            )}

            {/* Match indicator */}
            {confirmPassword.length > 0 && !errors.confirmPassword && (
              <Text style={styles.matchText}>
                {password === confirmPassword
                  ? '✅ Mật khẩu khớp'
                  : ''}
              </Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.buttonText}> Đang tạo...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Tạo tài khoản</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Đã có tài khoản?{' '}
              <Text style={styles.linkBold}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 6,
  },
  matchText: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 6,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkBold: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;