// Страницы кабинета «Мой космос»: /kabinet/, /ro/kabinet/, /en/kabinet/ (noindex).
// Оболочка (шапка/подвал/шрифты) — как у журнала и страниц изделий; календарь «камень по дате» — из /assets/script.js через calData() журнала.
import { E, PFX, notFound, chromeParts } from "./pages.js";
import { calData, shell, FONTS, VERIFY } from "./journal.js";
import { CONSENT_VERSION } from "./kabinet.js";

const TX = {
  ru: {
    title: "Личный кабинет · Gemstone.md", mono: "Личный кабинет", h1: "Личный кабинет",
    lead: "Ваш камень по точной дате рождения, лунный ритм, личный дневник намерений — в одном месте.",
    qT: "Кабинет за 30 секунд", qSub: "Без почты и паролей: имя и данные рождения — и ваш камень, разборы и подборка уже здесь.", qNotify: "Куда присылать уведомления (необязательно)", qIg: "Ник в Instagram", qTg: "Ник в Telegram", qGo: "Открыть кабинет", qHave: "Уже были у нас? Вход по почте или через Telegram", qNeedName: "Как к вам обращаться?", loginT: "Вход", emailL: "Ваш e-mail", emailPh: "name@example.com", getCode: "Получить код", sending: "Отправляем…",
    codeSent: "Мы отправили код на", codeL: "Код из письма", resend: "Отправить ещё раз", resendIn: "Повторно через", sec: "с", change: "Другой e-mail", checking: "Проверяем…",
    or: "или", tgNote: "Для тех, кто общается с ботом @gemstone_md_bot",
    e_bad_email: "Проверьте адрес e-mail", e_too_soon: "Код уже отправлен — подождите минуту", e_rate: "Слишком много попыток, попробуйте позже", e_mail_unavailable: "Не удалось отправить письмо. Попробуйте позже",
    e_wrong_code: "Неверный код. Осталось попыток:", e_code_expired: "Код истёк или не запрашивался — запросите новый", e_locked: "Попытки исчерпаны — запросите новый код", e_server: "Что-то пошло не так. Попробуйте ещё раз", e_net: "Нет связи. Проверьте интернет",
    e_bad_hash: "Не удалось подтвердить вход через Telegram", e_tg_taken: "Этот Telegram уже привязан к другому аккаунту", e_replay: "Попробуйте войти через Telegram ещё раз", e_bad_date: "Проверьте дату рождения", e_bad_time: "Проверьте время рождения", e_consent_required: "Нужно согласие на обработку данных рождения",
    tabToday: "Сегодня", tabReadings: "Мои разборы", tabProfile: "Профиль", tabSvc: "Услуги", payMdl: "списание в леях:", curL: "Валюта цен", svcFull: "Полное имя (Ф. И. О.) для Кода Души", needFull: "Укажите полное имя — имя и фамилию.", needPlace: "Укажите место рождения.", stGen: "оплачено — разбор формируется", stErr: "оплачено — астролог проверяет", dl: "скачать PDF", aiT: "AI-консультант", aiLeft: "Осталось вопросов: ", aiPh: "Ваш вопрос о карте, отношениях, работе, камнях…", aiAsk: "Спросить", aiNo: "Вопросы закончились — закажите пакет ниже.", aiWait: "Консультант думает…", svcT: "Услуги астролога", svcSub: "Разборы готовит астролог Наталья. Оплата картой на сайте; готовый разбор появится в разделе «Мои разборы».", svcOrder: "Заказать", svcFor: "Для кого", svcMe: "Для меня", svcOther: "Для другого человека", svcOName: "Имя", svcContact: "Как с вами связаться", svcCom: "Пожелания (необязательно)", svcSend: "Перейти к оплате", svcOk: "Оплата получена. Астролог готовит ваш разбор — он появится здесь, мы также напишем вам.", svcWait: "Проверяем оплату…", svcFail: "Не удалось создать оплату. Попробуйте ещё раз или напишите нам.", svcPart: "Данные партнёра", svcPay: "Способ оплаты", payCard: "Картой Visa / Mastercard (в леях)", payRub: "Картой РФ (в рублях)", stPending: "ожидает оплаты", stPaid: "оплачено — готовится", stDone: "готово", payLink: "оплатить", fromBot: "Из Telegram-бота", needPartner: "Заполните дату рождения партнёра.", svcNeed: "Заполните дату рождения в профиле или для другого человека.", svcCancel: "Отмена",
    sv: [["natal_chart","Натальная карта","Полный разбор карты рождения: характер, предназначение, сильные стороны и ваши камни-усилители.",75],["forecast_month","Прогноз на месяц","Транзиты на 30 дней: благоприятные даты, риски, на что направить силы.",20],["forecast_year","Прогноз на год","Солярный разбор: главные темы года по месяцам и камни-поддержки.",50],["compatibility","Совместимость","Синастрия двух карт: сильные стороны пары и точки роста.",25],["soul_code","Код души","Нумерологический разбор по дате рождения: миссия, таланты, кармические задачи.",20]],
    hello: "Добрый день", stoneBirth: "Ваш камень · по дате рождения", stoneDay: "Камень дня · для всех", shop: "Изделия →",
    noBirth: "Добавьте дату рождения в профиле — покажем Ваш камень по точной дате, а не по знаку.", noBirthBtn: "Открыть профиль",
    moon: "Луна", age: "возраст Луны", days: "дн.", evNew: "Новолуние", evFull: "Полнолуние", evSol: "Солнцестояние / равноденствие", evNote: "Даты лунаций — по средней фазе (точность ±1 день).",
    moonN: ["Новолуние", "Растущий серп", "Первая четверть", "Растущая Луна", "Полнолуние", "Убывающая Луна", "Последняя четверть", "Старый серп"],
    rit: ["Новолуние: запишите одно намерение и держите камень в руке минуту.", "Растущий серп: сделайте один маленький шаг к намерению сегодня.", "Первая четверть: что мешает? Назовите и отпустите одно препятствие.", "Растущая Луна: время просить и предлагать.", "Полнолуние: поблагодарите за то, что уже сбылось, и отпустите лишнее.", "Убывающая Луна: наведите порядок — в вещах, делах, мыслях.", "Последняя четверть: подведите итог недели одной фразой.", "Старый серп: отдых и тишина. Ничего не начинайте — соберите силы."],
    ritT: "Ритуал дня · 2 минуты", intent: "Намерение на день", intentPh: "Сегодня я выбираю…", doneL: "Ритуал выполнен", save: "Записать", saved: "Записано", streak: "Последние 7 дней",
    readT: "Мои разборы", readEmpty: "Здесь будут Ваши разборы и заказы.", readNote: "Купленные разборы, прогнозы и статусы заказов появятся здесь — они не потеряются в переписке.",
    profT: "Профиль", name: "Как к Вам обращаться", bdate: "Дата рождения", btime: "Время рождения (если знаете)", bplace: "Место рождения", lang: "Язык", consent: "Я согласен(на) на обработку данных рождения (дата, время, место) для расчёта моего камня и разборов. Согласие можно отозвать — данные будут удалены.", consentV: "Версия согласия",
    saveP: "Сохранить", savedP: "Профиль сохранён", emailF: "E-mail", notSet: "не указан", tgF: "Telegram", tgLinked: "привязан", tgConnect: "Привязать Telegram", logout: "Выйти", del: "Удалить аккаунт", delQ: "Удалить аккаунт и все данные без возможности восстановления?", noCfg: "Кабинет скоро откроется",
  },
  ro: {
    title: "Cabinet personal · Gemstone.md", mono: "Cont personal", h1: "Cabinet personal",
    lead: "Piatra dvs. după data exactă a nașterii, ritmul lunar, jurnalul personal de intenții — într-un singur loc.",
    qT: "Cabinetul în 30 de secunde", qSub: "Fără e-mail și parole: numele și datele nașterii — și piatra, analizele și selecția sunt deja aici.", qNotify: "Unde să trimitem notificări (opțional)", qIg: "Nume Instagram", qTg: "Nume Telegram", qGo: "Deschide cabinetul", qHave: "Ați mai fost la noi? Intrare prin e-mail sau Telegram", qNeedName: "Cum să vă spunem?", loginT: "Autentificare", emailL: "E-mailul dvs.", emailPh: "name@example.com", getCode: "Primește codul", sending: "Se trimite…",
    codeSent: "Am trimis un cod la", codeL: "Codul din e-mail", resend: "Trimite din nou", resendIn: "Din nou peste", sec: "s", change: "Alt e-mail", checking: "Se verifică…",
    or: "sau", tgNote: "Pentru cei care folosesc botul @gemstone_md_bot",
    e_bad_email: "Verificați adresa de e-mail", e_too_soon: "Codul a fost deja trimis — așteptați un minut", e_rate: "Prea multe încercări, reveniți mai târziu", e_mail_unavailable: "Nu s-a putut trimite e-mailul. Încercați mai târziu",
    e_wrong_code: "Cod greșit. Încercări rămase:", e_code_expired: "Codul a expirat sau nu a fost cerut — cereți unul nou", e_locked: "Încercări epuizate — cereți un cod nou", e_server: "Ceva nu a mers. Încercați din nou", e_net: "Fără conexiune. Verificați internetul",
    e_bad_hash: "Nu s-a putut confirma autentificarea prin Telegram", e_tg_taken: "Acest Telegram este deja legat de alt cont", e_replay: "Încercați din nou prin Telegram", e_bad_date: "Verificați data nașterii", e_bad_time: "Verificați ora nașterii", e_consent_required: "Este necesar acordul pentru prelucrarea datelor nașterii",
    tabToday: "Astăzi", tabReadings: "Analizele mele", tabProfile: "Profil", tabSvc: "Servicii", payMdl: "debitare în lei:", curL: "Moneda prețurilor", svcFull: "Numele complet pentru Codul sufletului", needFull: "Indicați numele complet — prenume și nume.", needPlace: "Indicați locul nașterii.", stGen: "plătit — analiza se generează", stErr: "plătit — astrologul verifică", dl: "descarcă PDF", aiT: "Consultant AI", aiLeft: "Întrebări rămase: ", aiPh: "Întrebarea dvs. despre hartă, relații, muncă, pietre…", aiAsk: "Întreabă", aiNo: "Întrebările s-au terminat — comandați un pachet mai jos.", aiWait: "Consultantul se gândește…", svcT: "Serviciile astrologului", svcSub: "Analizele sunt pregătite de astrologul Natalia. Plata cu cardul pe site; analiza gata apare în «Analizele mele».", svcOrder: "Comandă", svcFor: "Pentru cine", svcMe: "Pentru mine", svcOther: "Pentru altă persoană", svcOName: "Nume", svcContact: "Cum vă contactăm", svcCom: "Dorințe (opțional)", svcSend: "Spre plată", svcOk: "Plata a fost primită. Astrologul pregătește analiza — va apărea aici.", svcWait: "Verificăm plata…", svcFail: "Plata nu a putut fi creată. Încercați din nou sau scrieți-ne.", svcPart: "Datele partenerului", svcPay: "Metoda de plată", payCard: "Card Visa / Mastercard (în lei)", payRub: "Card din Rusia (în ruble)", stPending: "așteaptă plata", stPaid: "plătit — în lucru", stDone: "gata", payLink: "plătește", fromBot: "Din botul Telegram", needPartner: "Completați data nașterii partenerului.", svcNeed: "Completați data nașterii în profil sau pentru cealaltă persoană.", svcCancel: "Anulează",
    sv: [["natal_chart","Harta natală","Analiza completă a hărții natale: caracter, menire, puncte forte și pietrele dvs.",75],["forecast_month","Prognoză pe lună","Tranzite pe 30 de zile: date favorabile, riscuri, unde să vă concentrați.",20],["forecast_year","Prognoză pe an","Analiza solară: temele anului pe luni și pietrele de sprijin.",50],["compatibility","Compatibilitate","Sinastria a două hărți: punctele forte ale cuplului și zonele de creștere.",25],["soul_code","Codul sufletului","Analiză numerologică după data nașterii: misiune, talente, sarcini karmice.",20]],
    hello: "Bună ziua", stoneBirth: "Piatra dvs. · după data nașterii", stoneDay: "Piatra zilei · pentru toți", shop: "Bijuterii →",
    noBirth: "Adăugați data nașterii în profil — vă arătăm piatra după data exactă, nu după zodie.", noBirthBtn: "Deschide profilul",
    moon: "Luna", age: "vârsta Lunii", days: "zile", evNew: "Lună nouă", evFull: "Lună plină", evSol: "Solstițiu / echinocțiu", evNote: "Datele lunațiilor sunt după faza medie (precizie ±1 zi).",
    moonN: ["Lună nouă", "Semilună crescândă", "Primul pătrar", "Lună crescândă", "Lună plină", "Lună descrescândă", "Ultimul pătrar", "Semilună veche"],
    rit: ["Lună nouă: scrieți o intenție și țineți piatra în mână un minut.", "Semilună crescândă: faceți azi un pas mic spre intenție.", "Primul pătrar: ce vă încurcă? Numiți și lăsați să plece un obstacol.", "Lună crescândă: timpul de a cere și de a oferi.", "Lună plină: mulțumiți pentru ce s-a împlinit și lăsați ce e de prisos.", "Lună descrescândă: faceți ordine — în lucruri, treburi, gânduri.", "Ultimul pătrar: rezumați săptămâna într-o frază.", "Semilună veche: odihnă și liniște. Nu începeți nimic — strângeți puteri."],
    ritT: "Ritualul zilei · 2 minute", intent: "Intenția zilei", intentPh: "Azi aleg…", doneL: "Ritual făcut", save: "Salvează", saved: "Salvat", streak: "Ultimele 7 zile",
    readT: "Analizele mele", readEmpty: "Aici vor apărea analizele și comenzile dvs.", readNote: "Analizele cumpărate, prognozele și starea comenzilor vor apărea aici — nu se pierd în conversații.",
    profT: "Profil", name: "Cum vă adresăm", bdate: "Data nașterii", btime: "Ora nașterii (dacă o știți)", bplace: "Locul nașterii", lang: "Limba", consent: "Sunt de acord cu prelucrarea datelor nașterii (data, ora, locul) pentru calculul pietrei mele și al analizelor. Acordul poate fi retras — datele vor fi șterse.", consentV: "Versiunea acordului",
    saveP: "Salvează", savedP: "Profil salvat", emailF: "E-mail", notSet: "nespecificat", tgF: "Telegram", tgLinked: "legat", tgConnect: "Leagă Telegram", logout: "Ieșire", del: "Șterge contul", delQ: "Ștergeți contul și toate datele, fără posibilitate de recuperare?", noCfg: "Contul se deschide în curând",
  },
  en: {
    title: "My account · Gemstone.md", mono: "Personal account", h1: "My account",
    lead: "Your stone by exact birth date, the lunar rhythm and a personal intention journal — all in one place.",
    qT: "Your account in 30 seconds", qSub: "No e-mail, no passwords: your name and birth details — and your stone, readings and picks are right here.", qNotify: "Where to send notifications (optional)", qIg: "Instagram username", qTg: "Telegram username", qGo: "Open my account", qHave: "Been here before? Sign in with e-mail or Telegram", qNeedName: "What should we call you?", loginT: "Sign in", emailL: "Your e-mail", emailPh: "name@example.com", getCode: "Get code", sending: "Sending…",
    codeSent: "We sent a code to", codeL: "Code from the email", resend: "Send again", resendIn: "Again in", sec: "s", change: "Another e-mail", checking: "Checking…",
    or: "or", tgNote: "For users of the @gemstone_md_bot bot",
    e_bad_email: "Please check the e-mail address", e_too_soon: "The code was already sent — please wait a minute", e_rate: "Too many attempts, try again later", e_mail_unavailable: "Could not send the email. Please try later",
    e_wrong_code: "Wrong code. Attempts left:", e_code_expired: "The code expired or was not requested — request a new one", e_locked: "Attempts used up — request a new code", e_server: "Something went wrong. Please try again", e_net: "No connection. Check your internet",
    e_bad_hash: "Could not confirm the Telegram sign-in", e_tg_taken: "This Telegram is already linked to another account", e_replay: "Please try the Telegram sign-in again", e_bad_date: "Please check the birth date", e_bad_time: "Please check the birth time", e_consent_required: "Consent to process birth data is required",
    tabToday: "Today", tabReadings: "My readings", tabProfile: "Profile", tabSvc: "Services", payMdl: "charged in MDL:", curL: "Price currency", svcFull: "Full name for the Soul code", needFull: "Enter your full name — first and last name.", needPlace: "Enter the birth place.", stGen: "paid — reading is being generated", stErr: "paid — the astrologer is checking", dl: "download PDF", aiT: "AI consultant", aiLeft: "Questions left: ", aiPh: "Your question about your chart, relationships, work, stones…", aiAsk: "Ask", aiNo: "No questions left — order a pack below.", aiWait: "The consultant is thinking…", svcT: "Astrologer services", svcSub: "Readings are prepared by astrologer Natalia. Pay by card on the site; the finished reading appears in «My readings».", svcOrder: "Order", svcFor: "For whom", svcMe: "For me", svcOther: "For someone else", svcOName: "Name", svcContact: "How to reach you", svcCom: "Wishes (optional)", svcSend: "Go to payment", svcOk: "Payment received. The astrologer is preparing your reading — it will appear here.", svcWait: "Checking payment…", svcFail: "Could not create the payment. Try again or write to us.", svcPart: "Partner's details", svcPay: "Payment method", payCard: "Visa / Mastercard (in MDL)", payRub: "Russian card (in RUB)", stPending: "awaiting payment", stPaid: "paid — in progress", stDone: "ready", payLink: "pay", fromBot: "From the Telegram bot", needPartner: "Add the partner's birth date.", svcNeed: "Add the birth date in your profile or for the other person.", svcCancel: "Cancel",
    sv: [["natal_chart","Natal chart","Full birth chart reading: character, purpose, strengths and your power stones.",75],["forecast_month","Monthly forecast","30-day transits: favourable dates, risks, where to focus.",20],["forecast_year","Yearly forecast","Solar return: the main themes of the year by month and support stones.",50],["compatibility","Compatibility","Synastry of two charts: the couple's strengths and growth points.",25],["soul_code","Soul code","Numerology by birth date: mission, talents, karmic tasks.",20]],
    hello: "Hello", stoneBirth: "Your stone · by birth date", stoneDay: "Stone of the day · for everyone", shop: "Jewellery →",
    noBirth: "Add your birth date in the profile — we will show your stone by the exact date, not by sign.", noBirthBtn: "Open profile",
    moon: "Moon", age: "Moon age", days: "d", evNew: "New moon", evFull: "Full moon", evSol: "Solstice / equinox", evNote: "Lunation dates use the mean phase (±1 day).",
    moonN: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
    rit: ["New moon: write one intention and hold your stone for a minute.", "Waxing crescent: take one small step toward your intention today.", "First quarter: what is in the way? Name one obstacle and let it go.", "Waxing moon: a time to ask and to offer.", "Full moon: give thanks for what has come true and release the excess.", "Waning moon: put things in order — belongings, tasks, thoughts.", "Last quarter: sum up the week in one sentence.", "Waning crescent: rest and silence. Start nothing — gather strength."],
    ritT: "Ritual of the day · 2 minutes", intent: "Intention for the day", intentPh: "Today I choose…", doneL: "Ritual done", save: "Save", saved: "Saved", streak: "Last 7 days",
    readT: "My readings", readEmpty: "Your readings and orders will appear here.", readNote: "Purchased readings, forecasts and order statuses will be kept here — not lost in a chat.",
    profT: "Profile", name: "What should we call you", bdate: "Birth date", btime: "Birth time (if known)", bplace: "Birth place", lang: "Language", consent: "I agree to the processing of my birth data (date, time, place) to calculate my stone and readings. Consent can be withdrawn — the data will be deleted.", consentV: "Consent version",
    saveP: "Save", savedP: "Profile saved", emailF: "E-mail", notSet: "not set", tgF: "Telegram", tgLinked: "linked", tgConnect: "Link Telegram", logout: "Sign out", del: "Delete account", delQ: "Delete the account and all data permanently?", noCfg: "The account area opens soon",
  },
};

