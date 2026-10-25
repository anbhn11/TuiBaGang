import { useCallback, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteTransaction, getTransactionById } from '../db';
import { formatDate, formatMoney } from '../utils';
import { getImageUri } from '../Image';

import { colors, fonts } from '../theme';

export default function TransactionDetailPage({ navigation, route }) {
  // Nhận id từ Home truyền sang
  const { id } = route.params;

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showImage, setShowImage] = useState(false);

  const loadTransaction = async () => {
    try {
      setErrorMessage('');
      setTransaction(await getTransactionById(id));
    } catch (error) {
      setErrorMessage('Không đọc được giao dịch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tải lại mỗi khi màn hình được mở hoặc quay về từ màn Sửa
  useFocusEffect(
    useCallback(() => {
      loadTransaction();
    }, [id])
  );

  const confirmDelete = () => {
    Alert.alert('Xác nhận xóa', 'Xóa giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Lỗi', 'Không xóa được: ' + error.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Đang tải...</Text>
      </View>
    );
  }

  if (errorMessage !== '') {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }

  if (transaction === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Không tìm thấy giao dịch này</Text>
      </View>
    );
  }

  const isThu = transaction.type === 'thu';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={[styles.badge, isThu ? styles.badgeThu : styles.badgeChi]}>
          <Text style={styles.badgeText}>{isThu ? 'Thu nhập' : 'Chi tiêu'}</Text>
        </View>

        <Text style={[styles.amount, isThu ? styles.thu : styles.chi]}>
          {isThu ? '+' : '-'}
          {formatMoney(transaction.amount)}đ
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Danh mục</Text>
          <Text style={styles.value}>{transaction.category_name ?? 'Không rõ'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Ví / Tài khoản</Text>
          <Text style={styles.value}>{transaction.wallet_name ?? 'Không rõ'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Ngày</Text>
          <Text style={styles.value}>{formatDate(transaction.created_at)}</Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.label}>Ghi chú</Text>
          <Text style={styles.note}>
            {transaction.note ? transaction.note : 'Không có ghi chú'}
          </Text>
        </View>

        {transaction.image_file ? (
          <View style={styles.receiptBox}>
            <Text style={styles.label}>Ảnh hóa đơn</Text>

            <Pressable onPress={() => setShowImage(true)}>
              <Image source={{ uri: getImageUri(transaction.image_file) }} style={styles.receipt} />
            </Pressable>

            <Text style={styles.receiptHint}>Bấm vào ảnh để xem lớn</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.editButton}
        onPress={() => navigation.navigate('AddTransaction', { id: transaction.id })}
      >
        <Text style={styles.editText}>SỬA GIAO DỊCH</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteText}>XÓA GIAO DỊCH</Text>
      </Pressable>

      <Modal
        visible={showImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImage(false)}
      >
        <Pressable style={styles.viewer} onPress={() => setShowImage(false)}>
          {transaction.image_file ? (
            <Image
              source={{ uri: getImageUri(transaction.image_file) }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  message: { color: colors.inkMute, fontSize: 16 },
  error: { color: colors.chi, fontSize: 15, textAlign: 'center', padding: 20 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },

  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  badgeChi: { backgroundColor: colors.chi },
  badgeThu: { backgroundColor: colors.thu },
  badgeText: { color: colors.cream, fontSize: 13, fontWeight: 'bold' },

  amount: {
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 16,
  },
  thu: { color: colors.thu },
  chi: { color: colors.chi },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.track,
  },
  label: { fontFamily: fonts.heading, fontSize: 15, fontWeight: 'bold', color: colors.ink },
  value: { fontSize: 15, color: colors.inkSoft, flexShrink: 1, textAlign: 'right' },

  noteBox: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.track },

  receiptBox: { paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.track },
  receipt: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: colors.track,
  },
  receiptHint: { fontSize: 12, color: colors.inkMute, marginTop: 4 },

  viewer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: { width: '100%', height: '90%' },
  note: { fontSize: 15, color: colors.inkSoft, marginTop: 6 },

  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  editText: { color: colors.cream, fontSize: 16, fontWeight: 'bold' },

  deleteButton: {
    borderWidth: 1,
    borderColor: colors.chi,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteText: { color: colors.chi, fontSize: 16, fontWeight: 'bold' },
});