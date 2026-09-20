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