const CSS = `
.kb{--paper:#ece8e1;--dim:#b9b4ab;--obs:#13161a;--obsd:#0a0c0e;--obss:#1c2126;--lab:#385a6b;--fl:#7fc3d6;--mute:#8c8880;--ln:rgba(236,232,225,.12);
font:300 16px/1.55 'Public Sans',system-ui,sans-serif;color:var(--paper);background:radial-gradient(1200px 600px at 80% -10%,rgba(56,90,107,.35),transparent 60%),var(--obsd);overflow-x:clip;padding:3.4rem 0 48px;min-height:80vh}
.kb *{box-sizing:border-box;margin:0;padding:0;min-width:0}
.kb-w{max-width:980px;margin:0 auto;padding:0 max(4vw,16px)}
.kb .k-mono{font:500 11px/1.4 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.kb h1{font:300 clamp(32px,7vw,54px)/1.05 'Newsreader',Georgia,serif;margin:16px 0 10px}
.kb h2{font:300 26px/1.15 'Newsreader',serif;margin:0 0 8px}
.kb h3{font:400 20px/1.2 'Newsreader',serif;margin-bottom:6px}
.kb .k-lead{color:var(--dim);max-width:560px}
.kb .k-card{background:linear-gradient(180deg,rgba(28,33,38,.92),rgba(19,22,26,.92));border:1px solid var(--ln);padding:20px;margin:14px 0}
.kb .k-grid{display:grid;gap:14px}@media(min-width:760px){.kb .k-grid.k-two{grid-template-columns:1fr 1fr}}
.kb .k-grid .k-card{margin:0}
.kb label{display:block;margin:14px 0 6px;color:var(--dim);font-size:14px}
.kb input:not([type=checkbox]),.kb textarea,.kb select{width:100%;background:var(--obsd);border:1px solid var(--ln);color:var(--paper);font:400 16px 'Public Sans',sans-serif;padding:13px 14px;border-radius:0;outline:none;color-scheme:dark}
.kb input:focus,.kb textarea:focus,.kb select:focus{border-color:var(--fl)}
.kb textarea{min-height:90px;resize:vertical}
.kb .k-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--fl);background:var(--fl);color:var(--obsd);font:500 15px 'Public Sans',sans-serif;padding:13px 20px;cursor:pointer;margin-top:16px;min-height:46px}
.kb .k-btn.k-ghost{background:transparent;color:var(--paper)}.kb .k-btn.k-full{width:100%}.kb .k-btn[disabled]{opacity:.5;cursor:default}
.kb .k-or{display:flex;align-items:center;gap:10px;margin:20px 0 4px;color:var(--mute);font-size:13px}.kb .k-or:before,.kb .k-or:after{content:"";flex:1;height:1px;background:var(--ln)}
.kb .k-note{font-size:13px;color:var(--mute);margin-top:8px}
.kb .k-err{color:#f0a6a0;font-size:14px;margin-top:10px;min-height:1px}
.kb .k-ok{color:var(--fl);font-size:14px;margin-top:10px}
.kb .k-scr{display:none}.kb .k-scr.k-on{display:block;animation:kbin .4s ease}
@keyframes kbin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.kb .k-codes{display:flex;gap:8px;margin-top:6px}.kb .k-codes input{width:100%;max-width:56px;text-align:center;font:400 24px 'IBM Plex Mono',monospace;padding:12px 0}
.kb .k-tabs{display:flex;gap:4px;border-bottom:1px solid var(--ln);margin:18px 0 8px;overflow-x:auto}
.kb .k-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--mute);font:500 14px 'Public Sans',sans-serif;padding:12px 14px;cursor:pointer;white-space:nowrap}
.kb .k-tabs button.k-on{color:var(--fl);border-color:var(--fl)}
.kb .k-stone{display:flex;gap:16px;align-items:center}
.kb .k-gem{width:96px;height:96px;flex:none;filter:drop-shadow(0 10px 28px rgba(127,195,214,.25))}
.kb .k-big{font:300 34px/1.05 'Newsreader',serif;margin:6px 0;overflow-wrap:anywhere}
.kb .k-acc{color:var(--fl)}
.kb .k-moon{width:60px;height:60px;border-radius:50%;background:#2b3036;position:relative;overflow:hidden;flex:none;box-shadow:inset 0 0 12px rgba(0,0,0,.6)}
.kb .k-ev{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--ln);font-size:15px}.kb .k-ev span:last-child{color:var(--dim);white-space:nowrap}
.kb .k-streak{display:flex;gap:6px;margin-top:12px}.kb .k-streak i{width:22px;height:22px;border:1px solid var(--ln);display:block}.kb .k-streak i.f{background:var(--lab);border-color:var(--fl)}
.kb .k-entry{font-size:14px;color:var(--dim);padding:8px 0;border-top:1px dashed var(--ln);overflow-wrap:anywhere}
.kb .k-chk{display:flex;gap:10px;align-items:flex-start;margin:14px 0 0;color:var(--paper);font-size:14px}.kb .k-chk input{width:20px;height:20px;flex:none;margin-top:2px;accent-color:#7fc3d6}
.kb .k-row{display:flex;gap:10px;flex-wrap:wrap}
.kb .k-kv{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--ln);font-size:15px}.kb .k-kv span:last-child{color:var(--dim);overflow-wrap:anywhere;text-align:right}
.kb a{color:var(--fl)}
.kb .k-linkbtn{background:none;border:0;color:var(--mute);text-decoration:underline;cursor:pointer;font:inherit;font-size:13px;margin-top:18px;padding:6px 0}
`;

