# Web báo giá CTV — Miumeoshop

Gồm 2 phần chạy chung 1 chỗ:
- **Web cho CTV**: mỗi CTV có 1 mã riêng để đăng nhập, xem bảng giá, đặt hàng.
- **Bot Telegram cho admin (bạn)**: thêm sản phẩm bằng cách gửi ảnh, sửa/xoá giá, tạo mã cho CTV mới, xem đơn hàng — tất cả ngay trong Telegram, không cần vào web quản trị riêng.

Dữ liệu (sản phẩm / mã CTV / đơn hàng) được lưu vào các file trong thư mục `data/`, không mất khi bot restart — miễn là bạn deploy đúng hướng dẫn bên dưới (có gắn ổ lưu trữ riêng).

---

## Bước 1 — Tạo bot Telegram

1. Mở Telegram, tìm **@BotFather**, nhắn `/newbot`.
2. Đặt tên bot (VD: `Miumeoshop Quản Lý`) rồi đặt username (phải kết thúc bằng `bot`, VD: `miumeoshop_admin_bot`).
3. BotFather sẽ gửi cho bạn một đoạn **Token** dạng `123456:ABC-xxxxxxx` — lưu lại, đây là `BOT_TOKEN`.

## Bước 2 — Lấy Chat ID của bạn (để bot biết ai là admin)

1. Tìm **@userinfobot** trên Telegram, nhấn Start.
2. Nó trả về một số **Id** — đó là `ADMIN_CHAT_ID` của bạn. Lưu lại.

## Bước 3 — Đưa code lên GitHub

1. Tạo tài khoản tại [github.com](https://github.com) nếu chưa có.
2. Tạo repository mới (Private cũng được), rồi upload toàn bộ nội dung thư mục này lên (kéo thả file trên trang GitHub cũng được, không cần biết dòng lệnh).

## Bước 4 — Deploy lên Railway (miễn phí, có lưu trữ lâu dài)

1. Vào [railway.app](https://railway.app), đăng nhập bằng GitHub.
2. **New Project → Deploy from GitHub repo** → chọn repo vừa tạo ở Bước 3.
3. Vào tab **Variables**, thêm 2 biến:
   - `BOT_TOKEN` = token lấy ở Bước 1
   - `ADMIN_CHAT_ID` = id lấy ở Bước 2
4. Vào tab **Settings → Volumes → New Volume**, đặt **Mount path** là `/app/data` (bước này quan trọng — nếu bỏ qua, dữ liệu sẽ mất mỗi lần Railway deploy lại).
5. Railway tự build và chạy. Sau khi xong, vào tab **Settings → Networking → Generate Domain** để có link web dạng `https://xxxx.up.railway.app`.

Link đó chính là trang bạn gửi cho CTV. Mỗi người dùng chung 1 link, chỉ khác mã đăng nhập riêng.

## Bước 5 — Bắt đầu dùng

Mở Telegram, chat với bot của bạn, gõ `/start` rồi `/help` để xem toàn bộ lệnh:

- Gửi **1 ảnh sản phẩm**, phần chú thích ghi `Tên sản phẩm | Giá` (VD: `Áo thun trắng | 120000`) → tự thêm vào bảng giá.
- `/dssp` — xem danh sách sản phẩm và mã của từng sản phẩm
- `/suagia [mã] [giá mới]` — sửa giá
- `/xoasp [mã]` — xoá sản phẩm
- `/themctv [tên CTV]` — tạo mã đăng nhập riêng cho 1 CTV mới, gửi mã đó cho họ
- `/dsctv` — xem lại danh sách CTV và mã của từng người
- `/xoactv [mã]` — thu hồi quyền truy cập của 1 CTV
- `/dondathang` — xem 10 đơn hàng gần nhất mà CTV đã gửi

Khi CTV đặt hàng trên web, bạn sẽ nhận được tin nhắn Telegram ngay lập tức.

---

## Ghi chú

- Đây là bản MVP gọn nhẹ, đủ dùng cho quy mô shop nhỏ/vừa. Nếu sau này lượng CTV và đơn hàng lớn hơn nhiều, nên chuyển sang cơ sở dữ liệu thật (Postgres/MongoDB) thay vì file JSON.
- Chỉ 1 admin (1 `ADMIN_CHAT_ID`) quản lý được bot ở bản này.
- Muốn chạy thử trên máy tính trước khi deploy: cài [Node.js](https://nodejs.org), sao chép `.env.example` thành `.env` và điền token, sau đó chạy `npm install` rồi `npm start`.
