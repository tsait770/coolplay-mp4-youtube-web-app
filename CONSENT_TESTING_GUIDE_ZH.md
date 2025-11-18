# 🚀 首次使用同意 - 快速測試指南

## 測試步驟

### 1. 測試首次使用流程

#### 選項 A：使用開發者選項（推薦）
1. 打開應用
2. 進入：**設定 > 開發者選項 > 實驗性功能**
3. 點擊「**重置首次使用同意**」
4. 確認重置
5. **重啟應用**
6. 應該會看到首次使用同意對話框

#### 選項 B：清除應用數據
```bash
# iOS 模擬器
xcrun simctl erase all

# Android 模擬器
adb shell pm clear com.yourpackage.name

# 或在設備設定中清除應用數據
```

---

## 對話框功能

### 必要權限（Required）
- ✅ **麥克風存取**：語音控制功能所需
- ✅ **儲存空間存取**：保存書籤和設定

### 可選權限（Optional）
- ⭕ **使用分析**：幫助改善應用（可選）

### 操作
- **接受並繼續**：必須開啟所有必要權限才能點擊
- **拒絕**：顯示提示信息，要求接受必要權限

---

## 語言測試

測試所有 12 種語言的翻譯：

```
1. 英文 (en)
2. 繁體中文 (zh-TW)
3. 簡體中文 (zh-CN)
4. 韓語 (ko)
5. 日語 (ja)
6. 西班牙語 (es)
7. 法語 (fr)
8. 德語 (de)
9. 俄語 (ru)
10. 阿拉伯語 (ar)
11. 葡萄牙語 (pt)
12. 巴西葡萄牙語 (pt-BR)
```

**測試方法：**
1. 進入：設定 > 外觀與語言 > 語言
2. 選擇語言
3. 使用開發者選項重置同意
4. 重啟應用
5. 檢查同意對話框是否正確翻譯

---

## 檢查項目

### UI 檢查
- [ ] 對話框在各種屏幕尺寸上正常顯示
- [ ] 權限開關可以正常切換
- [ ] 按鈕在禁用狀態下顯示正確
- [ ] 滾動視圖在內容過多時正常工作

### 功能檢查
- [ ] 接受同意後，狀態正確保存
- [ ] 拒絕後顯示提示信息
- [ ] 重置功能正常工作
- [ ] 重啟後不會再次顯示（除非重置）

### 翻譯檢查
- [ ] 所有文字正確翻譯
- [ ] 沒有顯示翻譯鍵（如 "welcome_to_coolplay"）
- [ ] 文字長度適配 UI 佈局
- [ ] 特殊字符正確顯示

---

## 快速命令

```bash
# 運行翻譯腳本（如需更新）
node scripts/apply-consent-translations.js

# 查看翻譯鍵
cat l10n/en.json | grep "consent\|permission\|voice_data"

# 清除應用數據（Android）
adb shell pm clear com.yourpackage.name
```

---

## 常見問題

### Q: 對話框沒有顯示？
A: 檢查 AsyncStorage 中是否有 `hasAcceptedConsent` 鍵。使用開發者選項重置。

### Q: 翻譯沒有生效？
A: 確認語言文件中包含所需的翻譯鍵。運行翻譯腳本重新應用。

### Q: 如何測試拒絕流程？
A: 在對話框中點擊「拒絕」，應該會看到提示信息。

### Q: 如何測試多次？
A: 使用開發者選項中的重置功能，無需重新安裝應用。

---

## 文件位置

- **對話框組件**: `components/FirstTimeConsentModal.tsx`
- **整合邏輯**: `app/_layout.tsx`
- **隱私政策**: `app/settings/help/privacy-policy.tsx`
- **服務條款**: `app/settings/help/terms-of-service.tsx`
- **翻譯腳本**: `scripts/apply-consent-translations.js`
- **開發者選項**: `app/settings/developer/experimental.tsx`

---

**最後更新：** 2025-01-18
