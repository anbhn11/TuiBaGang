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
import { USER_KEY } from './utils';
import { colors, fonts } from './theme';

const Stack = createNativeStackNavigator();

// Tiêu đề màn Home: logo tròn + tên app
function HomeTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image
        source={require('./assets/logo.jpg')}
        style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }}
      />
      <Text style={{ color: colors.cream, fontFamily: fonts.heading, fontSize: 19, fontWeight: 'bold' }}>
        Túi Ba Gang
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
        setInitialRoute(savedUser !== null ? 'Home' : 'Login');
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