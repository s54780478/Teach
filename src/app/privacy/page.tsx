import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { SITE_LEGAL_ENTITY, SITE_NAME, SITE_SUPPORT_EMAIL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: `隱私權政策 ｜ ${SITE_NAME}`,
  description: `${SITE_NAME} 個人資料保護與隱私權政策說明。`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="隱私權政策" updatedAt="2026 年 10 月 30 日">
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">1. 適用範圍</h2>
        <p>
          {SITE_LEGAL_ENTITY}（以下稱「我們」）重視您的隱私。本政策說明當您使用 {SITE_NAME}{' '}
          網站、App 或相關服務時，我們如何蒐集、處理、利用與保護個人資料，並符合《個人資料保護法》及相關法規。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">2. 蒐集之資料類型</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="font-semibold text-slate-800">帳號資料：</span>
            電子郵件、登入識別碼、顯示名稱等。
          </li>
          <li>
            <span className="font-semibold text-slate-800">導師履歷資料：</span>
            姓名、頭像、簡介、學歷／專長、授課地區與模式、時薪、LINE ID、電話、Email 等您自行提供之內容。
          </li>
          <li>
            <span className="font-semibold text-slate-800">訂閱與交易資料：</span>
            Student Pass 訂閱狀態、訂單編號、金流交易序號；信用卡號由藍新金流處理，我們不儲存完整卡號。
          </li>
          <li>
            <span className="font-semibold text-slate-800">使用紀錄：</span>
            裝置類型、瀏覽器、IP、造訪頁面與操作紀錄（用於安全與服務改善）。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">3. 蒐集目的與利用</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>提供帳號註冊、登入、導師刊登與課程媒合服務。</li>
          <li>處理 Student Pass 訂閱、付款確認與客服支援。</li>
          <li>於您訂閱有效期間，向您顯示導師聯絡方式以便排課諮詢。</li>
          <li>防制詐欺、濫用、資安事件，並遵守法令或主管機關要求。</li>
          <li>在去識別化或統計基礎上改善產品體驗。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">4. 資料分享與委託</h2>
        <p>
          我們不會出售您的個人資料。僅在下列情形可能提供必要資料予第三方：
        </p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <span className="font-semibold text-slate-800">金流服務：</span>
            藍新金流（NewebPay）處理付款授權與定期定額。
          </li>
          <li>
            <span className="font-semibold text-slate-800">基礎設施：</span>
            雲端資料庫／身分驗證（如 Supabase）等受託處理者，依合約與個資法善管義務處理。
          </li>
          <li>法令要求、司法／行政程序，或為保護使用者與公眾重大利益所必要。</li>
        </ul>
        <p className="mt-2">
          當學員持有有效 Student Pass 時，導師於履歷中公開之聯絡方式將顯示予該學員；請導師僅填寫願意對外提供之資訊。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">5. Cookie 與類似技術</h2>
        <p>
          我們可能使用 Cookie 或本機儲存（如 LocalStorage）維持登入狀態、記住訂閱／解鎖體驗設定。您可透過瀏覽器設定限制
          Cookie，但部分功能可能無法正常運作。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">6. 資料保存與安全</h2>
        <p>
          我們於營運與法令所需期間內保存資料，並採取合理之技術與管理措施（含傳輸加密、存取控管）。請注意網際網路傳輸無法保證絕對安全；若發現帳號異常請立即通知我們。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">7. 您的權利</h2>
        <p>
          依個資法，您得請求查詢、閱覽、製給複製本、補充更正、停止蒐集處理利用或刪除個人資料（法令另有規定或保存必要者除外）。請以電子郵件聯繫：
        </p>
        <p className="mt-2">
          <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className="text-brand-500 font-semibold hover:underline">
            {SITE_SUPPORT_EMAIL}
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">8. 未成年人</h2>
        <p>
          若學員為未成年人，應由其法定代理人閱讀並同意本政策與服務條款後使用。我們不主動蒐集未滿法定年齡者之個資；如發現將依情況刪除或限制處理。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">9. 政策更新</h2>
        <p>
          本政策如有修正，將公布於本頁並更新「最後更新日期」。重大變更時，我們得另以站內通知或 Email 提醒。
        </p>
      </section>
    </LegalPageShell>
  );
}
