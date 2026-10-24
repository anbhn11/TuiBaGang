import * as SQLite from 'expo-sqlite';

let dbPromise = null;

// Danh mục và ví có sẵn khi tạo database lần đầu
const DEFAULT_CHI = ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Tiền nhà', 'Học tập', 'Giải trí'];
const DEFAULT_THU = ['Lương', 'Tiền thưởng', 'Khác'];
const DEFAULT_WALLETS = ['Tiền mặt', 'Tài khoản ngân hàng', 'Ví điện tử'];

async function seedDefaultData(db) {
  for (let i = 0; i < DEFAULT_CHI.length; i++) {
    await db.runAsync('INSERT INTO categories (name, type) VALUES (?, ?)', [DEFAULT_CHI[i], 'chi']);
  }

  for (let i = 0; i < DEFAULT_THU.length; i++) {
    await db.runAsync('INSERT INTO categories (name, type) VALUES (?, ?)', [DEFAULT_THU[i], 'thu']);
  }

  for (let i = 0; i < DEFAULT_WALLETS.length; i++) {
    await db.runAsync('INSERT INTO wallets (name, initial_balance) VALUES (?, 0)', [DEFAULT_WALLETS[i]]);
  }
}

// Mở database, tạo bảng nếu chưa có, chỉ thêm dữ liệu mẫu ở lần tạo đầu tiên
async function openAndCreate() {
  const db = await SQLite.openDatabaseAsync('tuibagang.db');

  const existed = await db.getFirstAsync(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'categories'"
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      initial_balance INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      wallet_id INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      amount INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL
    );`
  );

  if (existed === null) {
    await seedDefaultData(db);
  }

  return db;
}

// Chỉ mở database một lần, các lần sau dùng lại
export function getDb() {
  if (dbPromise === null) {
    dbPromise = openAndCreate().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

// ===== DANH MỤC =====

export async function getCategories() {
  const db = await getDb();

  return await db.getAllAsync('SELECT * FROM categories ORDER BY type, id');
}

export async function addCategory(name, type) {
  const db = await getDb();

  await db.runAsync('INSERT INTO categories (name, type) VALUES (?, ?)', [name, type]);
}

export async function countTransactionsByCategory(id) {
  const db = await getDb();

  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM transactions WHERE category_id = ?',
    [id]
  );

  return row.total;
}

export async function deleteCategory(id) {
  const db = await getDb();

  // Xóa luôn ngân sách của danh mục này
  await db.runAsync('DELETE FROM budgets WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// ===== VÍ =====

export async function getWallets() {
  const db = await getDb();

  return await db.getAllAsync('SELECT * FROM wallets ORDER BY id');
}

// Số dư của ví = số dư ban đầu + tổng thu - tổng chi
export async function getWalletsWithBalance() {
  const db = await getDb();

  const rows = await db.getAllAsync(
    `SELECT w.id, w.name, w.initial_balance,
            COALESCE(SUM(CASE WHEN t.type = 'thu' THEN t.amount END), 0) AS total_thu,
            COALESCE(SUM(CASE WHEN t.type = 'chi' THEN t.amount END), 0) AS total_chi
     FROM wallets w
     LEFT JOIN transactions t ON t.wallet_id = w.id
     GROUP BY w.id
     ORDER BY w.id`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    initial_balance: row.initial_balance,
    balance: row.initial_balance + row.total_thu - row.total_chi,
  }));
}

export async function addWallet(name, initialBalance) {
  const db = await getDb();

  await db.runAsync('INSERT INTO wallets (name, initial_balance) VALUES (?, ?)', [
    name,
    initialBalance,
  ]);
}

export async function countTransactionsByWallet(id) {
  const db = await getDb();

  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM transactions WHERE wallet_id = ?',
    [id]
  );

  return row.total;
}

export async function deleteWallet(id) {
  const db = await getDb();

  await db.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
}

// ===== GIAO DỊCH =====

// Lấy toàn bộ giao dịch kèm tên danh mục và tên ví, mới nhất lên đầu
export async function getAllTransactions() {
  const db = await getDb();

  return await db.getAllAsync(
    `SELECT t.id, t.type, t.amount, t.note, t.created_at,
            c.name AS category_name, w.name AS wallet_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN wallets w ON w.id = t.wallet_id
     ORDER BY t.id DESC`
  );
}

export async function addTransaction(type, amount, categoryId, walletId, note) {
  const db = await getDb();

  await db.runAsync(
    'INSERT INTO transactions (type, amount, category_id, wallet_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [type, amount, categoryId, walletId, note, new Date().toISOString()]
  );
}

export async function deleteTransaction(id) {
  const db = await getDb();

  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

// Tổng thu, tổng chi và tổng số dư ban đầu của các ví
export async function getSummary() {
  const db = await getDb();

  const rows = await db.getAllAsync(
    'SELECT type, SUM(amount) AS total FROM transactions GROUP BY type'
  );

  const wallet = await db.getFirstAsync(
    'SELECT COALESCE(SUM(initial_balance), 0) AS total FROM wallets'
  );

  let thu = 0;
  let chi = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].type === 'thu') thu = rows[i].total;
    if (rows[i].type === 'chi') chi = rows[i].total;
  }

  return { thu, chi, initial: wallet.total };
}

// ===== NGÂN SÁCH =====

// "2026-10" -> khoảng thời gian [đầu tháng, đầu tháng sau) theo giờ máy
function getMonthRange(monthKey) {
  const parts = monthKey.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  return {
    start: new Date(y, m - 1, 1).toISOString(),
    end: new Date(y, m, 1).toISOString(),
  };
}

// Câu con tính tổng chi của danh mục trong tháng
const SPENT_SQL = `(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
   WHERE t.category_id = b.category_id AND t.type = 'chi'
   AND t.created_at >= ? AND t.created_at < ?) AS spent`;

// Ngân sách của một tháng, kèm số tiền đã chi
export async function getBudgetsWithSpent(monthKey) {
  const db = await getDb();
  const range = getMonthRange(monthKey);

  return await db.getAllAsync(
    `SELECT b.id, b.category_id, b.amount, c.name AS category_name, ${SPENT_SQL}
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.month = ?
     ORDER BY b.id`,
    [range.start, range.end, monthKey]
  );
}

// Ngân sách + đã chi của một danh mục trong tháng, chưa đặt ngân sách thì trả về null
export async function getBudgetStatus(categoryId, monthKey) {
  const db = await getDb();
  const range = getMonthRange(monthKey);

  const row = await db.getFirstAsync(
    `SELECT b.amount, ${SPENT_SQL}
     FROM budgets b
     WHERE b.category_id = ? AND b.month = ?`,
    [range.start, range.end, categoryId, monthKey]
  );

  return row;
}

// Đặt ngân sách: đã có thì cập nhật số tiền, chưa có thì thêm mới
export async function saveBudget(categoryId, monthKey, amount) {
  const db = await getDb();

  const existed = await db.getFirstAsync(
    'SELECT id FROM budgets WHERE category_id = ? AND month = ?',
    [categoryId, monthKey]
  );

  if (existed === null) {
    await db.runAsync('INSERT INTO budgets (category_id, month, amount) VALUES (?, ?, ?)', [
      categoryId,
      monthKey,
      amount,
    ]);
  } else {
    await db.runAsync('UPDATE budgets SET amount = ? WHERE id = ?', [amount, existed.id]);
  }
}

export async function deleteBudget(id) {
  const db = await getDb();

  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}

// ===== TÀI KHOẢN =====

// Tìm tài khoản theo tên đăng nhập (không phân biệt hoa thường), không có thì trả về null
export async function findUser(username) {
  const db = await getDb();

  return await db.getFirstAsync('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [
    username,
  ]);
}

export async function registerUser(username, password) {
  const db = await getDb();

  await db.runAsync('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
}
