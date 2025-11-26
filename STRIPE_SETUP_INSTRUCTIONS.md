# 🚀 Stripe 整合完整指南

## 📋 目錄
1. [Stripe 儀表板設置](#stripe-儀表板設置)
2. [創建產品與價格](#創建產品與價格)
3. [更新環境變數](#更新環境變數)
4. [測試流程](#測試流程)
5. [常見問題](#常見問題)

---

## 🎯 Stripe 儀表板設置

### 步驟 1：登入 Stripe
1. 前往 [Stripe Dashboard](https://dashboard.stripe.com)
2. 確保切換到 **測試模式**（右上角開關）

### 步驟 2：獲取 API 金鑰
1. 點擊 **開發者** → **API 金鑰**
2. 複製以下金鑰：
   - **可發布金鑰**（Publishable key）：`pk_test_...`
   - **密鑰**（Secret key）：`sk_test_...`

✅ 你的 `.env` 已經包含這些金鑰：
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💰 創建產品與價格

### 方案 1：基礎會員 - 月付（Basic Monthly）

1. 前往 **產品** → **新增產品**
2. 填寫資訊：
   ```
   產品名稱：Basic Monthly
   描述：1500 uses per month + 40 daily login bonus
   ```
3. 設定價格：
   ```
   價格：$19.90 USD
   計費週期：每月（Monthly）
   計費模式：訂閱（Recurring）
   ```
4. 點擊 **儲存產品**
5. **複製價格 ID**（格式：`price_xxxxxxxxxxxxx`）
6. 更新 `.env`：
   ```env
   EXPO_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
   ```

### 方案 2：基礎會員 - 年付（Basic Yearly）

1. 前往 **產品** → **新增產品**
2. 填寫資訊：
   ```
   產品名稱：Basic Yearly
   描述：1500 uses per month + 40 daily login bonus (Save 25%)
   ```
3. 設定價格：
   ```
   價格：$199.00 USD
   計費週期：每年（Yearly）
   計費模式：訂閱（Recurring）
   ```
4. 點擊 **儲存產品**
5. **複製價格 ID**
6. 更新 `.env`：
   ```env
   EXPO_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
   ```

### 方案 3：高級會員 - 月付（Plus Monthly）

1. 前往 **產品** → **新增產品**
2. 填寫資訊：
   ```
   產品名稱：Plus Monthly
   描述：Unlimited uses + Priority support + Early access
   ```
3. 設定價格：
   ```
   價格：$39.90 USD
   計費週期：每月（Monthly）
   計費模式：訂閱（Recurring）
   ```
4. 點擊 **儲存產品**
5. **複製價格 ID**
6. 更新 `.env`：
   ```env
   EXPO_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
   ```

### 方案 4：高級會員 - 年付（Plus Yearly）

1. 前往 **產品** → **新增產品**
2. 填寫資訊：
   ```
   產品名稱：Plus Yearly
   描述：Unlimited uses + Priority support + Early access (Save 25%)
   ```
3. 設定價格：
   ```
   價格：$399.00 USD
   計費週期：每年（Yearly）
   計費模式：訂閱（Recurring）
   ```
4. 點擊 **儲存產品**
5. **複製價格 ID**
6. 更新 `.env`：
   ```env
   EXPO_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
   ```

---

## 🔧 更新環境變數

完成所有產品創建後，你的 `.env` 應該包含：

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://tdamcrigenexyhbsopay.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs（請替換為你的實際 Price ID）
EXPO_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_URL=http://localhost:8081
EXPO_PUBLIC_RORK_API_BASE_URL=https://toolkit.rork.com
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com
```

⚠️ **重要**：將 `price_xxxxxxxxxxxxx` 替換為你從 Stripe 儀表板複製的實際價格 ID。

---

## 🧪 測試流程

### 測試卡號

在測試模式下使用以下卡號：

| 場景 | 卡號 | 結果 |
|------|------|------|
| 成功付款 | `4242 4242 4242 4242` | ✅ 付款成功 |
| 付款失敗 | `4000 0000 0000 0002` | ❌ 卡片被拒絕 |
| 需要驗證 | `4000 0025 0000 3155` | 🔐 需要 3D Secure |

**其他資訊**：
- 到期日：任何未來日期（例如：12/34）
- CVC：任何 3 位數字（例如：123）
- 郵遞區號：任何 5 位數字（例如：12345）

### 測試步驟

1. **啟動應用**
   ```bash
   bun run start
   ```

2. **導航到訂閱頁面**
   - 點擊設定 → 訂閱管理
   - 或直接訪問 `/subscription`

3. **選擇方案**
   - 選擇月付或年付
   - 點擊任一方案的「訂閱」按鈕

4. **完成付款**
   - 輸入測試卡號：`4242 4242 4242 4242`
   - 輸入到期日：`12/34`
   - 輸入 CVC：`123`
   - 點擊「訂閱」

5. **驗證結果**
   - ✅ 應該跳轉到成功頁面
   - ✅ 會員等級應該更新
   - ✅ 在 Stripe 儀表板查看付款記錄

### 測試取消訂閱

1. 在訂閱頁面點擊「取消訂閱」
2. 確認取消
3. 驗證會員等級恢復為免費

---

## ❓ 常見問題

### Q1: 找不到價格 ID 在哪裡？
**A**: 在 Stripe 儀表板 → 產品 → 點擊你的產品 → 在「定價」區塊可以看到價格 ID（以 `price_` 開頭）。

### Q2: 測試付款後沒有更新會員狀態？
**A**: 檢查以下項目：
1. 確認 Stripe Webhook 已設置
2. 檢查後端日誌是否有錯誤
3. 確認 Supabase 連接正常
4. 重新整理頁面

### Q3: 點擊訂閱按鈕沒有反應？
**A**: 
1. 打開瀏覽器控制台查看錯誤
2. 確認 `.env` 中的價格 ID 正確
3. 確認 Stripe 金鑰正確
4. 檢查網路連接

### Q4: 如何切換到正式環境？
**A**: 
1. 在 Stripe 儀表板切換到「正式模式」
2. 創建相同的產品（正式環境）
3. 更新 `.env` 使用正式金鑰（`pk_live_` 和 `sk_live_`）
4. 更新價格 ID 為正式環境的 ID

### Q5: 如���設置 Webhook？
**A**: 
1. Stripe 儀表板 → 開發者 → Webhooks
2. 新增端點：`https://your-domain.com/api/trpc/stripe.webhook`
3. 選擇事件：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 複製 Webhook 密鑰並加入 `.env`

---

## 📞 支援

如果遇到問題：
1. 查看 [Stripe 文檔](https://stripe.com/docs)
2. 檢查 Stripe 儀表板的日誌
3. 查看應用的控制台錯誤
4. 聯繫技術支援

---

## ✅ 檢查清單

完成設置後，確認以下項目：

- [ ] Stripe 帳號已創建並切換到測試模式
- [ ] API 金鑰已複製到 `.env`
- [ ] 4 個產品已在 Stripe 創建
- [ ] 4 個價格 ID 已更新到 `.env`
- [ ] 使用測試卡號成功完成付款
- [ ] 會員狀態正確更新
- [ ] 取消訂閱功能正常
- [ ] Webhook 已設置（可選，用於自動更新）

完成以上步驟後，你的 Stripe 整合就完成了！🎉
