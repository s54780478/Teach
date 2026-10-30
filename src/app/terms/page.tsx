import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { SITE_LEGAL_ENTITY, SITE_NAME, SITE_SUPPORT_EMAIL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: `服務條款 ｜ ${SITE_NAME}`,
  description: `${SITE_NAME} 媒合平台服務條款：帳號、訂閱、導師刊登與使用規範。`,
};

export default function TermsPage() {
  return (
    <LegalPageShell title="服務條款" updatedAt="2026 年 10 月 30 日">
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">1. 總則</h2>
        <p>
          歡迎使用 {SITE_NAME}（以下稱「本平台」）。本平台由 {SITE_LEGAL_ENTITY}{' '}
          營運，提供台灣地區家教與多元技能之資訊展示與聯絡媒合服務。當您註冊、瀏覽或使用本平台任何功能（含 Student
          Pass 訂閱、導師刊登），即表示您已閱讀、理解並同意本服務條款之全部內容。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">2. 服務性質</h2>
        <p>
          本平台採「買方解鎖／訂閱通行證」模式：學員（家長）可免費瀏覽公開師資與課程資訊；於訂閱
          Student Pass 並完成付款後，得查看導師之聯絡方式（如 LINE、電話、Email）。本平台
          <strong className="font-semibold text-slate-800"> 不介入 </strong>
          實際授課契約、不代收學費、亦不抽成導師鐘點費。授課內容、時間、地點、費用與取消政策，由學員與導師雙方自行協議。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">3. 帳號與身分</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>您應提供真實、正確之註冊資料，並妥善保管帳號與登入憑證。</li>
          <li>導師刊登履歷與課程時，應確保學歷、證照、聯絡方式與授課資訊真實無誤。</li>
          <li>本平台得對不實資訊、濫用解鎖或詐騙行為採取下架、停權或報警等措施。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">4. Student Pass 訂閱與付款</h2>
        <p>
          Student Pass 為月費制通行證，付款由第三方金流服務商「藍新金流（NewebPay）」處理。訂閱費用、有效期間與續期規則以結帳頁面與訂閱狀態為準。除法令另有規定或本平台書面同意外，已完成之數位內容／通行證服務原則上不提供退款。付款爭議請先聯繫{' '}
          <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className="text-brand-500 hover:underline">
            {SITE_SUPPORT_EMAIL}
          </a>
          。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">5. 導師刊登義務</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>導師可免費註冊並刊登課程；應自行維護上架／下架狀態與聯絡管道暢通。</li>
          <li>不得刊登違法、侵權、歧視或誤導內容；不得於公開區直接散佈個人隱私以外之敏感資料。</li>
          <li>驗證標章（如學歷／身分驗證）由本平台依內部審核流程核發，不構成僱傭或保證媒合成功。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">6. 智慧財產權</h2>
        <p>
          本平台之商標、介面設計、文字與程式碼，除另有標示外，均屬本平台或其授權人所有。未經事前書面同意，不得重製、改作或商業利用。您上傳之履歷與課程內容，您仍保有權利，但授予本平台於營運所需範圍內重製、公開傳輸與展示之非專屬授權。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">7. 免責聲明</h2>
        <p>
          本平台盡力維護服務穩定與資訊正確，但不保證媒合結果、授課品質或第三方金流／通訊服務之不中斷。因雙方私下交易、授課糾紛或不可抗力所致損害，除法律強制規定外，本平台不負賠償責任。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">8. 條款修訂</h2>
        <p>
          本平台得視營運需要修訂本條款，並於網站公告後生效。若您於修訂後繼續使用服務，視為同意更新後之條款。
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">9. 準據法與管轄</h2>
        <p>
          本條款以中華民國法律為準據法。因本條款或服務所生爭議，雙方同意以臺灣臺北地方法院為第一審管轄法院。
        </p>
      </section>
    </LegalPageShell>
  );
}
