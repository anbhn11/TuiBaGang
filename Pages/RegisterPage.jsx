import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { findUser, registerUser } from '../db';
import { colors, fonts } from '../theme';
import PatternBorder from '../components/PatternBorder';

export default function RegisterPage({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    const ten = username.trim();

    if (ten.length < 3) {
      setErrorMessage('Tên đăng nhập phải từ 3 ký tự trở lên');
      return;
    }

    if (/\s/.test(ten)) {
      setErrorMessage('Tên đăng nhập không được có khoảng trắng');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    if (password !== confirm) {
      setErrorMessage('Mật khẩu nhập lại không khớp');
      return;
    }

    try {
      const existed = await findUser(ten);

      if (existed !== null) {
        setErrorMessage('Tên đăng nhập này đã có người dùng');
        return;
      }

      await registerUser(ten, password);

      // Quay về Login và gửi username sang để điền sẵn
      navigation.navigate('Login', { username: ten });
    } catch (error) {
      setErrorMessage('Không đăng ký được: ' + error.message);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Image source={require('../assets/logo.jpg')} style={styles.logo} />
      <Text style={styles.title}>Túi Ba Gang</Text>

      <PatternBorder style={styles.pattern} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tạo tài khoản</Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Tên đăng nhập"
          placeholderTextColor={colors.inkMute}
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu (từ 6 ký tự)"
          placeholderTextColor={colors.inkMute}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Nhập lại mật khẩu"
          placeholderTextColor={colors.inkMute}
          secureTextEntry
          style={styles.input}
        />

        {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

        <Pressable style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>ĐĂNG KÝ</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
        </Pressable>
      </View>

      <PatternBorder style={styles.pattern} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: { padding: 24, justifyContent: 'center', flexGrow: 1 },

  logo: { width: 90, height: 90, borderRadius: 45, alignSelf: 'center' },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.cream,
    textAlign: 'center',
    marginTop: 10,
  },
  pattern: { marginVertical: 16 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 18,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 14,
    color: colors.ink,
    backgroundColor: '#fff',
  },

  error: { color: colors.chi, marginBottom: 12 },

  button: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: colors.gold, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 18, fontWeight: 'bold' },
});
