# MIUMEOSHOP CTV — bản nâng cấp

## Web
- Đăng nhập bằng mã CTV.
- Chia danh mục **Tất cả / Đồ nữ / Đồ nam / Unisex**.
- Tìm kiếm sản phẩm.
- Giỏ hàng có tăng/giảm số lượng ngay trong giỏ.
- Popup lời chúc CTV khi đăng nhập lần đầu trong phiên.
- Nút nhạc nền. Code tự thử autoplay; iPhone/Safari có thể chặn autoplay có tiếng, khi đó CTV bấm **Bắt đầu & bật nhạc**.
- File nhạc phải nằm đúng tại `public/nhac_nen.mp3`.
- Sửa lỗi overlay giỏ hàng che màn hình login bằng `[hidden]{display:none!important}`.

## Telegram
Bot có menu nút bấm:
- Thêm sản phẩm
- Sản phẩm
- CTV
- Đơn hàng
- Thống kê
- Hướng dẫn

Thêm sản phẩm bằng ảnh + caption:
`Tên sản phẩm | Giá | Nữ/Nam/Unisex`

Nếu bỏ danh mục, bot sẽ hỏi chọn Nữ/Nam/Unisex bằng nút.

## Railway
Variables:
- `BOT_TOKEN`
- `ADMIN_CHAT_ID`

Nếu dùng dữ liệu JSON trên Railway, nên gắn Volume vào `/app/data` để dữ liệu không mất khi redeploy.


## V3 — quản trị + khóa thiết bị + troll
### Mã quản trị đặc biệt
Thêm biến Railway:
- `ADMIN_CODE`: mã bí mật để mở **Quản trị shop** ngay trên trang login.

Trong trang quản trị có thể:
- Thêm sản phẩm.
- Sửa giá nhanh.
- Xóa sản phẩm.
- Xem danh sách CTV.
- Xem CTV đang dùng **iPhone/iPad, Android, Windows, Mac hoặc Khác** dựa trên User-Agent; không thu thập IMEI, số điện thoại hay dữ liệu phần cứng chi tiết.
- Mở khóa thiết bị cho CTV khi cần đổi máy.

### 1 mã CTV = 1 thiết bị
Lần đầu CTV đăng nhập, trình duyệt tạo một mã thiết bị ngẫu nhiên và server khóa mã CTV đó vào thiết bị. Đồng thời một thiết bị không thể dùng nhiều mã CTV khác nhau trong hệ thống. Nếu CTV đổi máy, Admin có thể bấm **Mở khóa** rồi CTV đăng nhập lại.

Lưu ý: cơ chế này dựa trên mã thiết bị lưu trong trình duyệt nên việc xóa dữ liệu trình duyệt có thể làm thiết bị bị nhận như mới; Admin cần mở khóa khi cần.

### Video troll
Đặt video TikTok đã được bạn sử dụng hợp pháp tại:
`public/troll.mp4`

Sau khi CTV đăng nhập và đóng lời chúc, video troll sẽ xuất hiện một lần trong phiên. Video được mở `muted` để phù hợp giới hạn autoplay của iPhone/Safari.

## V6 — Telegram Mini App
Bot đã có Mini App quản trị giao diện mobile:
- Nút **🚀 Mở Mini App** trong `/menu`.
- Nút **🛍️ Mini App** ở menu chat Telegram (nếu `MINIAPP_URL` đã cấu hình).
- Dashboard: số sản phẩm, CTV, đơn và doanh số.
- Quản lý sản phẩm: thêm/sửa/xóa, đổi giá, danh mục.
- Chọn ảnh trực tiếp từ thư viện điện thoại; ảnh được gửi dạng data URL đã giới hạn kích thước ở server.
- Quản lý CTV và mở khóa thiết bị.
- Xem 20 đơn gần nhất.
- Mini App xác thực `Telegram.WebApp.initData` bằng HMAC; chỉ `ADMIN_CHAT_ID` được phép dùng API quản trị Mini App.

### Railway thêm biến
`MINIAPP_URL=https://DOMAIN-CUA-BAN/miniapp.html`

URL phải là **HTTPS** để Telegram Web App hoạt động. Sau khi deploy, gửi `/menu` cho bot hoặc mở lại chat để thấy nút Mini App.
