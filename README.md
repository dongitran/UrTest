# UrTest

UrTest là một ứng dụng quản lý và kiểm thử tự động, hỗ trợ việc tạo và quản lý các test case, test suite, và workflow kiểm thử thông qua tích hợp với GitHub API.

## Tính năng chính

- **Quản lý dự án**: Tạo và quản lý thông tin dự án, bao gồm các trường như tiêu đề, mô tả, và trạng thái.
- **Quản lý test suite**: Hiển thị danh sách các test suite, trạng thái, và tiến độ kiểm thử.
- **Tích hợp GitHub API**: Tự động tạo file test thông qua workflow tích hợp với GitHub.
- **Thống kê và báo cáo**: Hiển thị tỷ lệ thành công của các test case và các lần chạy gần đây.
- **Giao diện hiện đại**: Sử dụng React và Next.js để cung cấp trải nghiệm người dùng mượt mà.

## Cách sử dụng

Clone repository:

```bash
git clone https://github.com/dongitran/UrTest.git
cd UrTest
```

## Cấu trúc tư mục

```bash
backend/
  ├── src/
  │   ├── db/
  │   │   ├── schema.ts        # Định nghĩa schema cơ sở dữ liệu
  │   │   │── relations.ts     # Định nghĩa các relations của cơ sở dữ liệu
  │   ├── routes/              # Xử lý các api
  │   │── middlewares          # Các middleware của từng route hoặc tất cả routes
```
