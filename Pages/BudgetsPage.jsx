import { useEffect, useState } from 'react';
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
import { deleteBudget, getBudgetsWithSpent, getCategories, saveBudget } from '../db';
import { formatMoney, formatMonth, getMonthKey, getPercent, shiftMonth } from '../utils';

import { colors, fonts } from '../theme';

export default function BudgetsPage() {
  const [month, setMonth] = useState(getMonthKey(new Date()));
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadBudgets = async () => {
    try {
      setBudgets(await getBudgetsWithSpent(month));
    } catch (error) {
      setErrorMessage('Không đọc được ngân sách: ' + error.message);
    }
  };

  // Mở màn hình: đọc danh mục chi tiêu, chọn sẵn mục đầu tiên
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const list = await getCategories();
        const chiList = list.filter((c) => c.type === 'chi');

        setCategories(chiList);
        if (chiList.length > 0) setCategoryId(chiList[0].id);
      } catch (error) {
        setErrorMessage('Không đọc được danh mục: ' + error.message);
      }
    };

    loadCategories();
  }, []);

  // Đổi tháng thì tải lại ngân sách của tháng đó
  useEffect(() => {
    loadBudgets();
  }, [month]);

  const handleSave = async () => {
    const text = amount.trim();

    if (categoryId === null) {
      setErrorMessage('Chưa có danh mục chi tiêu, hãy thêm ở màn Danh mục');
      return;
    }

    if (!/^[0-9]+$/.test(text) || parseInt(text, 10) <= 0) {
      setErrorMessage('Ngân sách phải là số nguyên lớn hơn 0');
      return;
    }

    try {
      setErrorMessage('');
      await saveBudget(categoryId, month, parseInt(text, 10));
      setAmount('');
      await loadBudgets();
    } catch (error) {
      setErrorMessage('Không lưu được: ' + error.message);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert('Xác nhận xóa', 'Xóa ngân sách "' + item.category_name + '"?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(item.id);
            await loadBudgets();
          } catch (error) {
            Alert.alert('Lỗi', 'Không xóa được: ' + error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const percent = getPercent(item.spent, item.amount);
    const barColor = percent >= 100 ? colors.chi : percent >= 80 ? colors.warn : colors.thu;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.name}>{item.category_name ?? 'Không rõ'}</Text>

          <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
            <Text style={styles.deleteText}>Xóa</Text>
          </Pressable>
        </View>

        <Text style={styles.sub}>
          Đã chi {formatMoney(item.spent)}đ / {formatMoney(item.amount)}đ
        </Text>

        <View style={styles.barBack}>
          <View
            style={[
              styles.barFill,
              { width: Math.min(percent, 100) + '%', backgroundColor: barColor },
            ]}
          />
        </View>

        <Text style={[styles.percent, { color: barColor }]}>
          {percent}%{percent >= 100 ? ' - Đã vượt ngân sách' : ''}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.monthRow}>
          <Pressable style={styles.monthButton} onPress={() => setMonth(shiftMonth(month, -1))}>
            <Text style={styles.monthButtonText}>{'<'}</Text>
          </Pressable>

          <Text style={styles.monthText}>Tháng {formatMonth(month)}</Text>

          <Pressable style={styles.monthButton} onPress={() => setMonth(shiftMonth(month, 1))}>
            <Text style={styles.monthButtonText}>{'>'}</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {categories.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.chip, categoryId === item.id && styles.chipActive]}
                onPress={() => setCategoryId(item.id)}
              >
                <Text
                  style={[styles.chipText, categoryId === item.id && styles.chipTextActive]}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.row}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Ngân sách (đồng)"
            keyboardType="numeric"
            style={styles.input}
          />

          <Pressable style={styles.addButton} onPress={handleSave}>
            <Text style={styles.addText}>Lưu</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>Đặt lại cho danh mục đã có ngân sách sẽ cập nhật số tiền.</Text>

        {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}
      </View>

      <FlatList
        data={budgets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Tháng này chưa đặt ngân sách nào</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  form: { backgroundColor: colors.card, padding: 12 },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  monthText: { fontFamily: fonts.heading, fontSize: 17, fontWeight: 'bold', color: colors.ink },

  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink },
  chipTextActive: { color: colors.cream, fontWeight: 'bold' },

  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addText: { color: colors.cream, fontWeight: 'bold' },
  hint: { color: colors.inkMute, fontSize: 12, marginTop: 8 },

  error: { color: colors.chi, fontSize: 14, marginTop: 8 },

  list: { padding: 12 },
  empty: { textAlign: 'center', color: colors.inkMute, marginTop: 30, fontSize: 16 },

  card: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: fonts.heading, fontSize: 16, fontWeight: 'bold', color: colors.ink },
  sub: { fontSize: 13, color: colors.inkSoft, marginTop: 4, marginBottom: 8 },
  barBack: { height: 10, borderRadius: 5, backgroundColor: colors.track, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  percent: { marginTop: 6, fontSize: 13, fontWeight: 'bold' },
  deleteButton: { paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { color: colors.chi, fontWeight: 'bold' },
});
