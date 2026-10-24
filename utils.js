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

// Khóa AsyncStorage lưu tên người dùng đang đăng nhập
export const USER_KEY = 'loggedInUser';
