# Authentication System

Hệ thống xác thực đa thiết bị với Vue 3 và TypeScript.

## Cài đặt

1. Clone repository
```bash
git clone git@github.com:quanglx-noovado/login-demo.git
cd login-demo
```

2. Cài đặt dependencies
```bash
npm install
```
## Chạy ứng dụng

### Development
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173`


## Tính năng chính

1. **Đăng nhập**
   - Xác thực email/password
   - Hỗ trợ đa thiết bị (tối đa 3 thiết bị)
   - Tự động nhận diện thiết bị mới

2. **Xác thực thiết bị mới**
   - Gửi mã OTP qua email
   - Xác thực OTP để kích hoạt thiết bị

3. **Quản lý thiết bị**
   - Xem danh sách thiết bị đã kích hoạt
   - Gỡ bỏ một hoặc nhiều thiết bị
   - Xác thực OTP khi gỡ bỏ thiết bị

## Cấu trúc project
