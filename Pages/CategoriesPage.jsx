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
  addCategory,
  countTransactionsByCategory,
  deleteCategory,
  getCategories,
} from '../db';

import { colors, fonts } from '../theme';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('chi');
  const [errorMessage, setErrorMessage] = useState('');

  const loadCategories = async () => {
    try {
      setCategories(await getCategories());
    } catch (error) {
      setErrorMessage('Không đọc được danh mục: ' + error.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    const ten = name.trim();

    if (ten === '') {
      setErrorMessage('Vui lòng nhập tên danh mục');
      return;
    }

    const existed = categories.some(
      (c) => c.type === type && c.name.toLowerCase() === ten.toLowerCase()
    );

    if (existed) {
      setErrorMessage('Danh mục này đã có');
      return;
    }

    try {
      setErrorMessage('');
      await addCategory(ten, type);
      setName('');
      await loadCategories();
    } catch (error) {
      setErrorMessage('Không thêm được: ' + error.message);
    }
  };

  const confirmDelete = async (item) => {
    try {
      // Danh mục đang có giao dịch thì không cho xóa
      const total = await countTransactionsByCategory(item.id);

      if (total > 0) {
        Alert.alert(
          'Không xóa được',
          'Danh mục "' + item.name + '" đang có ' + total + ' giao dịch.'
        );
        return;
      }

      Alert.alert('Xác nhận xóa', 'Xóa danh mục "' + item.name + '"?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(item.id);
              await loadCategories();
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

  const renderItem = ({ item }) => {
    const isThu = item.type === 'thu';

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>

        <View style={[styles.badge, isThu ? styles.badgeThu : styles.badgeChi]}>
          <Text style={styles.badgeText}>{isThu ? 'Thu' : 'Chi'}</Text>
        </View>

        <Pressable style={styles.deleteButton} onPress={() => confirmDelete(item)}>
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.row}>
          <Pressable
            style={[styles.typeButton, type === 'chi' && styles.typeChiActive]}
            onPress={() => setType('chi')}
          >
            <Text style={[styles.typeText, type === 'chi' && styles.typeTextActive]}>
              Chi tiêu
            </Text>
          </Pressable>

          <Pressable
            style={[styles.typeButton, type === 'thu' && styles.typeThuActive]}
            onPress={() => setType('thu')}
          >
            <Text style={[styles.typeText, type === 'thu' && styles.typeTextActive]}>
              Thu nhập
            </Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên danh mục mới"
            style={styles.input}
          />

          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addText}>Thêm</Text>
          </Pressable>
        </View>

        {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}
      </View>

      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có danh mục nào</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  form: { backgroundColor: colors.card, padding: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },

  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeChiActive: { backgroundColor: colors.chi, borderColor: colors.chi },
  typeThuActive: { backgroundColor: colors.thu, borderColor: colors.thu },
  typeText: { color: colors.ink },
  typeTextActive: { color: colors.cream, fontWeight: 'bold' },

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

  error: { color: colors.chi, fontSize: 14 },

  list: { padding: 12 },
  empty: { textAlign: 'center', color: colors.inkMute, marginTop: 30, fontSize: 16 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  name: { fontFamily: fonts.heading, flex: 1, fontSize: 16, color: colors.ink },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10, marginRight: 8 },
  badgeChi: { backgroundColor: colors.chi },
  badgeThu: { backgroundColor: colors.thu },
  badgeText: { color: colors.cream, fontSize: 12, fontWeight: 'bold' },
  deleteButton: { paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { color: colors.chi, fontWeight: 'bold' },
});