// Клиентская часть: данные берёт из <script id="kd">. Выполняется в браузере.
function client() {
  var D = JSON.parse(document.getElementById("kd").textContent), T = D.t, $ = function (i) { return document.getElementById(i); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ME = null, email = "", tick = null;
  function api(method, path, body) {
    var o = { method: method, headers: {}, credentials: "same-origin" };
    if (body !== undefined) { o.headers["content-type"] = "application/json"; o.body = JSON.stringify(body); }
    return fetch(path, o).then(function (r) { return r.json().catch(function () { return { ok: false, error: "server" }; }).then(function (j) { j.status = r.status; return j; }); }, function () { return { ok: false, error: "net", status: 0 }; });
  }
  function errText(j) { var m = T["e_" + j.error] || T.e_server; if (j.error === "wrong_code") m += " " + j.left; return m; }
  function show(id) { document.querySelectorAll(".kb .k-scr").forEach(function (s) { s.classList.toggle("k-on", s.id === "s-" + id); }); }
  /* ── вход ── */
  function step(n) { $("st-email").style.display = n === 1 ? "" : "none"; $("st-code").style.display = n === 2 ? "" : "none"; }
  function startTimer(sec) {
    clearInterval(tick); var b = $("resend"); b.disabled = true;
    var t = sec; b.textContent = T.resendIn + " " + t + " " + T.sec;
    tick = setInterval(function () { t--; if (t <= 0) { clearInterval(tick); b.disabled = false; b.textContent = T.resend; } else b.textContent = T.resendIn + " " + t + " " + T.sec; }, 1000);
  }
  function sendCode() {
    var v = $("em").value.trim().toLowerCase(); $("e1").textContent = "";
    if (!/^\S+@\S+\.\S+$/.test(v)) { $("e1").textContent = T.e_bad_email; return; }
    var b = $("getc"); b.disabled = true; b.textContent = T.sending;
    api("POST", "/api/auth/email/start", { email: v, lang: D.l }).then(function (j) {
      b.disabled = false; b.textContent = T.getCode;
      if (!j.ok) { $("e1").textContent = errText(j); return; }
      email = v; $("sentTo").textContent = v; step(2); clearCodes(); startTimer(60);
      document.querySelector("#codes input").focus();
    });
  }
  function clearCodes() { document.querySelectorAll("#codes input").forEach(function (i) { i.value = ""; }); $("e2").textContent = ""; }
  function submitCode() {
    var inp = document.querySelectorAll("#codes input"), c = ""; inp.forEach(function (i) { c += i.value; });
    if (c.length !== 6) return; $("e2").textContent = T.checking;
    api("POST", "/api/auth/email/verify", { email: email, code: c, lang: D.l }).then(function (j) {
      if (!j.ok) { clearCodes(); $("e2").textContent = errText(j); inp[0].focus(); return; }
      boot();
    });
  }
  function initCodes() {
    var box = $("codes"), h = "";
    for (var k = 0; k < 6; k++) h += '<input inputmode="numeric" maxlength="1" autocomplete="' + (k ? "off" : "one-time-code") + '" aria-label="' + (k + 1) + '">';
    box.innerHTML = h;
    var inp = box.querySelectorAll("input");
    inp.forEach(function (el, k) {
      el.addEventListener("input", function () { el.value = el.value.replace(/\D/g, "").slice(-1); if (el.value && k < 5) inp[k + 1].focus(); if (k === 5 && el.value) submitCode(); });
      el.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !el.value && k > 0) { inp[k - 1].focus(); inp[k - 1].value = ""; } });
      el.addEventListener("paste", function (e) {
        var d = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6); if (!d) return; e.preventDefault();
        for (var q = 0; q < 6; q++) inp[q].value = d[q] || ""; (inp[Math.min(d.length, 5)]).focus(); if (d.length === 6) submitCode();
      });
    });
  }
  /* ── Telegram Login Widget ── */
  window.gsTg = function (u) {
    var body = {}; for (var k in u) body[k] = u[k]; body.lang = D.l; if (ME) body.link = true;
    api("POST", "/api/auth/telegram", body).then(function (j) {
      if (!j.ok) { (ME ? $("eP") : $("e1")).textContent = errText(j); return; }
      boot();
    });
  };
  function tgWidget(host) {
    if (!D.tg || !host) return; host.innerHTML = "";
    var s = document.createElement("script"); s.async = true; s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.setAttribute("data-telegram-login", D.tg); s.setAttribute("data-size", "large"); s.setAttribute("data-radius", "0"); s.setAttribute("data-request-access", "write"); s.setAttribute("data-auth-url", location.origin + "/api/auth/telegram/cb?lang=" + encodeURIComponent(D.l) + (ME ? "&link=1" : ""));
    host.appendChild(s);
  }
  /* ── камень по дате ── */
  function stoneFor(dd, mm) {
    var c = D.cal[mm - 1] && D.cal[mm - 1].charAt(dd - 1); if (!c) return null;
    var i = c === c.toUpperCase() ? c.charCodeAt(0) - 65 : c.charCodeAt(0) - 97 + 26;
    if (!D.st[i]) return null; return { i: i, n: D.st[i][0], p: D.st[i][1], q: D.st[i][2], d: D.sd[i] };
  }
  function hueOf(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return 197;
    var n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = Math.round(h * 60); if (h < 0) h += 360; }
    return d < 0.05 ? 197 : h;
  }
  function gem(svg, st) {
    var h = 197; try { var t = window.GS_MIN && window.GS_MIN.tint && window.GS_MIN.tint(D.ru[st.i]); if (t && t.hex) h = hueOf(t.hex); } catch (e) { }
    var id = "g" + svg.id;
    svg.innerHTML = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + h + ',55%,72%)"/><stop offset=".55" stop-color="hsl(' + h + ',45%,38%)"/><stop offset="1" stop-color="hsl(' + h + ',50%,16%)"/></linearGradient></defs><polygon points="50,6 84,30 72,92 28,92 16,30" fill="url(#' + id + ')"/><polygon points="50,6 62,34 50,92 38,34" fill="rgba(255,255,255,.14)"/><polygon points="16,30 38,34 28,92" fill="rgba(0,0,0,.25)"/><polygon points="84,30 62,34 72,92" fill="rgba(255,255,255,.07)"/><polyline points="16,30 38,34 50,6 62,34 84,30" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".6"/>';
  }
  /* ── луна (средняя фаза) ── */
  var SYN = 29.530588853;
  function moonAge(t) { var ref = Date.UTC(2000, 0, 6, 18, 14); return (((t - ref) / 864e5) % SYN + SYN) % SYN; }
  function fmtD(t) { try { return new Date(t).toLocaleDateString(D.l === "ru" ? "ru-RU" : D.l === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "long" }); } catch (e) { return new Date(t).toDateString(); } }
  function moonUI() {
    var now = Date.now(), a = moonAge(now), L = [1.5, 6.4, 8.4, 13.8, 15.8, 21.1, 23.1, 28], ph = 0;
    for (var k = 0; k < 8; k++) if (a < L[k]) { ph = k; break; }
    $("moonT").textContent = T.moonN[ph]; $("moonA").textContent = T.age + " " + a.toFixed(1) + " " + T.days; $("ritTxt").textContent = T.rit[ph];
    var lit = (1 - Math.cos(2 * Math.PI * a / SYN)) / 2, wax = a < SYN / 2;
    $("moon").innerHTML = '<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at ' + (wax ? 70 : 30) + '% 45%,#ece8e1,#b9b4ab 70%);clip-path:inset(0 ' + (wax ? 0 : (1 - lit) * 100) + '% 0 ' + (wax ? (1 - lit) * 100 : 0) + '%)"></div>';
    var nNew = now + (SYN - a) * 864e5, nFull = now + (((SYN / 2 - a) + SYN) % SYN) * 864e5;
    var sol = [Date.UTC(2026, 11, 21, 12), Date.UTC(2027, 2, 20, 12), Date.UTC(2027, 5, 21, 12), Date.UTC(2027, 8, 23, 12), Date.UTC(2027, 11, 21, 12)].filter(function (x) { return x > now; })[0];
    var ev = [[T.evNew, nNew], [T.evFull, nFull], [T.evSol, sol]].sort(function (x, y) { return x[1] - y[1]; });
    $("evs").innerHTML = ev.map(function (e) { return '<div class="k-ev"><span>' + esc(e[0]) + "</span><span>≈ " + esc(fmtD(e[1])) + "</span></div>"; }).join("");
  }
  /* ── сегодня ── */
  function ymd(t) { var d = new Date(t); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  var JR = [];
  function todayUI() {
    var now = new Date(), a = ME;
    $("hello").textContent = T.hello + (a.name ? ", " + a.name : "");
    var md = null;
    if (a.birth_date) { var p = a.birth_date.split("-"); md = stoneFor(+p[2], +p[1]); }
    if (md) {
      $("myBox").style.display = ""; $("noBirth").style.display = "none";
      $("myS").textContent = md.n; $("myP").textContent = md.p; $("myQ").textContent = md.q; $("myD").textContent = md.d; gem($("gem1"), md);
    } else { $("myBox").style.display = "none"; $("noBirth").style.display = ""; }
    var t = stoneFor(now.getDate(), now.getMonth() + 1);
    if (t) { $("dayS").textContent = t.n; $("dayP").textContent = t.p; $("dayD").textContent = t.d; gem($("gem2"), t); }
    moonUI(); jrUI();
  }
  function jrUI() {
    var days = {}, today = ymd(Date.now()), cur = null;
    JR.forEach(function (e) { days[e.day] = e; if (e.day === today) cur = e; });
    var h = ""; for (var i = 6; i >= 0; i--) { var d = ymd(Date.now() - i * 864e5); h += '<i class="' + (days[d] ? "f" : "") + '" title="' + d + '"></i>'; }
    $("streak").innerHTML = h;
    if (cur && document.activeElement !== $("jt")) { $("jt").value = cur.text; $("jdone").checked = cur.ritual; }
    $("jl").innerHTML = JR.filter(function (e) { return e.day !== today && e.text; }).slice(0, 3).map(function (e) { return '<div class="k-entry">' + esc(e.day) + " — " + esc(e.text) + "</div>"; }).join("");
  }
  function saveJr() {
    $("jmsg").textContent = "";
    api("PUT", "/api/me/journal", { day: ymd(Date.now()), text: $("jt").value, ritual: $("jdone").checked }).then(function (j) {
      if (!j.ok) { $("jmsg").className = "k-err"; $("jmsg").textContent = j.error === "empty" ? "" : errText(j); return; }
      JR = j.entries; $("jmsg").className = "k-ok"; $("jmsg").textContent = T.saved; jrUI();
    });
  }
  /* ── профиль ── */
  function profUI() { try { $("pig").value = ME.instagram || ""; $("ptg").value = ME.telegram || ""; $("pcur").value = ME.currency || localStorage.getItem("gs_cur") || (D.l === "ru" ? "MDL" : "EUR"); if (ME.currency) { localStorage.setItem("gs_cur", ME.currency); CUR0 = ME.currency; } } catch (x) {}
    var a = ME; $("pn").value = a.name; $("pd").value = a.birth_date; $("pt").value = a.birth_time; $("pp").value = a.birth_place; $("pl").value = a.lang;
    $("pc").checked = !!a.consent; $("pcv").textContent = T.consentV + ": " + (a.consent || D.cv);
    $("pEmail").textContent = a.email || T.notSet;
    $("pTg").textContent = a.tg ? T.tgLinked + (a.tg.username ? " · @" + a.tg.username : "") : "—";
    var tb = $("tgLink"); tb.style.display = D.tg && !a.tg ? "" : "none"; if (D.tg && !a.tg && !tb.firstChild) tgWidget(tb);
  }
  function saveProfile() {
    $("eP").textContent = ""; $("mP").textContent = "";
    var consent = $("pc").checked, had = !!ME.consent;
    var body = { name: $("pn").value, lang: $("pl").value, birth_date: $("pd").value, birth_time: $("pt").value, birth_place: $("pp").value, instagram: $("pig").value, telegram: $("ptg").value, currency: $("pcur").value };
    if (consent) body.consent = true; else if (had) body.consent = false;
    api("PUT", "/api/me", body).then(function (j) {
      if (!j.ok) { $("eP").textContent = errText(j); return; }
      var langChanged = j.account.lang !== D.l; ME = j.account;
      if (langChanged) { location.href = (j.account.lang === "ru" ? "" : "/" + j.account.lang) + "/kabinet/#profile"; return; }
      $("mP").textContent = T.savedP; profUI(); todayUI(); svcUI();
    });
  }
  /* ── услуги: цены из справочника бота (/api/me/prices), оплата PayNet (лей) / WATA (₽) на сайте ── */
  var SV = T.sv || [], PR = {}, WATA = false, SEL = null, CUR0 = (function () { try { return localStorage.getItem("gs_cur"); } catch (x) { return null; } })();
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function curSel() { var c = ["MDL", "EUR", "RUB"].indexOf(CUR0) >= 0 ? CUR0 : (D.l === "ru" ? "MDL" : "EUR"); return c === "RUB" && !WATA ? "MDL" : c; }
  function svPrice(k) { var p = PR[k]; if (!p) return "";
    var c = curSel();
    if (c === "RUB" && p.rub) return p.rub.toLocaleString("ru-RU") + " ₽"; if (c === "EUR") return p.eur + " €"; return p.mdl + " lei"; }
  function svcUI() { var h = ""; SV.forEach(function (v, i) { if (!PR[v[0]]) return; h += '<div class="k-card"><h3>' + esc(v[1]) + '</h3><div class="k-acc">' + svPrice(v[0]) + '</div><p class="k-note">' + esc(v[2]) + '</p><button class="k-btn" type="button" data-sv="' + i + '">' + esc(T.svcOrder) + '</button></div>'; });
    $("svcList").innerHTML = h;
    $("svcList").querySelectorAll("[data-sv]").forEach(function (b) { b.onclick = function () { SEL = SV[+b.dataset.sv]; var p = PR[SEL[0]] || {};
      $("sfT").textContent = SEL[1]; $("sfP").textContent = svPrice(SEL[0]); $("sfE").textContent = ""; $("sfOk").textContent = "";
      $("sfP2").style.display = SEL[0] === "compatibility" ? "" : "none"; $("sfF").style.display = SEL[0] === "soul_code" ? "" : "none";
      var cc = curSel(), rub = WATA && cc === "RUB" && p.rub;
      $("pyC").parentNode.style.display = rub ? "none" : ""; $("pyR").parentNode.style.display = rub ? "" : "none";
      $("pyC").textContent = T.payCard.replace(/\s*\(.*\)$/, "") + (cc === "EUR" ? " — " + T.payMdl + " " + p.mdl + " lei" : "");
      $("pyR").textContent = T.payRub.replace(/\s*\(.*\)$/, "");
      document.querySelector('input[name="sfpay"][value="' + (rub ? "wata" : "paynet") + '"]').checked = true;
      $("svcForm").style.display = ""; $("svcForm").scrollIntoView({ behavior: "smooth" }); }; }); }
  function loadPrices() { api("GET", "/api/me/prices").then(function (j) { if (j.ok) { PR = j.prices; WATA = !!j.wata; svcUI(); } }); }
  document.querySelectorAll('input[name="sfw"]').forEach(function (r) { r.onchange = function () { $("sfO").style.display = document.querySelector('input[name="sfw"]:checked').value === "other" ? "" : "none"; }; });
  $("sfX").onclick = function () { $("svcForm").style.display = "none"; };
  $("sfSend").onclick = function () { if (!SEL) return; var other = document.querySelector('input[name="sfw"]:checked').value === "other";
    var p1 = { name: $("soN").value, birth_date: $("soD").value, birth_time: $("soT").value, birth_place: $("soP").value };
    var p2 = { name: $("s2N").value, birth_date: $("s2D").value, birth_time: $("s2T").value, birth_place: $("s2P").value };
    if (SEL[0] !== "ai_consultant" && !(other ? p1.birth_date : ME && ME.birth_date)) { $("sfE").textContent = T.svcNeed; return; }
    if (SEL[0] === "compatibility" && !p2.birth_date) { $("sfE").textContent = T.needPartner; return; }
    $("sfSend").disabled = true; $("sfE").textContent = "";
    if (SEL[0] === "soul_code" && !other && $("sfFull").value.trim().split(/\s+/).length < 2) { $("sfE").textContent = T.needFull; $("sfSend").disabled = false; return; }
    api("POST", "/api/me/pay", { full_name: $("sfFull").value, service: SEL[0], provider: document.querySelector('input[name="sfpay"]:checked').value, for: other ? "other" : "me", p1: p1, p2: p2, comment: $("sfM").value, lang: D.l })
      .then(function (j) { if (j.ok && j.url) { location.href = j.url; return; } $("sfSend").disabled = false;
        $("sfE").textContent = j.error === "need_birth" ? T.svcNeed : j.error === "need_partner" ? T.needPartner : j.error === "need_fullname" ? T.needFull : j.error === "need_place" ? T.needPlace : T.svcFail; }); };
  function aiUI() { api("GET", "/api/me/ai").then(function (j) { if (!j.ok) return; if (!j.left && !(j.history || []).length) { $("aiBox").style.display = "none"; return; }
    $("aiBox").style.display = ""; $("aiLeft").textContent = j.left ? T.aiLeft + j.left : T.aiNo; $("aiGo").disabled = !j.left;
    $("aiHist").innerHTML = (j.history || []).slice().reverse().map(function (x) { return '<div class="k-note" style="margin-top:12px"><b>' + esc(x.q) + '</b></div><div style="margin-top:6px;font-size:15px">' + String(x.a || "").replace(/<(?!\/?(b|i|u|br)\b)[^>]*>/g, "").replace(/\n/g, "<br>") + '</div>'; }).join(""); }); }
  $("aiGo").onclick = function () { var q = $("aiQ").value.trim(); if (q.length < 3) return; $("aiGo").disabled = true; $("aiE").textContent = T.aiWait;
    api("POST", "/api/me/ai", { question: q, lang: D.l }).then(function (j) { $("aiE").textContent = j.ok ? "" : (j.error === "no_credits" ? T.aiNo : T.svcFail); if (j.ok) $("aiQ").value = ""; aiUI(); }); };
  function ordersUI() { api("GET", "/api/me/orders").then(function (j) { if (!j.ok) return; var h = "", nm = {}; SV.forEach(function (v) { nm[v[0]] = v[1]; });
    var st = { pending: T.stPending, paid: T.stPaid, done: T.stDone, completed: T.stDone, generating: T.stGen, gen_error: T.stErr };
    var dt = function (x) { var d = typeof x === "number" ? new Date(x) : new Date(String(x || "").replace(" ", "T")); return isNaN(d) ? "" : d.toLocaleDateString(D.l === "en" ? "en-GB" : D.l); };
    (j.site || []).forEach(function (o) { h += '<div class="k-kv"><span>' + esc(nm[o.service] || o.service) + ' · ' + dt(o.created_at) + '</span><span>' + esc(st[o.status] || o.status) + (o.pay_url ? ' · <a href="' + esc(o.pay_url) + '">' + esc(T.payLink) + '</a>' : '') + (o.status === "done" && o.service !== "ai_consultant" ? ' · <a href="/api/me/report?id=' + o.id + '">' + esc(T.dl) + '</a>' : '') + '</span></div>'; });
    if ((j.bot || []).length) { h += '<div class="k-mono" style="margin-top:14px">' + esc(T.fromBot) + '</div>';
      j.bot.forEach(function (o) { h += '<div class="k-kv"><span>' + esc(nm[o.service_type] || o.service_type) + ' · ' + dt(o.paid_at || o.created_at) + '</span><span>' + esc(st[o.status] || o.status) + '</span></div>'; }); }
    $("rdList").innerHTML = h; $("rdEmpty").style.display = h ? "none" : ""; }); }
  (function () { var q = new URLSearchParams(location.search), id = parseInt(q.get("paid"), 10); if (!id) return;
    var n = 0; $("rdMsg").textContent = T.svcWait;
    (function poll() { api("GET", "/api/me/pay/status?id=" + id).then(function (j) {
      if (j.ok && j.status !== "pending" && j.status !== "creating") { $("rdMsg").textContent = T.svcOk; ordersUI(); aiUI(); try { history.replaceState(null, "", location.pathname + "#readings"); } catch (x) {} return; }
      if (++n < 12) setTimeout(poll, 10000); else { $("rdMsg").textContent = ""; ordersUI(); } }); })(); })();
  /* ── админ: справочник цен услуг (лей / € / ₽ хранятся отдельно) ── */
  function admUI() { if (!ME || !ME.admin) return; $("tabPrices").style.display = "";
    api("GET", "/api/me/admin/prices").then(function (j) { if (!j.ok) return; var nm = {}; SV.forEach(function (v) { nm[v[0]] = v[1]; });
      $("admRows").innerHTML = j.prices.map(function (x) { return '<div style="margin-top:10px"><b>' + esc(nm[x.k] || x.k) + '</b><div class="k-row" style="gap:6px;flex-wrap:wrap">' +
        ['mdl', 'eur', 'rub'].map(function (c) { return '<label style="font-size:12px">' + c.toUpperCase() + ' <input data-k="' + x.k + '" data-c="' + c + '" type="number" min="0" step="0.01" value="' + (x[c] == null ? "" : x[c]) + '" style="width:96px"></label>'; }).join("") +
        '<label class="k-chk" style="margin:0"><input type="checkbox" data-k="' + x.k + '" data-c="active"' + (x.active ? " checked" : "") + '><span>в продаже</span></label></div></div>'; }).join(""); }); }
  $("admSave").onclick = function () { var b = {}; document.querySelectorAll("#admRows input").forEach(function (i) { var k = i.dataset.k; b[k] = b[k] || {}; b[k][i.dataset.c] = i.type === "checkbox" ? i.checked : i.value; });
    api("PUT", "/api/me/admin/prices", b).then(function (j) { $("admMsg").textContent = j.ok ? "Сохранено — цены на сайте обновлены." : "Ошибка: " + (j.key || j.error); if (j.ok) { admUI(); loadPrices(); } }); };
  /* ── быстрая регистрация ── */
  (function () { var q = new URLSearchParams(location.search), bd = q.get("bd"), m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(bd || "");
    if (m) $("qd").value = m[3] + "-" + m[2] + "-" + m[1]; })();
  $("qgo").onclick = function () {
    if (!$("qn").value.trim()) { $("eQ").textContent = T.qNeedName; return; }
    if (!$("qd").value) { $("eQ").textContent = T.svcNeed; return; }
    if (!$("qc").checked) { $("eQ").textContent = errText({ error: "consent_required" }); return; }
    $("qgo").disabled = true;
    api("POST", "/api/auth/quick", { name: $("qn").value, birth_date: $("qd").value, birth_time: $("qt").value, birth_place: $("qp").value, instagram: $("qig").value, telegram: $("qtg").value, consent: true, lang: D.l, currency: (function () { try { return localStorage.getItem("gs_cur"); } catch (x) { return null; } })() })
      .then(function (j) { $("qgo").disabled = false; if (!j.ok) { $("eQ").textContent = errText(j); return; } try { history.replaceState(null, "", location.pathname + "#today"); } catch (x) {} boot(); }); };
  /* ── экраны и запуск ── */
  function go(name) {
    document.querySelectorAll(".kb .k-pane").forEach(function (p) { p.style.display = p.id === "p-" + name ? "" : "none"; });
    document.querySelectorAll(".kb .k-tabs button").forEach(function (b) { b.classList.toggle("k-on", b.dataset.go === name); });
    if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  }
  function boot() {
    api("GET", "/api/me").then(function (j) {
      if (!j.ok) { ME = null; try { localStorage.removeItem("gs_in"); } catch (x) {} show("login"); step(1); tgWidget($("tgLogin")); return; }
      ME = j.account; try { localStorage.setItem("gs_in", "1"); } catch (x) {} show("app"); profUI(); loadPrices(); ordersUI(); aiUI(); admUI();
      api("GET", "/api/me/journal").then(function (r) { JR = r.ok ? r.entries : []; todayUI(); });
      var h = location.hash.slice(1); go(["today", "services", "readings", "profile", "prices"].indexOf(h) >= 0 ? h : "today");
    });
  }
  $("getc").onclick = sendCode;
  $("em").addEventListener("keydown", function (e) { if (e.key === "Enter") sendCode(); });
  $("resend").onclick = function () { api("POST", "/api/auth/email/start", { email: email, lang: D.l }).then(function (j) { if (!j.ok) { $("e2").textContent = errText(j); return; } clearCodes(); startTimer(60); }); };
  $("chg").onclick = function () { clearInterval(tick); step(1); };
  $("jsave").onclick = saveJr; $("psave").onclick = saveProfile;
  $("goProf").onclick = function () { go("profile"); };
  $("logout").onclick = function () { api("POST", "/api/auth/logout", {}).then(function () { ME = null; show("login"); step(1); history.replaceState(null, "", location.pathname); tgWidget($("tgLogin")); }); };
  $("delacc").onclick = function () { if (confirm(T.delQ)) api("POST", "/api/me/delete", {}).then(function () { ME = null; show("login"); step(1); history.replaceState(null, "", location.pathname); tgWidget($("tgLogin")); }); };
  document.querySelectorAll(".kb .k-tabs button").forEach(function (b) { b.onclick = function () { go(b.dataset.go); window.scrollTo(0, 0); }; });
  initCodes(); boot();
  // результат входа через Telegram (режим перенаправления): ?tg=<ошибка> — показываем текст, адрес очищаем
  (function () { var q = new URLSearchParams(location.search), e = q.get("tg"); if (!e) return;
    if (e !== "linked") setTimeout(function () { var x = $("e1") || $("eP"); if (x) x.textContent = errText({ error: e }); }, 400);
    try { history.replaceState(null, "", location.pathname); } catch (x) {} })();
}

