import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addWallet,
  countTransactionsByWallet,
  deleteWallet,
  getWalletsWithBalance,
} from '../db';
import { formatMoney } from '../utils';

import { colors, fonts } from '../theme';

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadWallets = async () => {
    try {
      setWallets(await getWalletsWithBalance());
    } catch (error) {
      setErrorMessage('Không đọc được danh sách ví: ' + error.message);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleAdd = async () => {
    const ten = name.trim();
    const soDu = initialBalance.trim();

    if (ten === '') {
      setErrorMessage('Vui lòng nhập tên ví');
      return;
    }

    // Để trống thì tính là 0
    if (soDu !== '' && !/^[0-9]+$/.test(soDu)) {
      setErrorMessage('Số dư ban đầu phải là số nguyên không âm');
      return;
    }

    const existed = wallets.some((w) => w.name.toLowerCase() === ten.toLowerCase());

    if (existed) {
      setErrorMessage('Ví này đã có');
      return;
    }

    try {
      setErrorMessage('');
      await addWallet(ten, soDu === '' ? 0 : parseInt(soDu, 10));
      setName('');
      setInitialBalance('');
      await loadWallets();
    } catch (error) {
      setErrorMessage('Không thêm được: ' + error.message);
    }
  };

  const confirmDelete = async (item) => {
    try {
      // Ví đang có giao dịch thì không cho xóa
      const total = await countTransactionsByWallet(item.id);

      if (total > 0) {
        Alert.alert(
          'Không xóa được',
          'Ví "' + item.name + '" đang có ' + total + ' giao dịch.'
        );
        return;
      }

      Alert.alert('Xác nhận xóa', 'Xóa ví "' + item.name + '"?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWallet(item.id);
              await loadWallets();
            } catch (error) {
              Alert.alert('Lỗi', 'Không xóa được: ' + error.message);
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>
          Số dư ban đầu: {formatMoney(item.initial_balance)}đ
        </Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.balance, item.balance < 0 && styles.negative]}>
          {formatMoney(item.balance)}đ
        </Text>

        <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tên ví mới (ví dụ: Ví MoMo)"
          style={styles.input}
        />

        <View style={styles.row}>
          <TextInput
            value={initialBalance}
            onChangeText={setInitialBalance}
            placeholder="Số dư ban đầu (đồng)"
            keyboardType="numeric"
            style={[styles.input, styles.inputFlex]}
          />

          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addText}>Thêm</Text>
          </Pressable>
        </View>

        {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}
      </View>

      <FlatList
        data={wallets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có ví nào</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  form: { backgroundColor: colors.card, padding: 12, gap: 10 },
  row: { flexDirection: 'row', gap: 8 },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputFlex: { flex: 1 },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addText: { color: colors.cream, fontWeight: 'bold' },

  error: { color: colors.chi, fontSize: 14 },

  list: { padding: 12 },
  empty: { textAlign: 'center', color: colors.inkMute, marginTop: 30, fontSize: 16 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  cardInfo: { flex: 1 },
  name: { fontFamily: fonts.heading, fontSize: 16, fontWeight: 'bold', color: colors.ink },
  sub: { fontSize: 12, color: colors.inkMute, marginTop: 4 },

  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  balance: { fontFamily: fonts.heading, fontSize: 16, fontWeight: 'bold', color: colors.thu },
  negative: { color: colors.chi },
  deleteButton: { paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { color: colors.chi, fontWeight: 'bold' },
});
