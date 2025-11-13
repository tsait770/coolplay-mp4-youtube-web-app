# 数据库迁移步骤确认清单

## 📋 当前状态

根据截图和代码检查，你已完成：

✅ **步骤 1**: 更新 .env 文件中的新 Supabase URL 和 API Key
✅ **步骤 2**: 更新 lib/supabase.ts 中的连接配置
✅ **步骤 3**: 在新 Supabase 项目中执行 Schema SQL（截图显示 "Success"）

## ⚠️ 需要确认的关键步骤

### 步骤 4: 验证表结构是否完整创建

**问题**: 虽然 SQL 执行显示 "Success. No rows returned"，但需要确认所有表都已创建。

**验证方法**:

#### 方法 A: 使用 Supabase Dashboard（推荐）
1. 打开 https://ukpskaspdzinzpsdoodi.supabase.co
2. 进入 **Table Editor**
3. 检查是否存在以下表：
   - ✓ profiles
   - ✓ bookmarks
   - ✓ folders
   - ✓ device_verifications
   - ✓ bound_devices
   - ✓ usage_logs

#### 方法 B: 使用验证脚本
```bash
# 在项目根目录执行
npx ts-node scripts/verify-database-migration.ts
```

#### 方法 C: 在 App 中测试
1. 重启开发服务器：
   ```bash
   # 停止当前服务器（Ctrl+C）
   # 重新启动
   npx expo start --clear
   ```

2. 在 App 中打开：
   - 设置 → 开发者选项 → 连接测试
   - 点击 "开始测试"
   - 查看结果

---

## 🔍 常见问题排查

### 问题 1: SQL 执行成功但表不存在

**可能原因**:
- SQL 中包含 `DROP TABLE IF EXISTS` 但没有对应的 `CREATE TABLE`
- SQL 执行在错误的 Schema 中（不是 public）
- RLS 策略阻止了表的访问

**解决方案**:
1. 在 Supabase SQL Editor 中执行：
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_type = 'BASE TABLE'
   ORDER BY table_name;
   ```

2. 如果表不存在，重新运行完整的 Schema SQL

### 问题 2: 环境变量未生效

**症状**: 
- App 中显示 "环境变数缺失"
- 连接测试失败

**解决方案**:
```bash
# 1. 停止开发服务器
# 2. 清除缓存并重启
npx expo start --clear

# 如果还是不行，删除 node_modules/.cache
rm -rf node_modules/.cache
npx expo start
```

### 问题 3: 数据迁移（如需要从旧项目迁移数据）

如果你需要迁移旧项目的用户数据，需要额外步骤：

```sql
-- 在旧项目中导出数据（在 Supabase SQL Editor 执行）
COPY (SELECT * FROM profiles) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM bookmarks) TO STDOUT WITH CSV HEADER;
-- ... 其他表

-- 在新项目中导入数据
-- （需要使用 Service Role Key，在后台 Settings → API）
```

---

## ✅ 验证步骤完成标准

当你完成验证后，应该看到：

### Supabase Dashboard:
- [x] Table Editor 中显示 6 个表
- [x] 每个表都有正确的列结构
- [x] RLS 策略已启用

### App 连接测试:
- [x] 环境变数验证: ✅
- [x] Supabase 连接测试: ✅
- [x] 数据庫表驗證: ✅ (所有 6 个表)

### 验证脚本输出:
```
✅ 通过: 7
❌ 失败: 0
⚠️  警告: 0

🎉 所有检查都已通过！
```

---

## 🚀 下一步行动

1. **立即执行**: 验证表结构（使用上述任一方法）
2. **如果验证失败**: 
   - 查看具体错误信息
   - 在 Supabase SQL Editor 中重新运行完整 Schema
   - 确保使用的是 "InstaPlay V7 Complete App Schema" 文件
3. **如果验证成功**: 
   - 测试 App 功能
   - 确认用户注册/登录流程
   - 测试书签功能

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. Supabase Table Editor 截图
2. App 连接测试结果截图
3. 验证脚本输出（如果执行了）
4. 具体错误信息

这样我可以更准确地帮你解决问题。
