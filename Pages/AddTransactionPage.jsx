import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addTransaction,
  getBudgetStatus,
  getCategories,
  getTransactionById,
  getWallets,
  updateTransaction,
} from '../db';
import { formatDate, formatMonth, getMonthKey, getPercent, parseInputDate } from '../utils';
import { chooseFromLibrary, deleteImage, getImageUri, saveImage, takePhoto } from '../Image';

import { colors, fonts } from '../theme';

export default function AddTransactionPage({ navigation, route }) {
  // Có id truyền sang thì là chế độ sửa, không có thì là thêm mới
  const editingId = route.params?.id ?? null;
  const [original, setOriginal] = useState(null);

  const [type, setType] = useState('chi');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dateText, setDateText] = useState(formatDate(new Date().toISOString()));
  const [imageFile, setImageFile] = useState(null); // tên file ảnh hóa đơn đã lưu của giao dịch
  const [tempUri, setTempUri] = useState(null); // ảnh vừa chụp hoặc chọn, chưa lưu

  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [walletId, setWalletId] = useState(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Mở màn hình: đọc danh mục và ví từ SQLite, chọn sẵn mục đầu tiên (hoặc đổ giao dịch cũ vào form)
  useEffect(() => {
    if (editingId !== null) {
      navigation.setOptions({ title: 'Sửa giao dịch' });
    }

    const loadOptions = async () => {
      try {
        const categoryList = await getCategories();
        const walletList = await getWallets();

        setCategories(categoryList);
        setWallets(walletList);

        if (editingId !== null) {
          const tx = await getTransactionById(editingId);

          if (tx === null) {
            setErrorMessage('Không tìm thấy giao dịch này');
            return;
          }

          setOriginal(tx);
          setType(tx.type);
          setAmount(String(tx.amount));
          setNote(tx.note ?? '');
          setDateText(formatDate(tx.created_at));
          setCategoryId(tx.category_id);
          setWalletId(tx.wallet_id);
          setImageFile(tx.image_file ?? null);
          return;
        }

        const firstCategory = categoryList.find((c) => c.type === 'chi');
        if (firstCategory) setCategoryId(firstCategory.id);
        if (walletList.length > 0) setWalletId(walletList[0].id);
      } catch (error) {
        setErrorMessage('Không đọc được danh mục và ví: ' + error.message);
      }
    };

    loadOptions();
  }, []);

  // Đổi loại thu/chi thì chọn lại danh mục đầu tiên của loại đó
  const changeType = (newType) => {
    setType(newType);

    const first = categories.find((c) => c.type === newType);
    setCategoryId(first ? first.id : null);
  };

  // Chụp ảnh hóa đơn bằng camera
  const handleTakePhoto = async () => {
    try {
      setErrorMessage('');

      const uri = await takePhoto();
      if (uri !== null) setTempUri(uri);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Chọn ảnh hóa đơn từ thư viện
  const handlePickPhoto = async () => {
    try {
      setErrorMessage('');

      const uri = await chooseFromLibrary();
      if (uri !== null) setTempUri(uri);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleRemovePhoto = () => {
    setTempUri(null);
    setImageFile(null);
  };

  const handleSave = async () => {
    const text = amount.trim();

    if (!/^[0-9]+$/.test(text) || parseInt(text, 10) <= 0) {
      setErrorMessage('Số tiền phải là số nguyên lớn hơn 0');
      return;
    }

    // Ngày phát sinh: nhập dd/mm/yyyy, không được ở tương lai
    const picked = parseInputDate(dateText);

    if (picked === null) {
      setErrorMessage('Ngày không hợp lệ, hãy nhập dạng dd/mm/yyyy');
      return;
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (picked > endOfToday) {
      setErrorMessage('Không chọn ngày trong tương lai');
      return;
    }

    if (categoryId === null) {
      setErrorMessage('Chưa có danh mục, hãy thêm ở màn Danh mục');
      return;
    }

    if (walletId === null) {
      setErrorMessage('Chưa có ví, hãy thêm ở màn Ví');
      return;
    }

    if (saving) return;
    setSaving(true);

    let newSavedName = null;

    try {
      const money = parseInt(text, 10);

      // Sửa mà không đổi ngày thì giữ nguyên thời điểm cũ.
      // Chọn ngày hôm nay thì lưu giờ hiện tại, ngày khác thì lưu 12 giờ trưa của ngày đó.
      const now = new Date();
      let date;

      if (original !== null && dateText.trim() === formatDate(original.created_at)) {
        date = new Date(original.created_at);
      } else if (picked.toDateString() === now.toDateString()) {
        date = now;
      } else {
        date = picked;
      }

      const monthKey = getMonthKey(date);

      // Khoản chi: ghi lại % ngân sách của danh mục trong tháng trước khi lưu
      let beforePercent = 0;

      if (type === 'chi') {
        const statusBefore = await getBudgetStatus(categoryId, monthKey);

        if (statusBefore !== null) {
          beforePercent = getPercent(statusBefore.spent, statusBefore.amount);
        }
      }

      // Có ảnh mới thì chép vào thư mục của app, không thì giữ ảnh cũ (hoặc không có ảnh)
      let imageToSave = imageFile;

      if (tempUri !== null) {
        newSavedName = await saveImage(tempUri);
        imageToSave = newSavedName;
      }

      if (editingId !== null) {
        await updateTransaction(
          editingId,
          type,
          money,
          categoryId,
          walletId,
          note.trim(),
          date,
          imageToSave
        );
      } else {
        await addTransaction(type, money, categoryId, walletId, note.trim(), date, imageToSave);
      }

      // So với sau khi lưu để biết có vừa chạm mốc 80% hoặc 100% không
      let warning = '';

      if (type === 'chi') {
        const status = await getBudgetStatus(categoryId, monthKey);

        if (status !== null) {
          const after = getPercent(status.spent, status.amount);
          const name = categories.find((c) => c.id === categoryId).name;

          if (after >= 100 && beforePercent < 100) {
            warning =
              'Danh mục "' + name + '" đã vượt ngân sách tháng ' + formatMonth(monthKey) + ' (' + after + '%).';
          } else if (after >= 80 && beforePercent < 80) {
            warning =
              'Danh mục "' + name + '" đã dùng ' + after + '% ngân sách tháng ' + formatMonth(monthKey) + '.';
          }
        }
      }

      // Quay về màn trước (Home hoặc Chi tiết), màn đó tự tải lại khi được mở lại
      if (warning !== '') {
        Alert.alert('Cảnh báo ngân sách', warning, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      // Lưu giao dịch lỗi thì xóa file ảnh vừa chép để khỏi thừa
      deleteImage(newSavedName);
      setErrorMessage('Không lưu được: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const shownCategories = categories.filter((c) => c.type === type);

  // Ảnh đang hiển thị: ảnh mới chụp hoặc chọn, không có thì ảnh đã lưu của giao dịch
  let previewUri = null;
  if (tempUri !== null) previewUri = tempUri;
  else if (imageFile) previewUri = getImageUri(imageFile);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Loại giao dịch</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.typeButton, type === 'chi' && styles.typeChiActive]}
          onPress={() => changeType('chi')}
        >
          <Text style={[styles.typeText, type === 'chi' && styles.typeTextActive]}>
            Chi tiêu
          </Text>
        </Pressable>

        <Pressable
          style={[styles.typeButton, type === 'thu' && styles.typeThuActive]}
          onPress={() => changeType('thu')}
        >
          <Text style={[styles.typeText, type === 'thu' && styles.typeTextActive]}>
            Thu nhập
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Số tiền (đồng)</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Ví dụ: 50000"
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Ngày phát sinh (dd/mm/yyyy)</Text>
      <TextInput
        value={dateText}
        onChangeText={setDateText}
        placeholder="Ví dụ: 24/10/2026"
        keyboardType="numbers-and-punctuation"
        style={styles.input}
      />

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.chips}>
        {shownCategories.map((item) => (
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

        {shownCategories.length === 0 && (
          <Text style={styles.hint}>Chưa có danh mục nào cho loại này</Text>
        )}
      </View>

      <Text style={styles.label}>Ví / Tài khoản</Text>
      <View style={styles.chips}>
        {wallets.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.chip, walletId === item.id && styles.chipActive]}
            onPress={() => setWalletId(item.id)}
          >
            <Text style={[styles.chipText, walletId === item.id && styles.chipTextActive]}>
              {item.name}
            </Text>
          </Pressable>
        ))}

        {wallets.length === 0 && <Text style={styles.hint}>Chưa có ví nào</Text>}
      </View>

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Không bắt buộc"
        style={styles.input}
      />

      <Text style={styles.label}>Ảnh hóa đơn</Text>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} />
      ) : (
        <View style={styles.previewEmpty}>
          <Text style={styles.hint}>Chưa có ảnh</Text>
        </View>
      )}

      <View style={styles.photoRow}>
        <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
          <Text style={styles.photoText}>Chụp ảnh</Text>
        </Pressable>

        <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
          <Text style={styles.photoText}>Chọn từ thư viện</Text>
        </Pressable>

        {previewUri !== null && (
          <Pressable style={[styles.photoButton, styles.photoRemove]} onPress={handleRemovePhoto}>
            <Text style={[styles.photoText, styles.photoRemoveText]}>Xóa ảnh</Text>
          </Pressable>
        )}
      </View>

      {errorMessage !== '' && <Text style={styles.error}>{errorMessage}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'ĐANG LƯU...' : editingId !== null ? 'LƯU THAY ĐỔI' : 'LƯU GIAO DỊCH'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  content: { padding: 20 },

  label: { fontFamily: fonts.heading, fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: colors.ink },

  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeChiActive: { backgroundColor: colors.chi, borderColor: colors.chi },
  typeThuActive: { backgroundColor: colors.thu, borderColor: colors.thu },
  typeText: { fontSize: 15, color: colors.ink },
  typeTextActive: { color: colors.cream, fontWeight: 'bold' },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
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
  hint: { color: colors.inkMute },

  preview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  previewEmpty: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  photoButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoText: { color: colors.primary, fontWeight: 'bold' },
  photoRemove: { borderColor: colors.chi },
  photoRemoveText: { color: colors.chi },

  error: { color: colors.chi, fontSize: 15, marginBottom: 12 },

  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveText: { color: colors.cream, fontSize: 16, fontWeight: 'bold' },
});