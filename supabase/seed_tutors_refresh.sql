-- 刷新示範導師（18 位）：台灣／東亞真人肖像 + 科目對齊
-- 於 Supabase SQL Editor 整段執行（會刪除 id 為 tutor-% 的舊示範列）
-- 真實註冊導師（UUID）不會被刪除
--
-- 注意：前端也會合併 MOCK_TUTORS，即使未跑此腳本，正式站列表仍會顯示示範導師。

delete from public.tutors where id like 'tutor-%';

insert into public.tutors (
  id, name, headline, bio, avatar_url, degree, specialty_tags,
  subject_category, city, district, display_location, mode, teaching_modes,
  hourly_rate, first_lesson_free, free_lesson_minutes, response_speed_minutes, response_time,
  taught_hours, rating, review_count, badge, line_id, phone, email,
  is_published, is_verified
) values
(
  'tutor-1', '林承翰',
  '台大物理所｜高中物理與學測自然直覺解題',
  '專攻高中物理、學測自然與分科測驗。把抽象公式拆成生活模型，大安面授或線上白板皆可。',
  '/avatars/tutor-1.jpg',
  '國立臺灣大學 物理學研究所碩士',
  array['高中物理','國中理化','學測自然','分科測驗']::text[],
  '學科升學', '台北市', '大安區', '台北市大安區 / 可線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  950, true, 60, 12, '通常在 1 小時內回覆', 180, 5.0, 46, '金牌導師',
  'lin_physics_ntu', '0912-888-321', 'chenghan.lin@idaltu.tw', true, true
),
(
  'tutor-2', '陳玟妤',
  'UCL 語言學碩士｜雅思口說與商務英文',
  '旅英四年、科技業外語顧問經驗。情境式口說法協助卡關學員開口，專攻雅思與商務簡報。全台線上。',
  '/avatars/tutor-2.jpg',
  '倫敦大學學院 (UCL) 應用語言學碩士',
  array['雅思','商務英文','英文口說','留學申請']::text[],
  '外語學習', '台北市', '信義區', '台北市信義區 / 線上', 'online',
  array['online']::text[],
  1100, true, 60, 8, '通常在 1 小時內回覆', 240, 4.9, 38, '熱門首選',
  'wenyu_ielts', '0928-112-990', 'wenyu.chen@idaltu.tw', true, true
),
(
  'tutor-3', '張庭瑋',
  '清大資工｜React／Python 實戰與作品集',
  '美商前端工程師，帶你用 Next.js 做出可上線專案並整理求職作品集。新竹可面授、全台線上。',
  '/avatars/tutor-3.jpg',
  '國立清華大學 資訊工程學系',
  array['程式','React','Python','作品集']::text[],
  '程式設計', '新竹市', '東區', '新竹市東區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  1200, false, 60, 20, '通常在 1 小時內回覆', 95, 5.0, 29, '金牌導師',
  'tingwei_code', '0933-774-219', 'tingwei.chang@idaltu.tw', true, true
),
(
  'tutor-4', '黃雅涵',
  '師大數學教育｜國中會考數學一對一',
  '七年國中數學經驗，專門陪害怕數學的孩子建立解題節奏。板橋、新莊可到府或咖啡廳面授。',
  '/avatars/tutor-4.jpg',
  '國立臺灣師範大學 數學教育學系',
  array['國中數學','會考','國小數學','一對一']::text[],
  '學科升學', '新北市', '板橋區', '新北市板橋區 / 面授', 'in-person',
  array['in_person','student_home']::text[],
  800, true, 60, 15, '通常在 1 小時內回覆', 320, 4.9, 52, '熱門首選',
  'yahan_math', '0955-321-765', 'yahan.huang@idaltu.tw', true, true
),
(
  'tutor-5', '高睿宇',
  '台大化學所｜高中化學與分科測驗',
  '用結構與熱力學邏輯串起高中化學，客製進度與重點筆記。台北中正面授或線上皆可。',
  '/avatars/tutor-5.jpg',
  '國立臺灣大學 化學研究所',
  array['高中化學','理化','分科測驗','學測自然']::text[],
  '學科升學', '台北市', '中正區', '台北市中正區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  900, true, 60, 10, '通常在 1 小時內回覆', 110, 5.0, 31, '新星特選',
  'ruiyu_chem', '0978-654-321', 'ruiyu.kao@idaltu.tw', true, true
),
(
  'tutor-6', '王詩涵',
  '政大日文系｜JLPT 與生活日文會話',
  '台日雙語背景，擅長 JLPT N2–N1 與職場／旅遊會話。針對台灣學生常錯的助詞與漢字用法加強。台中面授、全台線上。',
  '/avatars/tutor-6.jpg',
  '國立政治大學 日本語文學系',
  array['日文','JLPT','日文會話','N2']::text[],
  '外語學習', '台中市', '西區', '台中市西區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  850, true, 60, 5, '通常在 1 小時內回覆', 410, 5.0, 64, '金牌導師',
  'shihan_jp', '0981-998-112', 'shihan.wang@idaltu.tw', true, true
),
(
  'tutor-7', '吳采潔',
  '北藝大鋼琴｜流行伴奏與古典基礎',
  '鋼琴視奏、流行伴奏與古典基本功。松山工作室面授為主，適合零基礎到檢定、想自彈自唱的國高中與成人。',
  '/avatars/tutor-7.jpg',
  '國立臺北藝術大學 音樂學系（鋼琴）',
  array['鋼琴','音樂','流行伴奏','唱歌']::text[],
  '音樂藝術', '台北市', '松山區', '台北市松山區 / 工作室', 'in-person',
  array['in_person','student_home']::text[],
  1000, true, 60, 25, '通常在 1 小時內回覆', 85, 4.9, 22, '新星特選',
  'tsaijie_piano', '0966-443-210', 'tsaijie.wu@idaltu.tw', true, true
),
(
  'tutor-8', '沈佑庭',
  '政大企管所｜學測英文作文與閱測',
  '學測英文閱測與作文結構訓練，晚間線上方便高中生。文山可面授。',
  '/avatars/tutor-8.jpg',
  '國立政治大學 企業管理研究所',
  array['學測英文','英文作文','高中英文','文法']::text[],
  '外語學習', '台北市', '文山區', '台北市文山區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  850, true, 60, 14, '通常在 1 小時內回覆', 130, 4.8, 19, '新星特選',
  'youtting_eng', '0921-556-789', 'youtting.shen@idaltu.tw', true, true
),
(
  'tutor-9', '許庭安',
  '台師大國文系｜學測國文與作文架構',
  '帶學測國文閱讀與作文取材架構，擅長短時間建立論點與例證庫。公館、古亭可面授。',
  '/avatars/tutor-9.jpg',
  '國立臺灣師範大學 國文學系',
  array['國文','學測國文','作文','文言文']::text[],
  '語文寫作', '台北市', '中正區', '台北市中正區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  780, true, 45, 18, '通常在 1 小時內回覆', 150, 4.9, 27, '熱門首選',
  'tingan_chinese', '0918-220-447', 'tingan.hsu@idaltu.tw', true, true
),
(
  'tutor-10', '周柏宇',
  '成大電機｜高中數學與學測數A／數B',
  '清楚拆解觀念題與運算流程，適合想從模考中段往上衝的學生。台南可面授，外縣市線上。',
  '/avatars/tutor-10.jpg',
  '國立成功大學 電機工程學系',
  array['高中數學','學測數學','數A','數B']::text[],
  '學科升學', '台南市', '東區', '台南市東區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  880, true, 60, 11, '通常在 1 小時內回覆', 200, 4.9, 41, '金牌導師',
  'boyu_math', '0936-771-002', 'boyu.chou@idaltu.tw', true, true
),
(
  'tutor-11', '林予安',
  '北教大音樂｜流行歌唱與發聲練習',
  '流行唱腔、氣息與麥克風練習，適合想上節目或單純愛唱歌的學員。士林工作室面授為主。',
  '/avatars/tutor-11.jpg',
  '國立臺北教育大學 音樂學系',
  array['唱歌','流行歌唱','音樂','發聲']::text[],
  '音樂藝術', '台北市', '士林區', '台北市士林區 / 工作室', 'in-person',
  array['in_person','student_home']::text[],
  900, true, 30, 22, '通常在 1 小時內回覆', 70, 5.0, 16, '新星特選',
  'yuan_sing', '0972-335-881', 'yuan.lin@idaltu.tw', true, true
),
(
  'tutor-12', '鄭凱傑',
  '台大資管｜多益／商用英文與面試英文',
  '多益與外商面試英文，著重商務情境與簡報表達。內湖、南港可面授，亦可線上。',
  '/avatars/tutor-12.jpg',
  '國立臺灣大學 資訊管理學系',
  array['多益','商務英文','英文','面試']::text[],
  '外語學習', '台北市', '內湖區', '台北市內湖區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  920, true, 60, 9, '通常在 1 小時內回覆', 160, 4.8, 33, '熱門首選',
  'kaijie_toeic', '0911-445-778', 'kaijie.cheng@idaltu.tw', true, true
),
(
  'tutor-13', '蔡昕妤',
  '北藝大美術｜素描、插畫與作品集輔導',
  '素描基礎、數位插畫與升學作品集整理。台中西屯工作室面授，作品討論也可線上。',
  '/avatars/tutor-13.jpg',
  '國立臺北藝術大學 美術學系',
  array['美術','素描','插畫','作品集']::text[],
  '音樂藝術', '台中市', '西屯區', '台中市西屯區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  850, true, 45, 16, '通常在 1 小時內回覆', 120, 4.9, 24, '熱門首選',
  'hsinyu_art', '0987-221-334', 'hsinyu.tsai@idaltu.tw', true, true
),
(
  'tutor-14', '何俊緯',
  '成大外文｜韓文會話與 TOPIK',
  '韓語聽說與 TOPIK II 讀解寫作，適合想留學或追戲劇練聽力的學員。高雄可面授、全台線上。',
  '/avatars/tutor-14.jpg',
  '國立成功大學 外國語文學系',
  array['韓文','TOPIK','韓文會話','外語']::text[],
  '外語學習', '高雄市', '左營區', '高雄市左營區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  820, true, 60, 13, '通常在 1 小時內回覆', 140, 4.8, 28, '新星特選',
  'chunwei_kr', '0915-668-902', 'chunwei.ho@idaltu.tw', true, true
),
(
  'tutor-15', '楊子萱',
  '師大英語｜國中會考英文與會話',
  '會考英文閱讀聽力與口說練習，節奏清楚、作業精簡。桃園中壢可面授或線上。',
  '/avatars/tutor-15.jpg',
  '國立臺灣師範大學 英語學系',
  array['會考英文','國中英文','英文會話','聽力']::text[],
  '外語學習', '桃園市', '中壢區', '桃園市中壢區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  750, true, 60, 17, '通常在 1 小時內回覆', 210, 5.0, 45, '金牌導師',
  'tzuhsuan_eng', '0932-114-556', 'tzuhsuan.yang@idaltu.tw', true, true
),
(
  'tutor-16', '羅威廷',
  '北市大音樂｜吉他與烏克麗麗入門',
  '木吉他、烏克麗麗與自彈自唱入門，曲目從流行到民謠。三重、蘆洲可到府或咖啡廳。',
  '/avatars/tutor-16.jpg',
  '臺北市立大學 音樂學系',
  array['吉他','烏克麗麗','音樂','自彈自唱']::text[],
  '音樂藝術', '新北市', '三重區', '新北市三重區 / 面授', 'in-person',
  array['in_person','student_home']::text[],
  780, true, 30, 21, '通常在 1 小時內回覆', 95, 4.9, 18, '新星特選',
  'weiting_guitar', '0970-883-221', 'weiting.lo@idaltu.tw', true, true
),
(
  'tutor-17', '江品妍',
  '台大社會｜小論文與自主學習指導',
  '高中小論文架構、資料蒐集與口試練習；也陪自主學習歷程檔案。公館可面授、全台線上。',
  '/avatars/tutor-17.jpg',
  '國立臺灣大學 社會學系',
  array['小論文','自主學習','口試','寫作']::text[],
  '語文寫作', '台北市', '大安區', '台北市大安區 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  900, true, 45, 12, '通常在 1 小時內回覆', 88, 4.9, 21, '熱門首選',
  'pinyan_thesis', '0919-774-330', 'pinyan.chiang@idaltu.tw', true, true
),
(
  'tutor-18', '陳冠宇',
  '政大政治｜學測社會與公民素養',
  '學測社會科時事整合與公民論述，著重抓題幹與寫短論。新竹竹北可面授或線上。',
  '/avatars/tutor-18.jpg',
  '國立政治大學 政治學系',
  array['學測社會','公民','社會科','時事']::text[],
  '語文寫作', '新竹縣', '竹北市', '新竹縣竹北市 / 線上', 'hybrid',
  array['online','in_person','student_home']::text[],
  860, true, 60, 15, '通常在 1 小時內回覆', 105, 4.8, 26, '金牌導師',
  'kuanyu_social', '0926-441-178', 'kuanyu.chen@idaltu.tw', true, true
);
