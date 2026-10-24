import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findUser } from '../db';
import { USER_KEY } from '../utils';
import { colors, fonts } from '../theme';
import PatternBorder from '../components/PatternBorder';

export default function LoginPage({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Register gửi username về đây sau khi đăng ký thành công
  useEffect(() => {
    if (route.params?.username) {
      setUsername(route.params.username);
      setPassword('');
      setErrorMessage('');
      setInfoMessage('Đăng ký thành công, hãy đăng nhập');
    }
  }, [route.params?.username]);

  const handleLogin = async () => {
    const ten = username.trim();

    if (ten === '' || password === '') {
      setInfoMessage('');
      setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    try {
      const user = await findUser(ten);

      if (user === null || user.password !== password) {
        setInfoMessage('');
        setErrorMessage('Sai tên đăng nhập hoặc mật khẩu');
        return;
      }

      // Nhớ trạng thái đăng nhập để lần sau mở app vào thẳng Home
      await AsyncStorage.setItem(USER_KEY, user.username);
      navigation.replace('Home');
    } catch (error) {
      setInfoMessage('');
      setErrorMessage('Không đăng nhập được: ' + error.message);
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
      <Text style={styles.tagline}>Quản lý chi tiêu cá nhân</Text>

      <PatternBorder style={styles.pattern} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Đăng nhập</Text>

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
          placeholder="Mật khẩu"
          placeholderTextColor={colors.inkMute}
          secureTextEntry
          style={styles.input}
        />

        {infoMessage !== '' && <Text style={styles.info}>{infoMessage}</Text>}
        {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
        </Pressable>
      </View>

      <PatternBorder style={styles.pattern} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: { padding: 24, justifyContent: 'center', flexGrow: 1 },

  logo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center' },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.cream,
    textAlign: 'center',
    marginTop: 12,
  },
  tagline: { color: colors.gold, textAlign: 'center', marginTop: 4 },
  pattern: { marginVertical: 18 },

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

  info: { color: colors.thu, marginBottom: 12 },
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
