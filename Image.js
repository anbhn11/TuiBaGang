import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

// Thư mục chứa ảnh hóa đơn, nằm trong bộ nhớ riêng của app nên hệ thống không tự xóa
const RECEIPT_DIR = 'receipts';

// Mở camera chụp ảnh. Trả về đường dẫn ảnh tạm, bấm hủy thì trả về null
export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Bạn chưa cấp quyền camera');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });

  // Bấm hủy thì không có assets, phải kiểm tra trước khi đọc
  if (result.canceled) return null;

  return result.assets[0].uri;
}


// Mở thư viện ảnh để chọn một ảnh
export async function chooseFromLibrary() {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Lỗi chọn ảnh:', error);
    throw error;
  }
}


// Chép ảnh tạm vào thư mục của app, trả về tên file để lưu vào SQLite
export async function saveImage(tempUri) {
  const dir = new Directory(Paths.document, RECEIPT_DIR);
  dir.create({ idempotent: true, intermediates: true });

  // Giữ đuôi file gốc (.jpg, .png...), không có thì dùng .jpg
  const match = /\.([a-zA-Z0-9]+)$/.exec(tempUri.split('?')[0]);
  const extension = match ? '.' + match[1] : '.jpg';
  const fileName = 'receipt_' + Date.now() + extension;

  await new File(tempUri).copy(new File(dir, fileName));

  return fileName;
}

// Từ tên file đã lưu trong SQLite, tạo lại đường dẫn đầy đủ để hiển thị
export function getImageUri(fileName) {
  return new File(Paths.document, RECEIPT_DIR, fileName).uri;
}

// Xóa file ảnh, không có hoặc lỗi thì bỏ qua
export function deleteImage(fileName) {
  if (!fileName) return;

  try {
    const file = new File(Paths.document, RECEIPT_DIR, fileName);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    // Không xóa được file thì thôi, không ảnh hưởng dữ liệu
  }
}