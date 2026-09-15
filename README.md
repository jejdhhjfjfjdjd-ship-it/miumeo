# MIUMEOSHOP — Telegram Admin chạy trực tiếp trên Vercel

Không cần Render. Telegram webhook chạy bằng Vercel Function.

## 1. Deploy
Upload toàn bộ thư mục này lên GitHub rồi Import repo vào Vercel.

Vercel hỗ trợ Python/Functions, nhưng bản này dùng JavaScript Function để webhook Telegram gọn và phù hợp Vercel.

## 2. Environment Variables trên Vercel
Vào Project → Settings → Environment Variables và thêm:

- `BOT_TOKEN` = token lấy từ @BotFather
- `TELEGRAM_ADMIN_ID` = Telegram numeric ID của bạn
- `GITHUB_TOKEN` = GitHub token có quyền ghi repo
- `GITHUB_REPO` = `username/repository`
- `GITHUB_BRANCH` = `main`
- `PRODUCT_FILE` = `index.html`
- `IMAGE_DIR` = `images/products`

Không đưa token vào GitHub. Vercel lưu secrets trong Environment Variables. Sau khi đổi biến môi trường cần redeploy.

## 3. Đặt webhook Telegram
Sau khi Vercel deploy xong, đặt webhook tới:

`https://TEN-MIEN-VERCEL-CUA-BAN.vercel.app/api/telegram`

Có thể dùng BotFather hoặc Telegram Bot API `setWebhook`. Không commit token vào repo.

## 4. Cách thêm sản phẩm
Trong Telegram:
1. `/start`
2. Bấm `➕ THÊM SẢN PHẨM`
3. Gửi **ảnh áo + tên áo trong caption**
4. Chọn `Áo nam / Áo nữ / Quần / Váy / Phụ kiện`
5. Bot upload ảnh vào `images/products/`, thêm sản phẩm vào `index.html`, commit GitHub.
6. Vercel tự build lại từ GitHub.

Bot không hỏi giá; giá mặc định là `Liên hệ` để đúng yêu cầu chỉ nhập tên + mục.

## 5. Lưu ý
`index.html` phải giữ marker:
`// BOT_PRODUCTS_START`
`// BOT_PRODUCTS_END`

GitHub token phải có quyền ghi nội dung repository. Chỉ ID Telegram trong `TELEGRAM_ADMIN_ID` được dùng bot.
