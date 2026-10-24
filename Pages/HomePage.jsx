import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  deleteTransaction,
  getAllTransactions,
  getBudgetsWithSpent,
  getSummary,
} from '../db';
import { USER_KEY, formatDate, formatMoney, getMonthKey, getPercent } from '../utils';

import { colors, fonts } from '../theme';
import PatternBorder from '../components/PatternBorder';

export default function HomePage({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ thu: 0, chi: 0, initial: 0 });
  const [warnings, setWarnings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        onPress: async () => {
          await AsyncStorage.removeItem(USER_KEY);
          navigation.replace('Login');
        },
      },
    ]);
  };

  // Nút Đăng xuất ở góc phải thanh tiêu đề
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const loadData = async () => {
    try {
      setErrorMessage('');

      const list = await getAllTransactions();
      const total = await getSummary();
      const budgets = await getBudgetsWithSpent(getMonthKey(new Date()));

      setTransactions(list);
      setSummary(total);
      // Chỉ giữ ngân sách đã dùng từ 80% trở lên
      setWarnings(budgets.filter((b) => getPercent(b.spent, b.amount) >= 80));
    } catch (error) {
      setErrorMessage('Không đọc được dữ liệu: ' + error.message);
    }
  };

  // Tải lại mỗi khi màn hình này được mở hoặc quay về từ màn khác
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const confirmDelete = (item) => {
    Alert.alert('Xác nhận xóa', 'Xóa giao dịch "' + item.category_name + '"?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(item.id);
            await loadData();
          } catch (error) {
            Alert.alert('Lỗi', 'Không xóa được: ' + error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isThu = item.type === 'thu';

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.category}>{item.category_name ?? 'Không rõ'}</Text>

          <Text style={styles.meta}>
            {item.wallet_name ?? 'Không rõ'} · {formatDate(item.created_at)}
          </Text>

          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.amount, isThu ? styles.thu : styles.chi]}>
            {isThu ? '+' : '-'}
            {formatMoney(item.amount)}đ
          </Text>

          <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
            <Text style={styles.deleteText}>Xóa</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const balance = summary.initial + summary.thu - summary.chi;

  return (
    <View style={styles.container}>
      <PatternBorder />

      <View style={styles.summaryCard}>
        <View style={styles.drumOuter}>
          <View style={styles.drumMid}>
            <View style={styles.drumInner} />
          </View>
        </View>

        <Text style={styles.balanceLabel}>Tổng số dư</Text>
        <Text style={styles.balance}>{formatMoney(balance)}đ</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng thu</Text>
            <Text style={[styles.summaryValue, styles.thu]}>
              {formatMoney(summary.thu)}đ
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={[styles.summaryValue, styles.chi]}>
              {formatMoney(summary.chi)}đ
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.actionMain]}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Text style={styles.actionMainText}>+ GIAO DỊCH</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.actionText}>Danh mục</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('Wallets')}
        >
          <Text style={styles.actionText}>Ví</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('Budgets')}
        >
          <Text style={styles.actionText}>Ngân sách</Text>
        </Pressable>
      </View>

      {warnings.length > 0 && (
        <View style={styles.warnBox}>
          {warnings.map((b) => {
            const percent = getPercent(b.spent, b.amount);

            return (
              <Text key={b.id} style={[styles.warnText, percent >= 100 && styles.warnOver]}>
                {percent >= 100 ? 'Vượt ngân sách' : 'Sắp hết ngân sách'}: {b.category_name} (
                {percent}%)
              </Text>
            );
          })}
        </View>
      )}

      {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Chưa có giao dịch nào</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  summaryCard: {
    backgroundColor: '#4A1219',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C8A048',
    overflow: 'hidden',
  },
  drumOuter: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#C8A048',
    opacity: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumMid: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#C8A048',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumInner: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#C8A048' },
  balanceLabel: { color: colors.goldSoft, fontSize: 14 },
  balance: { fontFamily: fonts.heading, color: colors.cream, fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: { color: colors.inkSoft, fontSize: 13 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },

  logoutText: { color: '#C8A048', fontWeight: 'bold' },

  thu: { color: colors.thu },
  chi: { color: colors.chi },

  actions: { flexDirection: 'row', gap: 8, marginHorizontal: 12 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  actionMain: { flex: 2, backgroundColor: colors.primary },
  actionText: { color: colors.primary, fontWeight: 'bold' },
  actionMainText: { color: colors.cream, fontWeight: 'bold' },

  warnBox: {
    backgroundColor: colors.warnBg,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  warnText: { color: colors.warn, fontSize: 14, marginVertical: 1 },
  warnOver: { color: colors.chi, fontWeight: 'bold' },

  error: { color: colors.chi, textAlign: 'center', margin: 12 },

  list: { padding: 12 },
  empty: { textAlign: 'center', color: colors.inkMute, marginTop: 30, fontSize: 16 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  category: { fontFamily: fonts.heading, fontSize: 16, fontWeight: 'bold', color: colors.ink },
  meta: { fontSize: 12, color: colors.inkMute, marginTop: 2 },
  note: { fontSize: 14, color: colors.inkSoft, marginTop: 4 },

  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  amount: { fontSize: 16, fontWeight: 'bold' },
  deleteButton: { paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { color: colors.chi, fontWeight: 'bold' },
});
