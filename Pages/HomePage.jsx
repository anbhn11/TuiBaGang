import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  deleteTransaction,
  getAllTransactions,
  getBudgetsWithSpent,
  getCategories,
  getSummary,
  getWallets,
} from '../db';
import {
  USER_KEY,
  formatDate,
  formatMoney,
  getMonthKey,
  getPercent,
  parseInputDate,
  removeAccents,
} from '../utils';

import { colors, fonts } from '../theme';
import PatternBorder from '../components/PatternBorder';

export default function HomePage({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ thu: 0, chi: 0, initial: 0 });
  const [warnings, setWarnings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Tìm kiếm và bộ lọc danh sách giao dịch
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'chi' hoặc 'thu'
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [walletFilter, setWalletFilter] = useState(null);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');

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
      const categoryList = await getCategories();
      const walletList = await getWallets();

      setTransactions(list);
      setSummary(total);
      setCategories(categoryList);
      setWallets(walletList);
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
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
      >
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
      </Pressable>
    );
  };

  const balance = summary.initial + summary.thu - summary.chi;

  // ===== Tìm kiếm và bộ lọc =====

  // Đổi hình thức: nếu danh mục đang chọn không thuộc hình thức mới thì bỏ chọn danh mục
  const changeTypeFilter = (value) => {
    setTypeFilter(value);

    const chosen = categories.find((c) => c.id === categoryFilter);
    if (chosen && value !== 'all' && chosen.type !== value) {
      setCategoryFilter(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter(null);
    setWalletFilter(null);
    setFromText('');
    setToText('');
  };

  // Ô ngày để trống là không lọc, nhập sai thì báo lỗi và bỏ qua ô đó
  const fromDate = fromText.trim() === '' ? null : parseInputDate(fromText);
  const toDate = toText.trim() === '' ? null : parseInputDate(toText);
  const fromInvalid = fromText.trim() !== '' && fromDate === null;
  const toInvalid = toText.trim() !== '' && toDate === null;

  let rangeStart = null;
  let rangeEnd = null;

  if (fromDate !== null) {
    rangeStart = new Date(fromDate);
    rangeStart.setHours(0, 0, 0, 0);
  }

  if (toDate !== null) {
    rangeEnd = new Date(toDate);
    rangeEnd.setHours(23, 59, 59, 999);
  }

  // Danh mục đã bị xóa ở màn khác thì coi như không lọc
  const activeCategory = categories.some((c) => c.id === categoryFilter) ? categoryFilter : null;
  // Ví đã bị xóa ở màn khác thì coi như không lọc
  const activeWallet = wallets.some((w) => w.id === walletFilter) ? walletFilter : null;
  const keyword = removeAccents(search.trim());

  const filtered = transactions.filter((t) => {
    if (keyword !== '' && !removeAccents(t.note ?? '').includes(keyword)) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (activeCategory !== null && t.category_id !== activeCategory) return false;
    if (activeWallet !== null && t.wallet_id !== activeWallet) return false;

    const when = new Date(t.created_at);
    if (rangeStart !== null && when < rangeStart) return false;
    if (rangeEnd !== null && when > rangeEnd) return false;

    return true;
  });

  let filterCount = 0;
  if (typeFilter !== 'all') filterCount++;
  if (activeCategory !== null) filterCount++;
  if (activeWallet !== null) filterCount++;
  if (rangeStart !== null) filterCount++;
  if (rangeEnd !== null) filterCount++;

  const isFiltering = keyword !== '' || filterCount > 0;
  const shownCategories = categories.filter((c) => typeFilter === 'all' || c.type === typeFilter);

  let filteredThu = 0;
  let filteredChi = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i].type === 'thu') filteredThu += filtered[i].amount;
    else filteredChi += filtered[i].amount;
  }

  const typeOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'chi', label: 'Chi tiêu' },
    { value: 'thu', label: 'Thu nhập' },
  ];

  // Phần đầu danh sách: tổng quan, nút chức năng, cảnh báo, ô tìm kiếm và bộ lọc
  const header = (
    <View>
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
            <Text style={[styles.summaryValue, styles.thu]}>{formatMoney(summary.thu)}đ</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={[styles.summaryValue, styles.chi]}>{formatMoney(summary.chi)}đ</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, styles.actionMain]}
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Text style={styles.actionMainText}>+ GIAO DỊCH</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.actionText}>Thống kê</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.actionText}>Danh mục</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Wallets')}>
            <Text style={styles.actionText}>Ví</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Budgets')}>
            <Text style={styles.actionText}>Ngân sách</Text>
          </Pressable>
        </View>
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

      <PatternBorder style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Lịch sử giao dịch ({transactions.length})</Text>

      <View style={styles.searchBox}>
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo ghi chú..."
            placeholderTextColor={colors.inkMute}
            style={styles.searchInput}
          />

          <Pressable
            style={[styles.filterButton, (showFilter || filterCount > 0) && styles.filterButtonActive]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                (showFilter || filterCount > 0) && styles.filterButtonTextActive,
              ]}
            >
              Bộ lọc{filterCount > 0 ? ' (' + filterCount + ')' : ''}
            </Text>
          </Pressable>
        </View>

        {showFilter && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>Hình thức</Text>
            <View style={styles.chipRow}>
              {typeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.chip, typeFilter === option.value && styles.chipActive]}
                  onPress={() => changeTypeFilter(option.value)}
                >
                  <Text style={[styles.chipText, typeFilter === option.value && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.chipRow}>
                <Pressable
                  style={[styles.chip, activeCategory === null && styles.chipActive]}
                  onPress={() => setCategoryFilter(null)}
                >
                  <Text style={[styles.chipText, activeCategory === null && styles.chipTextActive]}>
                    Tất cả
                  </Text>
                </Pressable>

                {shownCategories.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, activeCategory === item.id && styles.chipActive]}
                    onPress={() => setCategoryFilter(item.id)}
                  >
                    <Text style={[styles.chipText, activeCategory === item.id && styles.chipTextActive]}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.filterLabel}>Ví / Tài khoản</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.chipRow}>
                <Pressable
                  style={[styles.chip, activeWallet === null && styles.chipActive]}
                  onPress={() => setWalletFilter(null)}
                >
                  <Text style={[styles.chipText, activeWallet === null && styles.chipTextActive]}>
                    Tất cả
                  </Text>
                </Pressable>

                {wallets.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, activeWallet === item.id && styles.chipActive]}
                    onPress={() => setWalletFilter(item.id)}
                  >
                    <Text style={[styles.chipText, activeWallet === item.id && styles.chipTextActive]}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.filterLabel}>Ngày (dd/mm/yyyy)</Text>
            <View style={styles.dateRow}>
              <TextInput
                value={fromText}
                onChangeText={setFromText}
                placeholder="Từ ngày"
                placeholderTextColor={colors.inkMute}
                keyboardType="numbers-and-punctuation"
                style={[styles.dateInput, fromInvalid && styles.dateInvalid]}
              />

              <Text style={styles.dateDash}>-</Text>

              <TextInput
                value={toText}
                onChangeText={setToText}
                placeholder="Đến ngày"
                placeholderTextColor={colors.inkMute}
                keyboardType="numbers-and-punctuation"
                style={[styles.dateInput, toInvalid && styles.dateInvalid]}
              />
            </View>

            {(fromInvalid || toInvalid) && (
              <Text style={styles.filterError}>Ngày không hợp lệ, hãy nhập dạng dd/mm/yyyy</Text>
            )}

            {rangeStart !== null && rangeEnd !== null && rangeStart > rangeEnd && (
              <Text style={styles.filterError}>Ngày bắt đầu phải trước ngày kết thúc</Text>
            )}
          </View>
        )}

        {isFiltering && (
          <View style={styles.resultRow}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultText}>
                Tìm thấy {filtered.length}/{transactions.length} giao dịch
              </Text>
              <Text style={styles.resultText}>
                Thu {formatMoney(filteredThu)}đ · Chi {formatMoney(filteredChi)}đ
              </Text>
            </View>

            <Pressable onPress={clearFilters}>
              <Text style={styles.clearText}>Xóa lọc</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isFiltering ? 'Không có giao dịch phù hợp' : 'Chưa có giao dịch nào'}
          </Text>
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

  actions: { gap: 8, marginHorizontal: 12 },
  actionsRow: { flexDirection: 'row', gap: 8 },
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

  list: { paddingBottom: 12 },
  empty: { textAlign: 'center', color: colors.inkMute, marginTop: 30, fontSize: 16 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 12,
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

  sectionDivider: { marginHorizontal: 12, marginTop: 16 },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginHorizontal: 12,
    marginTop: 6,
  },

  searchBox: { marginHorizontal: 12, marginTop: 10, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  filterButton: {
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: colors.primary },
  filterButtonText: { color: colors.primary, fontWeight: 'bold' },
  filterButtonTextActive: { color: colors.cream },

  filterPanel: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
  },
  filterLabel: {
    fontFamily: fonts.heading,
    fontWeight: 'bold',
    color: colors.ink,
    marginTop: 6,
    marginBottom: 6,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink },
  chipTextActive: { color: colors.cream, fontWeight: 'bold' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    color: colors.ink,
  },
  dateInvalid: { borderColor: colors.chi },
  dateDash: { color: colors.inkMute },
  filterError: { color: colors.chi, fontSize: 13, marginTop: 6 },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  resultInfo: { flex: 1 },
  resultText: { color: colors.inkSoft, fontSize: 13 },
  clearText: { color: colors.chi, fontWeight: 'bold', paddingHorizontal: 8 },
});