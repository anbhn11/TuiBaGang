// 1500000 -> 1.500.000
export function formatMoney(number) {
  return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Chuỗi ISO -> dd/mm/yyyy
export function formatDate(isoString) {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');

  return day + '/' + month + '/' + d.getFullYear();
}

// Date -> "2026-10"
export function getMonthKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

// Cộng hoặc trừ tháng: shiftMonth("2026-10", -1) -> "2026-09"
export function shiftMonth(monthKey, step) {
  const parts = monthKey.split('-');
  return getMonthKey(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1 + step, 1));
}

// "2026-10" -> "10/2026"
export function formatMonth(monthKey) {
  const parts = monthKey.split('-');
  return parts[1] + '/' + parts[0];
}

// Phần trăm đã chi so với ngân sách
export function getPercent(spent, amount) {
  return Math.round((spent * 100) / amount);
}

// "dd/mm/yyyy" -> Date lúc 12 giờ trưa, nhập sai hoặc ngày không có thật thì trả về null
export function parseInputDate(text) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());

  if (match === null) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  // Ví dụ 31/02 thì Date tự nhảy sang tháng sau, coi là không hợp lệ
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

// Khóa AsyncStorage lưu tên người dùng đang đăng nhập
export const USER_KEY = 'loggedInUser';

// "Cà phê" -> "ca phe": bỏ dấu và chữ hoa để tìm kiếm không cần gõ đúng dấu
export function removeAccents(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
