import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StatusBar, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import HomePage from './Pages/HomePage';
import AddTransactionPage from './Pages/AddTransactionPage';
import CategoriesPage from './Pages/CategoriesPage';
import WalletsPage from './Pages/WalletsPage';
import BudgetsPage from './Pages/BudgetsPage';
import StatsPage from './Pages/StatsPage';
import { findUser, setCurrentUser } from './db';
import { USER_KEY } from './utils';
import { colors, fonts } from './theme';

const Stack = createNativeStackNavigator();

// Tiêu đề màn Home: logo tròn + "Túi Ba Gang của <tên người dùng>"
function HomeTitle() {
  const [username, setUsername] = useState('');

  // Lấy tên người đang đăng nhập đã lưu lúc đăng nhập
  useEffect(() => {
    const loadName = async () => {
      try {
        const name = await AsyncStorage.getItem(USER_KEY);
        if (name !== null) setUsername(name);
      } catch (error) {
        // Không đọc được thì chỉ hiện tên app
      }
    };

    loadName();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
      <Image
        source={require('./assets/logo.jpg')}
        style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }}
      />
      <Text
        numberOfLines={1}
        style={{ color: colors.cream, fontFamily: fonts.heading, fontSize: 18, fontWeight: 'bold', flexShrink: 1 }}
      >
        Túi Ba Gang
        {username !== '' && <Text style={{ color: colors.gold }}> của {username}</Text>}
      </Text>
    </View>
  );
}

export default function App() {
  // null = đang kiểm tra, sau đó là 'Home' (đã đăng nhập) hoặc 'Login'
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (savedUser !== null) {
          // Tìm lại tài khoản đã đăng nhập để biết dữ liệu nào là của họ
          const user = await findUser(savedUser);

          if (user !== null) {
            setCurrentUser(user.id);
            setInitialRoute('Home');
            return;
          }

          await AsyncStorage.removeItem(USER_KEY);
        }

        setInitialRoute('Login');
      } catch (error) {
        setInitialRoute('Login');
      }
    };

    checkLogin();
  }, []);

  if (initialRoute === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.primary,
        }}
      >
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.cream, fontFamily: fonts.heading, fontWeight: 'bold' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterPage} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomePage} options={{ headerTitle: () => <HomeTitle /> }} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionPage}
          options={{ title: 'Thêm giao dịch' }}
        />
        <Stack.Screen name="Categories" component={CategoriesPage} options={{ title: 'Danh mục' }} />
        <Stack.Screen name="Wallets" component={WalletsPage} options={{ title: 'Ví / Tài khoản' }} />
        <Stack.Screen name="Budgets" component={BudgetsPage} options={{ title: 'Ngân sách' }} />
        <Stack.Screen name="Stats" component={StatsPage} options={{ title: 'Thống kê' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}