# idaltu 專案代理人指引 (AGENTS.md)

---

## 📌 1. 專案背景與商業核心機制

### 1.1 平台定位
**idaltu** 是一座專注於台灣市場的在地家教與多元技能媒合平台（MVP）。核心 UI 與產品架構參考全球最大實體媒合平台 **Superprof**，並針對台灣在地學習情境（面授到府 / 咖啡廳教學 / 高清線上遠距）進行本土化。

### 1.2 商業模式：買方解鎖制 (Buyer Unlock Model)
不同於傳統家教仲介動輒向老師抽取 20%~50% 首月學費或持續抽佣，idaltu 採用與國際 Superprof 一致的**「買方解鎖制」**：
* **導師端 (Supply)**：免費註冊刊登、不抽成實體/線上鐘點費、建立個人品牌與學生口碑。
* **學員端 (Demand)**：免費瀏覽全台公開師資與履歷評價。當確定要向心儀導師發起排課或發送第一則諮詢時，由學員（買方）支付解鎖通行證或代幣以「解鎖聯繫 (Contact Tutor)」。
* **雙向信任基石**：
  1. **100% 學歷與身份官方查驗 (Verified Badge)**：標章需嚴格審核頂大學歷或專業證照。
  2. **首堂免費試教 (1st Lesson Free)**：吸引學員放心發起解鎖，大幅降低媒合門檻與試錯成本。
  3. **實體行政區定位**：支援「台北市大安區」、「新北板橋」等精密行政區與線上授課切換。

---

## 💻 2. 技術規範與架構標準

### 2.1 技術棧 (Tech Stack)
* **核心框架**：Next.js 15+ (App Router，位於 `src/app/`)
* **語言標準**：TypeScript 5+ (嚴格型別定義，禁止任意使用 `any`)
* **樣式框架**：Tailwind CSS (結合自訂 Superprof 經典珊瑚紅 `#ff5454` 作為品牌主色 `brand-500`)
* **圖示庫**：`lucide-react`
* **元件風格**：現代簡約、高質感圓角 (`rounded-2xl` / `rounded-3xl`)、精緻微互動與卡片陰影

### 2.2 目錄架構規範
```text
Teach/
├── AGENTS.md                  # 本指引文件與持續進度維護日誌
├── README.md                  # 專案說明與啟動指南
├── package.json
├── tsconfig.json
├── tailwind.config.ts         # 自定義 brand 色彩與主題擴充
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 全局 Layout 與 SEO Metadata
│   │   ├── page.tsx           # 首頁與搜尋列表整合頁 (客戶端互動式過濾)
│   │   └── globals.css        # Tailwind 基本指令與捲軸美化
│   ├── components/
│   │   ├── Header.tsx         # 極簡小寫 idaltu Logo + Superprof 膠囊雙核心搜尋列
│   │   ├── TutorCard.tsx      # 導師卡片 (驗證標章、學歷、標籤、時薪、解鎖按鈕)
│   │   ├── CategoryFilter.tsx # 技能分類膠囊列、首堂免費切換、排序器
│   │   └── ContactModal.tsx   # 解鎖聯繫互動彈窗 (買方發起諮詢)
│   ├── data/
│   │   └── mockTutors.ts      # 台灣在地高質感假資料 (8位頂大與專家導師)
│   └── types/
│       └── tutor.ts           # Tutor、VerificationInfo、TeachingMode 等型別定義
```

### 2.3 程式碼編寫守則
1. **型別一致性**：所有資料結構與 Props 必須於 `src/types/` 定義嚴格型別，導師物件遵循 `Tutor` 介面。
2. **行動優先 (Mobile-First)**：所有 UI 元件需同時兼顧 Desktop 網格與 Mobile 視圖（如 Header 支援行動抽屜選單）。
3. **無障礙與語意化**：卡片使用語意標籤 `<article>`，按鈕與輸入框需具備清楚的 `aria-label` 或 `label`。

---

## 📌 3. 開發守則與背景備忘
* **核心記憶已鎖定**：代理人已牢記「買方解鎖制」、Superprof UI 結構、在地化頂大學歷審查與首堂免費試聽機制。
* **高效原則**：日常程式碼修改以敏捷交付為主，不需頻繁寫入日誌，專注於功能開發與使用者體驗提升。