export async function handleKabinet(request, env, ctx) {
  const url = new URL(request.url);
  const m = /^(\/ro|\/en)?\/kabinet(\/?)$/.exec(url.pathname);
  if (!m || !env.APP_DB) return notFound(env, url.origin);
  if (!m[2]) return Response.redirect(url.origin + url.pathname + "/" + url.search, 301);
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  const l = m[1] ? m[1].slice(1) : "ru", t = TX[l], path = "/kabinet/";
  try {
    const [cd, ch] = await Promise.all([calData(env, url.origin), chromeParts(env, url.origin, l)]);
    const sh = shell(ch, l, path);
    const data = {
      l, t, cal: cd.cal, st: cd["st_" + l], sd: cd["sd_" + l], ru: cd.st_ru.map((x) => x[0]),
      tg: env.TG_BOT_TOKEN && env.TG_LOGIN_BOT ? String(env.TG_LOGIN_BOT).replace(/^@/, "") : null, cv: CONSENT_VERSION,
    };
    const dj = JSON.stringify(data).replace(/</g, "\\u003c").replace(new RegExp("\\u2028", "g"), "\\u2028").replace(new RegExp("\\u2029", "g"), "\\u2029");
    const canon = `${url.origin}${PFX[l]}${path}`;
    const html = `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${E(t.title)}</title>
<meta name="robots" content="noindex,nofollow,noarchive">
<link rel="canonical" href="${canon}">
${FONTS}
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/styles.css">
<style>${CSS}</style>
${VERIFY}
</head>
<body class="no-bar">
${sh.top}
<main class="kb" id="kb"><div class="kb-w">
<section class="k-scr k-on" id="s-login">
  <div class="k-mono">${E(t.mono)}</div>
  <h1>${E(t.h1)}</h1>
  <p class="k-lead">${E(t.lead)}</p>
  <div class="k-card" id="qCard"><h3>${E(t.qT)}</h3><p class="k-note">${E(t.qSub)}</p>
    <label for="qn">${E(t.name)}</label><input id="qn" maxlength="60" autocomplete="given-name">
    <label for="qd">${E(t.bdate)}</label><input id="qd" type="date" min="1900-01-01" autocomplete="bday">
    <label for="qt">${E(t.btime)}</label><input id="qt" type="time">
    <label for="qp">${E(t.bplace)}</label><input id="qp" maxlength="100">
    <div class="k-mono" style="margin-top:12px">${E(t.qNotify)}</div>
    <label for="qig">${E(t.qIg)}</label><input id="qig" maxlength="40" placeholder="@">
    <label for="qtg">${E(t.qTg)}</label><input id="qtg" maxlength="40" placeholder="@">
    <label class="k-chk"><input type="checkbox" id="qc"><span>${E(t.consent)}</span></label>
    <button class="k-btn k-full" id="qgo" type="button">${E(t.qGo)}</button><div class="k-err" id="eQ" role="alert"></div></div>
  <div class="k-card" style="margin-top:14px">
    <h3>${E(t.qHave)}</h3>
    <div id="st-email">
      <label for="em">${E(t.emailL)}</label>
      <input id="em" type="email" inputmode="email" autocomplete="email" placeholder="${E(t.emailPh)}" maxlength="254">
      <button class="k-btn k-full" id="getc" type="button">${E(t.getCode)}</button>
      <div class="k-err" id="e1" role="alert"></div>
      ${data.tg ? `<div class="k-or">${E(t.or)}</div><div id="tgLogin" style="margin-top:12px;min-height:40px"></div><p class="k-note">${E(t.tgNote)}</p>` : ""}
    </div>
    <div id="st-code" style="display:none">
      <p class="k-note" style="margin-top:6px">${E(t.codeSent)} <b id="sentTo" style="color:var(--paper);overflow-wrap:anywhere"></b></p>
      <label>${E(t.codeL)}</label>
      <div class="k-codes" id="codes"></div>
      <div class="k-err" id="e2" role="alert"></div>
      <div class="k-row"><button class="k-btn k-ghost" id="resend" type="button" disabled></button><button class="k-btn k-ghost" id="chg" type="button">${E(t.change)}</button></div>
    </div>
  </div>
</section>
<section class="k-scr" id="s-app">
  <div class="k-mono" id="hello"></div>
  <h1>${E(t.h1)}</h1>
  <div class="k-tabs" role="tablist"><button type="button" data-go="today">${E(t.tabToday)}</button><button type="button" data-go="services">${E(t.tabSvc)}</button><button type="button" data-go="readings">${E(t.tabReadings)}</button><button type="button" data-go="profile">${E(t.tabProfile)}</button><button type="button" data-go="prices" id="tabPrices" style="display:none">Цены</button></div>
  <div class="k-pane" id="p-today">
    <div class="k-grid k-two">
      <div class="k-card"><div class="k-mono">${E(t.stoneBirth)}</div>
        <div id="myBox" style="display:none"><div class="k-stone"><svg class="k-gem" id="gem1" viewBox="0 0 100 100" aria-hidden="true"></svg><div><div class="k-big" id="myS"></div><div class="k-acc" id="myP"></div><div class="k-note" id="myQ"></div></div></div><p style="margin-top:12px;font-size:15px;color:var(--dim)" id="myD"></p><a class="k-btn k-ghost" href="${PFX[l]}/shop/">${E(t.shop)}</a></div>
        <div id="noBirth"><p style="margin-top:10px;color:var(--dim)">${E(t.noBirth)}</p><button class="k-btn k-ghost" id="goProf" type="button">${E(t.noBirthBtn)}</button></div>
      </div>
      <div class="k-card"><div class="k-mono">${E(t.stoneDay)}</div>
        <div class="k-stone"><svg class="k-gem" id="gem2" viewBox="0 0 100 100" aria-hidden="true"></svg><div><div class="k-big" id="dayS"></div><div class="k-acc" id="dayP"></div></div></div>
        <p style="margin-top:12px;font-size:15px;color:var(--dim)" id="dayD"></p></div>
    </div>
    <div class="k-grid k-two" style="margin-top:14px">
      <div class="k-card"><div class="k-mono">${E(t.moon)}</div>
        <div class="k-stone" style="margin-top:10px"><div class="k-moon" id="moon"></div><div><h3 id="moonT"></h3><div class="k-note" id="moonA"></div></div></div>
        <div style="margin-top:12px" id="evs"></div><p class="k-note">${E(t.evNote)}</p></div>
      <div class="k-card"><div class="k-mono">${E(t.ritT)}</div>
        <h3 style="margin-top:8px">${E(t.intent)}</h3><p class="k-note" id="ritTxt"></p>
        <label for="jt" class="k-mono" style="font-size:0;margin:8px 0 0">${E(t.intent)}</label>
        <textarea id="jt" maxlength="500" placeholder="${E(t.intentPh)}"></textarea>
        <label class="k-chk"><input type="checkbox" id="jdone"><span>${E(t.doneL)}</span></label>
        <button class="k-btn" id="jsave" type="button">${E(t.save)}</button><div id="jmsg" class="k-ok" role="status"></div>
        <div class="k-note" style="margin-top:14px">${E(t.streak)}</div><div class="k-streak" id="streak"></div><div id="jl"></div></div>
    </div>
  </div>
  <div class="k-pane" id="p-services" style="display:none">
    <div class="k-card"><h2>${E(t.svcT)}</h2><p class="k-note" style="margin-top:6px">${E(t.svcSub)}</p></div>
    <div class="k-card" id="aiBox" style="display:none;margin-top:14px"><h3>${E(t.aiT)}</h3><div class="k-note" id="aiLeft"></div><div id="aiHist"></div>
      <textarea id="aiQ" maxlength="1500" placeholder="${E(t.aiPh)}"></textarea><button class="k-btn" id="aiGo" type="button">${E(t.aiAsk)}</button><div class="k-err" id="aiE" role="alert"></div></div>
    <div class="k-grid k-two" id="svcList" style="margin-top:14px"></div>
    <div class="k-card" id="svcForm" style="display:none;margin-top:14px"><h3 id="sfT"></h3><div class="k-acc" id="sfP"></div>
      <div class="k-mono" style="margin-top:12px">${E(t.svcFor)}</div>
      <label class="k-chk"><input type="radio" name="sfw" value="me" checked><span>${E(t.svcMe)}</span></label>
      <label class="k-chk"><input type="radio" name="sfw" value="other"><span>${E(t.svcOther)}</span></label>
      <div id="sfO" style="display:none"><label for="soN">${E(t.svcOName)}</label><input id="soN" maxlength="60">
        <label for="soD">${E(t.bdate)}</label><input id="soD" type="date" min="1900-01-01">
        <label for="soT">${E(t.btime)}</label><input id="soT" type="time">
        <label for="soP">${E(t.bplace)}</label><input id="soP" maxlength="100"></div>
      <div id="sfF" style="display:none"><label for="sfFull">${E(t.svcFull)}</label><input id="sfFull" maxlength="120" autocomplete="name"></div>
      <div id="sfP2" style="display:none"><div class="k-mono" style="margin-top:12px">${E(t.svcPart)}</div><label for="s2N">${E(t.svcOName)}</label><input id="s2N" maxlength="60">
        <label for="s2D">${E(t.bdate)}</label><input id="s2D" type="date" min="1900-01-01"><label for="s2T">${E(t.btime)}</label><input id="s2T" type="time">
        <label for="s2P">${E(t.bplace)}</label><input id="s2P" maxlength="100"></div>
      <div class="k-mono" style="margin-top:12px">${E(t.svcPay)}</div>
      <label class="k-chk"><input type="radio" name="sfpay" value="paynet" checked><span id="pyC">${E(t.payCard)}</span></label>
      <label class="k-chk"><input type="radio" name="sfpay" value="wata"><span id="pyR">${E(t.payRub)}</span></label>
      <label for="sfM">${E(t.svcCom)}</label><textarea id="sfM" maxlength="500"></textarea>
      <button class="k-btn" id="sfSend" type="button">${E(t.svcSend)}</button> <button class="k-btn k-ghost" id="sfX" type="button">${E(t.svcCancel)}</button>
      <div class="k-err" id="sfE" role="alert"></div><div class="k-ok" id="sfOk" role="status"></div></div>
  </div>
  <div class="k-pane" id="p-readings" style="display:none">
    <div class="k-card"><h2>${E(t.readT)}</h2><div class="k-ok" id="rdMsg" role="status"></div><div id="rdList"></div><div id="rdEmpty"><p style="margin-top:8px">${E(t.readEmpty)}</p><p class="k-note">${E(t.readNote)}</p></div></div>
  </div>
  <div class="k-pane" id="p-profile" style="display:none">
    <div class="k-grid k-two">
      <div class="k-card"><h2>${E(t.profT)}</h2>
        <label for="pn">${E(t.name)}</label><input id="pn" maxlength="60" autocomplete="given-name">
        <label for="pd">${E(t.bdate)}</label><input id="pd" type="date" min="1900-01-01" autocomplete="bday">
        <label for="pt">${E(t.btime)}</label><input id="pt" type="time">
        <label for="pp">${E(t.bplace)}</label><input id="pp" maxlength="100">
        <label for="pcur">${E(t.curL)}</label><select id="pcur"><option value="MDL">MDL — лей</option><option value="EUR">EUR — €</option><option value="RUB">RUB — ₽</option></select>
        <label for="pig">${E(t.qIg)}</label><input id="pig" maxlength="40" placeholder="@">
        <label for="ptg">${E(t.qTg)}</label><input id="ptg" maxlength="40" placeholder="@">
        <label for="pl">${E(t.lang)}</label><select id="pl"><option value="ru">Русский</option><option value="ro">Română</option><option value="en">English</option></select>
        <label class="k-chk"><input type="checkbox" id="pc"><span>${E(t.consent)}</span></label>
        <div class="k-note" id="pcv"></div>
        <button class="k-btn k-full" id="psave" type="button">${E(t.saveP)}</button><div class="k-err" id="eP" role="alert"></div><div class="k-ok" id="mP" role="status"></div>
      </div>
      <div class="k-card"><div class="k-kv"><span>${E(t.emailF)}</span><span id="pEmail"></span></div><div class="k-kv"><span>${E(t.tgF)}</span><span id="pTg"></span></div>
        ${data.tg ? `<div id="tgLink" style="margin-top:14px"></div>` : `<div id="tgLink" style="display:none"></div>`}
        <button class="k-btn k-ghost" id="logout" type="button">${E(t.logout)}</button><br><button class="k-linkbtn" id="delacc" type="button">${E(t.del)}</button></div>
    </div>
  </div>
  <div class="k-pane" id="p-prices" style="display:none"><div class="k-card"><h2>Цены услуг</h2><p class="k-note">Видно только администратору. Лей, € и ₽ задаются отдельно; клиент видит одну цену — в своей валюте.</p><div id="admP" style="margin-top:10px"><div id="admRows"></div><button class="k-btn" id="admSave" type="button">Сохранить цены</button><div class="k-ok" id="admMsg" role="status"></div></div></div></div>
</section>
</div></main>
${sh.foot}
<script type="application/json" id="kd">${dj}</script>
<script src="/assets/minerals.js" defer></script>
<script src="/assets/shop.js" defer></script>
<script>window.addEventListener("DOMContentLoaded",${client.toString()});</script>
</body>
</html>`;
    return new Response(request.method === "HEAD" ? null : html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow, noarchive", "referrer-policy": "same-origin" },
    });
  } catch (e) {
    console.error("kabinet page", String(e && e.message ? e.message : e).slice(0, 200));
    return env.ASSETS.fetch(request);
  }
}
