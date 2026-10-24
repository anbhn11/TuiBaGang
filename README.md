# Túi Ba Gang

Ứng dụng di động quản lý chi tiêu cá nhân, viết bằng React Native (Expo). Dữ liệu được lưu ngay trong máy bằng SQLite, dùng được khi không có mạng.

Đây là sản phẩm của môn Lập trình di động (React Native), Trường Đại học Công nghệ Đồng Nai.

## Chức năng

- **Đăng ký, đăng nhập:** tài khoản lưu trong máy, app nhớ trạng thái đăng nhập.
- **Ghi khoản thu/chi:** nhập số tiền, ngày phát sinh, danh mục, ví và ghi chú. Xóa được giao dịch.
- **Phân loại:** có sẵn các danh mục thu và chi phổ biến, thêm hoặc xóa danh mục riêng.
- **Quản lý ví:** tách tiền mặt, tài khoản ngân hàng, ví điện tử, tự tính số dư từng ví.
- **Ngân sách theo tháng:** đặt hạn mức cho từng danh mục, cảnh báo khi chi đạt 80% và 100%.
- **Thống kê theo tháng:** tổng thu, tổng chi, chênh lệch, chi tiêu và thu nhập theo từng danh mục, biểu đồ cột so sánh 6 tháng gần nhất.

## Công nghệ

- React Native với Expo
- React Navigation (native stack)
- expo-sqlite: lưu giao dịch, danh mục, ví, ngân sách, tài khoản
- @react-native-async-storage/async-storage: nhớ người dùng đang đăng nhập

## Cách chạy

Cần cài sẵn [Node.js](https://nodejs.org) (bản LTS) và app **Expo Go** trên điện thoại, hoặc máy ảo Android.

```bash
git clone https://github.com/<ten-tai-khoan>/<ten-repo>.git
cd <ten-repo>
npm install
npx expo start
```

Sau đó quét mã QR bằng Expo Go, hoặc bấm `a` trong terminal để mở trên máy ảo Android.

## Cấu trúc thư mục

```
App.js              Khai báo các màn hình và điều hướng
db.js               Tạo bảng SQLite và các hàm đọc, ghi dữ liệu
utils.js            Hàm định dạng tiền, ngày, tháng
theme.js            Bảng màu và font chữ
Pages/              Các màn hình (đăng nhập, đăng ký, trang chủ, thêm giao dịch,
                    danh mục, ví, ngân sách, thống kê)
components/         Thành phần giao diện dùng chung
assets/             Logo và biểu tượng
```

## Hạn chế hiện tại

- Dữ liệu chỉ nằm trong máy, chưa đồng bộ lên đám mây.
- Tài khoản chỉ để vào app. Các tài khoản trên cùng một máy dùng chung dữ liệu.
- Mật khẩu đang lưu dạng văn bản thường trong cơ sở dữ liệu cục bộ, chỉ phù hợp cho mục đích học tập.
- Chưa có thông báo đẩy, xuất báo cáo PDF/Excel, đăng nhập Google.
