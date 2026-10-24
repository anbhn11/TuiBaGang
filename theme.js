import { Platform } from 'react-native';

// Bảng màu lấy từ logo: đỏ mận nền, vàng đồng hoa văn, kem chữ
export const colors = {
  primary: '#4A1219', // đỏ mận (nền logo, thanh tiêu đề, nút chính)
  gold: '#C8A048', // vàng đồng trống đồng
  goldSoft: '#E8D3A0',
  cream: '#F0E0C0', // chữ trên nền đỏ mận

  bg: '#F6ECD9', // nền giấy dó
  card: '#FFFAF0',
  border: '#B8975A',
  track: '#E6D8BC',

  ink: '#2E1216',
  inkSoft: '#5E4443',
  inkMute: '#8A7568',

  thu: '#2F6B4A', // thu nhập: xanh ngọc
  chi: '#B23A2E', // chi tiêu: đỏ gạch
  warn: '#B8741A',
  warnBg: '#FBEBCB',
};

// Chữ có chân cho tiêu đề, gợi cảm giác cổ truyền
export const fonts = {
  heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
};
