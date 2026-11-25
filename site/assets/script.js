var currentPrice='';
var LANG=(document.documentElement.lang||'ru').slice(0,2);
var UI={"ru": {"months": ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"], "days": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], "noSeats": "нет мест", "ofEight": "из 8", "yourStone": "Ваш камень", "property": "Свойство", "generalTopic": "Общий вопрос", "topicPrefix": "Тема: ", "validationErr": "Заполните имя и телефон или Telegram — иначе мы не сможем ответить.", "sending": "Отправляем…", "sendErr": "Не получилось отправить. Напишите нам прямо в Telegram — @gemstone_md_bot.", "submitBtn": "Отправить заявку"}, "ro": {"months": ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "noi", "dec"], "days": ["dum", "lun", "mar", "mie", "joi", "vin", "sâm"], "noSeats": "fără locuri", "ofEight": "din 8", "yourStone": "Piatra ta", "property": "Proprietate", "generalTopic": "Întrebare generală", "topicPrefix": "Temă: ", "validationErr": "Completați numele și telefonul sau Telegram — altfel nu vă putem răspunde.", "sending": "Se trimite…", "sendErr": "Nu s-a putut trimite. Scrieți-ne direct pe Telegram — @gemstone_md_bot.", "submitBtn": "Trimite cererea"}, "en": {"months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], "days": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "noSeats": "no spots left", "ofEight": "of 8", "yourStone": "Your stone", "property": "Property", "generalTopic": "General question", "topicPrefix": "Topic: ", "validationErr": "Fill in your name and phone or Telegram — otherwise we can't reply.", "sending": "Sending…", "sendErr": "Couldn't send. Message us directly on Telegram — @gemstone_md_bot.", "submitBtn": "Send request"}}[LANG]||{"months": ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"], "days": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], "noSeats": "нет мест", "ofEight": "из 8", "yourStone": "Ваш камень", "property": "Свойство", "generalTopic": "Общий вопрос", "topicPrefix": "Тема: ", "validationErr": "Заполните имя и телефон или Telegram — иначе мы не сможем ответить.", "sending": "Отправляем…", "sendErr": "Не получилось отправить. Напишите нам прямо в Telegram — @gemstone_md_bot.", "submitBtn": "Отправить заявку"};

/* Календарь Натальи: 366 дней. Правится через admin.html */
var SLUG={'Соколиный глаз':'sokolinyi-glaz','Рубин':'rubin','Чёрный агат':'chernyi-agat',
'Родонит':'rodonit','Жемчуг':'zhemchug','Бирюза':'biriuza','Яшма':'iashma','Аметист':'ametist',
'Горный хрусталь':'gornyi-khrustal','Гелиотроп':'geliotrop','Нефрит':'nefrit','Лава':'lava',
'Тигровый глаз':'tigrovyi-glaz','Изумруд':'izumrud','Турмалин':'turmalin','Гранат':'granat',
'Цитрин':'tsitrin','Амазонит':'amazonit','Лазурит':'lazurit','Агат':'agat','Сапфир':'sapfir',
'Хризопраз':'khrizopraz','Лунный камень':'lunnyi-kamen','Берилл':'berill','Сардоникс':'sardoniks',
'Малахит':'malakhit','Солнечный камень':'solnechnyi-kamen','Розовый кварц':'rozovyi-kvarts',
'Авантюрин':'avantiurin','Опал':'opal','Обсидиан':'obsidian','Коралл':'korall','Сердолик':'serdolik',
'Аквамарин':'akvamarin','Чароит':'charoit','Гематит':'gematit','Корунд':'korund','Змеевик':'zmeevik',
'Топаз':'topaz','Альмандин':'almadin'};
/* три образца вшиты для просмотра без сервера; остальные — из assets/stones/ */
var EMBED={};
var ST_RU=[["Соколиный глаз","Стратегия","видеть ход наперёд, а не реагировать"],["Рубин","Жизненная сила","когда сил на себя уже не остаётся"],["Чёрный агат","Защита и заземление","вернуться в себя после чужого шума"],["Родонит","Прощение","отпустить то, что держит"],["Жемчуг","Материнская энергия","мягкость к себе, а не только к другим"],["Бирюза","Удача в путешествиях","дорога, переезд, новая страна"],["Яшма","Материнская забота","выдержать, когда все опираются на вас"],["Аметист","Духовность","разобрать шум в голове на отдельные мысли"],["Горный хрусталь","Универсальная чистота","начать с чистого листа"],["Гелиотроп","Мужество","сделать первый шаг, который откладывается"],["Нефрит","Изобилие","перестать считать каждый лей со страхом"],["Лава","Сила и стойкость","пережить период, который надо просто пережить"],["Тигровый глаз","Уверенность","говорить своим голосом, а не удобным"],["Изумруд","Верность","держать данное слово — себе в первую очередь"],["Турмалин","Защита и очищение","поставить границу без чувства вины"],["Гранат","Страсть и сила","вернуть интерес к собственной жизни"],["Цитрин","Изобилие","перестать считать каждый лей со страхом"],["Амазонит","Правда","сказать вслух то, что давно понятно"],["Лазурит","Истина и голос","перестать смягчать формулировки"],["Агат","Стабильность","опора, когда вокруг всё меняется"],["Сапфир","Мудрость","решение, о котором не пожалеете"],["Хризопраз","Надежда","поверить, что период закончится"],["Лунный камень","Интуиция","услышать себя раньше чужих советов"],["Берилл","Ясность","выбрать одно из десяти"],["Сардоникс","Долгосрочные партнёрства","строить вдолгую, а не на один раз"],["Малахит","Исцеление травм","работа с тем, о чём не говорят"],["Солнечный камень","Радость","вспомнить, что вам нравилось"],["Розовый кварц","Любовь к себе","поставить себя не последней в списке"],["Авантюрин","Удача и процветание","когда старания наконец дают результат"],["Опал","Творчество","делать своё, а не правильное"],["Обсидиан","Энергетический щит","работа с людьми и тяжёлые разговоры"],["Коралл","Глубина","честность с собой без свидетелей"],["Сердолик","Новые начинания","первый день после решения"],["Аквамарин","Ясность и голос","объяснить себя и быть понятой"],["Чароит","Духовное восхождение","когда прежние ответы перестали работать"],["Гематит","Заземление","вернуться в тело из головы"],["Корунд","Воля и ясность","довести до конца начатое"],["Змеевик","Обновление","выйти из круга, который повторяется"],["Топаз","Благополучие","позволить себе спокойствие"],["Альмандин","Жизненная сила","когда сил на себя уже не остаётся"]];
var ST_RO=[["Ochi de șoim","Strategie","să vezi mișcarea înainte, nu doar să reacționezi"],["Rubin","Forță vitală","când nu mai rămân puteri pentru tine"],["Agat negru","Protecție și înrădăcinare","să te reîntorci la tine după zgomotul altora"],["Rodonit","Iertare","să lași să plece ce te ține"],["Perlă","Energie maternă","blândețe cu tine, nu doar cu ceilalți"],["Turcoaz","Noroc în călătorii","drum, mutare, o țară nouă"],["Jasp","Grijă maternă","să reziști când toți se bazează pe tine"],["Ametist","Spiritualitate","să desparți zgomotul din minte în gânduri separate"],["Cristal de stâncă","Claritate universală","să începi de la pagina albă"],["Heliotrop","Curaj","să faci primul pas pe care îl tot amâni"],["Nefrit","Abundență","să nu mai numeri fiecare leu cu frică"],["Piatră de lavă","Forță și rezistență","să treci printr-o perioadă pe care trebuie doar să o treci"],["Ochi de tigru","Încredere","să vorbești cu vocea ta, nu cu una convenabilă"],["Smarald","Loialitate","să-ți ții cuvântul dat — mai întâi față de tine"],["Turmalină","Protecție și purificare","să pui o limită fără să te simți vinovată"],["Granat","Pasiune și forță","să-ți recuperezi interesul pentru propria viață"],["Citrin","Abundență","să nu mai numeri fiecare leu cu frică"],["Amazonit","Adevăr","să spui cu voce tare ce e limpede de mult"],["Lazurit","Adevăr și voce","să nu mai îndulcești cuvintele"],["Agat","Stabilitate","un reper când totul în jur se schimbă"],["Safir","Înțelepciune","o decizie de care nu te vei căi"],["Crisopraz","Speranță","să crezi că această perioadă se va termina"],["Piatra lunii","Intuiție","să te asculți pe tine înainte de sfaturile altora"],["Beril","Claritate","să alegi una din zece"],["Sardonix","Parteneriate de durată","să construiești pe termen lung, nu pentru o singură dată"],["Malachit","Vindecarea rănilor","lucrul cu ceea ce nu se spune"],["Piatra soarelui","Bucurie","să-ți amintești ce te bucura cu adevărat"],["Cuarț roz","Iubire de sine","să nu te mai pui ultima pe listă"],["Aventurin","Noroc și prosperitate","când eforturile dau, în sfârșit, rezultate"],["Opal","Creativitate","să faci ce e al tău, nu ce e «corect»"],["Obsidian","Scut energetic","lucrul cu oamenii și conversațiile grele"],["Coral","Profunzime","sinceritate cu tine fără martori"],["Carneol","Începuturi noi","prima zi după ce ai decis"],["Acvamarin","Claritate și voce","să te explici și să fii înțeleasă"],["Charoit","Ascensiune spirituală","când răspunsurile de până acum au încetat să funcționeze"],["Hematit","Înrădăcinare","să te reîntorci din minte în corp"],["Corindon","Voință și claritate","să duci la capăt ceea ce ai început"],["Serpentin","Reînnoire","să ieși din cercul care se repetă"],["Topaz","Bunăstare","să-ți permiți liniștea"],["Almandin","Forță vitală","când nu mai rămân puteri pentru tine"]];
var ST_EN=[["Hawk's Eye","Strategy","seeing the move ahead, not just reacting"],["Ruby","Life force","when there's no strength left for yourself"],["Black Agate","Protection and grounding","returning to yourself after other people's noise"],["Rhodonite","Forgiveness","letting go of what's holding you"],["Pearl","Maternal energy","gentleness toward yourself, not only toward others"],["Turquoise","Luck in travel","the road, a move, a new country"],["Jasper","Maternal care","holding steady when everyone leans on you"],["Amethyst","Spirituality","sorting the noise in your head into separate thoughts"],["Clear Quartz","Universal clarity","starting with a clean slate"],["Bloodstone","Courage","taking the first step you keep postponing"],["Jade","Abundance","no longer counting every coin in fear"],["Lava Stone","Strength and endurance","getting through a stretch that just has to be gotten through"],["Tiger's Eye","Confidence","speaking in your own voice, not the convenient one"],["Emerald","Loyalty","keeping your word — to yourself first"],["Tourmaline","Protection and cleansing","setting a boundary without the guilt"],["Garnet","Passion and strength","getting your own life interesting again"],["Citrine","Abundance","no longer counting every coin in fear"],["Amazonite","Truth","saying out loud what's long been obvious"],["Lapis Lazuli","Truth and voice","no longer softening the words"],["Agate","Stability","an anchor when everything around you is changing"],["Sapphire","Wisdom","a decision you won't regret"],["Chrysoprase","Hope","believing this stretch will end"],["Moonstone","Intuition","hearing yourself before other people's advice"],["Beryl","Clarity","choosing one out of ten"],["Sardonyx","Long-term partnerships","building for the long run, not a one-off"],["Malachite","Healing old wounds","working with what doesn't get talked about"],["Sunstone","Joy","remembering what you actually liked"],["Rose Quartz","Self-love","not putting yourself last on the list"],["Aventurine","Luck and prosperity","when the effort finally pays off"],["Opal","Creativity","making your own thing, not the correct one"],["Obsidian","Energy shield","working with people and hard conversations"],["Coral","Depth","honesty with yourself, no witnesses"],["Carnelian","New beginnings","the first day after the decision"],["Aquamarine","Clarity and voice","explaining yourself and being understood"],["Charoite","Spiritual ascent","when the old answers have stopped working"],["Hematite","Grounding","coming back into your body from your head"],["Corundum","Will and clarity","seeing through what you started"],["Serpentine","Renewal","breaking a cycle that keeps repeating"],["Topaz","Wellbeing","letting yourself be at ease"],["Almandine","Life force","when there's no strength left for yourself"]];
var ST = LANG==='ro'?ST_RO : LANG==='en'?ST_EN : ST_RU;
/* v4: 2–3 предложения о камне (минералогия + назначение), порядок = ST_* */
var STD_RU=["Разновидность кварца с волокнами рибекита — отсюда сине-серый «кошачий» перелив. В работе с камнем это опора для стратегического мышления: смотреть на ситуацию сверху и планировать на несколько шагов вперёд.", "Красный корунд, твёрдость 9 — второй по твёрдости минерал после алмаза. Его берут как камень жизненной силы: для периодов, когда нужно вернуть себе энергию и желание действовать.", "Скрытокристаллический кварц с плотной однородной текстурой. Классический камень заземления: помогает собраться и вернуть внутреннюю тишину после людных, шумных дней.", "Силикат марганца: розовое тело с чёрными прожилками оксидов. Камень про то, чтобы отпускать старые обиды и не тащить их за собой в новые отношения.", "Органический минерал: слои арагонита, которые моллюск наращивает годами. Символ мягкой, заботливой силы — в том числе по отношению к себе.", "Фосфат меди и алюминия, цвет которого даёт медь. Традиционный камень путешественников — для дороги, переезда и начала жизни на новом месте.", "Плотная кварцевая порода с неповторяющимся рисунком примесей. Камень выносливости и опоры — для тех, на ком держится семья или команда.", "Фиолетовый кварц: цвет дают примеси железа и природное облучение. Камень ясной головы — помогает разложить поток мыслей по порядку и сосредоточиться.", "Чистый прозрачный кварц без примесей, SiO₂. Нейтральный камень «чистого листа» — для нового этапа и для усиления других минералов в капсуле.", "Тёмно-зелёный халцедон с красными вкраплениями оксидов железа. Камень решимости — для шага, который давно откладывается.", "Минерал группы амфиболов с войлочной структурой волокон — одна из самых вязких пород в природе. Камень устойчивого достатка: спокойное, а не тревожное отношение к деньгам.", "Пористый базальт — застывшая вулканическая порода. Символ стойкости: для периодов, которые нужно просто спокойно пройти.", "Кварц с волокнами крокидолита, давшими ему золотистый шёлковый перелив. Камень уверенности — говорить своим голосом и отстаивать свою позицию.", "Зелёный берилл, цвет которого даёт хром. Камень верности — данному слову, своим ценностям и долгим отношениям.", "Сложный боросиликат; чёрный шерл — самая распространённая его разновидность. Камень защиты и личных границ — чтобы говорить «нет» без чувства вины.", "Силикат группы граната, твёрдость до 7,5. Камень энергии и решимости — для периодов, когда нужно вернуть себе мотивацию и интерес к жизни.", "Жёлтый кварц; природный цитрин встречается редко и ценится выше прогретого аметиста. Камень достатка и деловой энергии — для спокойной, уверенной работы с деньгами.", "Зелёный полевой шпат, цвет которому дают следы свинца и воды. Камень честности — помогает сказать вслух то, что давно понятно.", "Горная порода на основе лазурита с вкраплениями пирита; главные месторождения — в Афганистане. Камень истины и ясной речи — для переговоров и прямых разговоров.", "Слоистый халцедон, рисунок которого формировался веками. Камень стабильности — опора, когда вокруг многое меняется.", "Синий корунд, твёрдость 9. Камень мудрости и взвешенных решений — о которых потом не жалеют.", "Никелевый халцедон яблочно-зелёного цвета. Камень надежды — помогает пережить трудный период и увидеть, что он закончится.", "Полевой шпат с голубым сиянием — адуляресценцией от тонких слоёв в кристалле. Камень интуиции — услышать себя раньше чужих советов.", "Силикат бериллия и алюминия; к семейству бериллов относятся изумруд и аквамарин. Камень ясности — сделать выбор, когда вариантов слишком много.", "Слоистый халцедон с чередованием красно-бурых и белых полос. Камень долгих союзов — деловых и личных.", "Карбонат меди с концентрическим узором — срезами натёчных наслоений. Камень глубокой внутренней работы — с тем, о чём не принято говорить.", "Полевой шпат с искрящимися пластинками гематита внутри. Камень радости — вернуть вкус к тому, что по-настоящему нравится.", "Кварц, розовый цвет которого дают микроскопические волокна дюмортьерита. Камень любви к себе — чтобы не ставить себя последней в списке.", "Кварц с блёстками фуксита — хромовой слюды. Камень удачи в делах — для периода, когда старания начинают давать результат.", "Аморфный кремнезём с водой в структуре; игра цвета возникает на микросферах кремнезёма. Камень творчества — делать своё, а не «правильное».", "Вулканическое стекло без кристаллической структуры. Камень энергетической защиты — для работы с людьми и тяжёлых разговоров.", "Органическое образование — известковый скелет колоний полипов. Камень глубины и честности с собой.", "Оранжево-красный халцедон, цвет которого дают оксиды железа. Камень новых начинаний — для первого дня после принятого решения.", "Голубой берилл, цвет которому даёт железо. Камень ясной речи — объяснить себя и быть понятой.", "Редкий силикат, найденный только в Якутии, у реки Чара. Камень духовного роста — когда прежние ответы перестают работать.", "Оксид железа с металлическим блеском, заметно тяжелее большинства камней. Камень заземления — вернуться из мыслей в тело и в текущий момент.", "Оксид алюминия, твёрдость 9; рубин и сапфир — его драгоценные разновидности. Камень воли — доводить начатое до конца.", "Минерал группы серпентина с рисунком, похожим на змеиную кожу. Камень обновления — выйти из повторяющегося сценария.", "Силикат алюминия со фтором, твёрдость 8. Камень благополучия — разрешить себе спокойствие и отдых.", "Железистый гранат глубокого винно-красного цвета — самый распространённый в ювелирном деле. Камень жизненной силы — для периодов, когда нужно восстановить энергию."];
var STD_RO=["Varietate de cuarț cu fibre de riebeckit — de aici luciul albastru-cenușiu. Este un reper pentru gândirea strategică: să privești situația de sus și să planifici câțiva pași înainte.", "Corindon roșu, duritate 9 — al doilea mineral ca duritate după diamant. Piatra forței vitale: pentru perioadele în care vrei să-ți recapeți energia și dorința de a acționa.", "Cuarț criptocristalin cu textură densă și uniformă. Piatra clasică a înrădăcinării: te ajută să te aduni după zile aglomerate și zgomotoase.", "Silicat de mangan: roz, cu vinișoare negre de oxizi. Piatra care te ajută să lași în urmă vechile resentimente.", "Mineral organic: straturi de aragonit depuse de moluscă ani la rând. Simbolul unei forțe blânde și grijulii — inclusiv față de tine.", "Fosfat de cupru și aluminiu; culoarea o dă cuprul. Piatra tradițională a călătorilor — pentru drum, mutare și un nou început.", "Rocă de cuarț densă, cu model irepetabil. Piatra rezistenței — pentru cei pe care se sprijină familia sau echipa.", "Cuarț violet: culoarea vine din fier și iradiere naturală. Piatra minții limpezi — ordonează gândurile și ajută la concentrare.", "Cuarț transparent pur, SiO₂. Piatra neutră a „paginii albe” — pentru o etapă nouă și pentru a susține celelalte minerale din capsulă.", "Calcedonie verde-închis cu pete roșii de oxizi de fier. Piatra hotărârii — pentru pasul amânat de mult.", "Mineral din grupa amfibolilor, cu fibre împâslite — una dintre cele mai tenace roci. Piatra abundenței liniștite: o relație calmă, nu anxioasă, cu banii.", "Bazalt poros — rocă vulcanică solidificată. Simbolul rezistenței: pentru perioadele care trebuie pur și simplu traversate.", "Cuarț cu fibre de crocidolit, cu reflexe aurii de mătase. Piatra încrederii — să vorbești cu vocea ta și să-ți susții poziția.", "Beril verde colorat de crom. Piatra loialității — față de cuvântul dat, de valorile tale și de relațiile de durată.", "Borosilicat complex; șorlul negru este varietatea cea mai răspândită. Piatra protecției și a limitelor personale — să spui „nu” fără vină.", "Silicat din grupa granatului, duritate până la 7,5. Piatra energiei și a hotărârii — pentru a-ți recăpăta motivația.", "Cuarț galben; citrinul natural e rar și prețuit mai mult decât ametistul tratat termic. Piatra prosperității și a energiei de afaceri.", "Feldspat verde, colorat de urme de plumb și apă. Piatra sincerității — să spui cu voce tare ce e limpede de mult.", "Rocă pe bază de lazurit cu incluziuni de pirit; principalele zăcăminte sunt în Afganistan. Piatra adevărului și a vorbirii clare.", "Calcedonie stratificată, formată de-a lungul secolelor. Piatra stabilității — un reper când multe se schimbă.", "Corindon albastru, duritate 9. Piatra înțelepciunii și a deciziilor cântărite.", "Calcedonie cu nichel, de un verde de măr. Piatra speranței — să treci printr-o perioadă grea știind că se va încheia.", "Feldspat cu strălucire albăstruie — adularescență din straturi fine ale cristalului. Piatra intuiției — să te auzi înaintea sfaturilor altora.", "Silicat de beriliu și aluminiu; din familie fac parte smaraldul și acvamarinul. Piatra clarității — să alegi când variantele sunt prea multe.", "Calcedonie stratificată în benzi roșu-brune și albe. Piatra alianțelor de durată — de afaceri și personale.", "Carbonat de cupru cu model concentric. Piatra lucrului interior profund — cu ceea ce de obicei nu se spune.", "Feldspat cu plăcuțe sclipitoare de hematit. Piatra bucuriei — să-ți amintești ce îți place cu adevărat.", "Cuarț colorat în roz de fibre microscopice de dumortierit. Piatra iubirii de sine — să nu te mai pui ultima pe listă.", "Cuarț cu sclipiri de fuchsit — mică cu crom. Piatra norocului în afaceri — când eforturile încep să dea roade.", "Silice amorfă cu apă în structură; jocul de culori apare pe microsfere de silice. Piatra creativității — să faci ce e al tău.", "Sticlă vulcanică fără structură cristalină. Piatra protecției energetice — pentru lucrul cu oamenii și discuțiile grele.", "Formațiune organică — scheletul calcaros al coloniilor de polipi. Piatra profunzimii și a sincerității cu tine.", "Calcedonie roșu-portocalie colorată de oxizi de fier. Piatra începuturilor — pentru prima zi după o decizie.", "Beril albastru colorat de fier. Piatra vorbirii clare — să te explici și să fii înțeleasă.", "Silicat rar, găsit doar în Iakutia, lângă râul Ciara. Piatra creșterii spirituale — când vechile răspunsuri nu mai funcționează.", "Oxid de fier cu luciu metalic, vizibil mai greu decât majoritatea pietrelor. Piatra înrădăcinării — să revii din gânduri în corp.", "Oxid de aluminiu, duritate 9; rubinul și safirul sunt varietățile lui prețioase. Piatra voinței — să duci la capăt ce ai început.", "Mineral din grupa serpentinei, cu model ca pielea de șarpe. Piatra reînnoirii — să ieși dintr-un scenariu care se repetă.", "Silicat de aluminiu cu fluor, duritate 8. Piatra bunăstării — să-ți permiți liniștea și odihna.", "Granat feros de un roșu-vișiniu profund — cel mai folosit în bijuterie. Piatra forței vitale — pentru a-ți reface energia."];
var STD_EN=["A quartz variety with riebeckite fibres — hence its blue-grey chatoyant sheen. A support for strategic thinking: seeing the situation from above and planning several moves ahead.", "Red corundum, hardness 9 — second only to diamond. A stone of life force for times when you want your energy and drive back.", "Cryptocrystalline quartz with a dense, even texture. The classic grounding stone: it helps you collect yourself after crowded, noisy days.", "Manganese silicate: pink body with black oxide veins. A stone for letting go of old grievances instead of carrying them forward.", "An organic gem: aragonite layers built up by a mollusc over years. A symbol of gentle, caring strength — including towards yourself.", "A copper-aluminium phosphate coloured by copper. The traditional travellers’ stone — for the road, a move and a fresh start somewhere new.", "A dense quartz rock with a never-repeating pattern. A stone of endurance for those the family or team leans on.", "Violet quartz coloured by iron and natural irradiation. A stone for a clear head — putting a stream of thoughts in order and focusing.", "Pure transparent quartz, SiO₂. A neutral “clean slate” stone — for a new chapter and to support the other minerals in a capsule.", "Dark-green chalcedony with red iron-oxide spots. A stone of resolve — for the step you keep postponing.", "An amphibole with felted fibres — one of the toughest rocks in nature. A stone of steady abundance: a calm rather than anxious relationship with money.", "Porous basalt — solidified volcanic rock. A symbol of resilience for periods you simply need to get through.", "Quartz with crocidolite fibres that give it a golden silky sheen. A stone of confidence — speaking in your own voice and holding your position.", "Green beryl coloured by chromium. A stone of loyalty — to your word, your values and long relationships.", "A complex borosilicate; black schorl is its most common variety. A stone of protection and personal boundaries — saying “no” without guilt.", "A silicate of the garnet group, hardness up to 7.5. A stone of energy and determination — for regaining motivation and interest in life.", "Yellow quartz; natural citrine is rare and valued above heat-treated amethyst. A stone of prosperity and business energy.", "Green feldspar coloured by traces of lead and water. A stone of honesty — saying out loud what has long been clear.", "A lazurite-based rock with pyrite flecks, mined mainly in Afghanistan. A stone of truth and clear speech — for negotiations and direct conversations.", "Banded chalcedony formed over centuries. A stone of stability — something to hold on to when much is changing.", "Blue corundum, hardness 9. A stone of wisdom and well-weighed decisions.", "Nickel-bearing, apple-green chalcedony. A stone of hope — for getting through a hard period knowing it will end.", "Feldspar with a blue glow — adularescence from thin layers inside the crystal. A stone of intuition — hearing yourself before other people’s advice.", "Beryllium aluminium silicate; emerald and aquamarine belong to the same family. A stone of clarity — choosing when there are too many options.", "Chalcedony banded in red-brown and white. A stone of lasting partnerships, in business and in life.", "Copper carbonate with a concentric pattern. A stone for deep inner work — with what usually goes unsaid.", "Feldspar with sparkling hematite platelets inside. A stone of joy — remembering what you truly enjoy.", "Quartz tinted pink by microscopic dumortierite fibres. A stone of self-love — not putting yourself last on the list.", "Quartz glittering with fuchsite, a chromium mica. A stone of luck in business — for when effort starts to pay off.", "Amorphous silica holding water; its play of colour comes from silica microspheres. A stone of creativity — doing your own thing, not the “right” one.", "Volcanic glass with no crystal structure. A stone of energetic protection — for working with people and difficult conversations.", "An organic formation — the calcareous skeleton of polyp colonies. A stone of depth and honesty with yourself.", "Orange-red chalcedony coloured by iron oxides. A stone of new beginnings — for the first day after a decision.", "Blue beryl coloured by iron. A stone of clear speech — explaining yourself and being understood.", "A rare silicate found only in Yakutia, by the Chara river. A stone of spiritual growth — when old answers stop working.", "Iron oxide with a metallic lustre, noticeably heavier than most stones. A grounding stone — returning from your thoughts to your body.", "Aluminium oxide, hardness 9; ruby and sapphire are its precious varieties. A stone of will — finishing what you started.", "A serpentine-group mineral patterned like snakeskin. A stone of renewal — stepping out of a repeating pattern.", "Fluorine-bearing aluminium silicate, hardness 8. A stone of well-being — allowing yourself calm and rest.", "Iron-rich garnet of a deep wine-red — the garnet most used in jewellery. A stone of life force — for restoring your energy."];
var STD = LANG==='ro'?STD_RO : LANG==='en'?STD_EN : STD_RU;
var CAL=["ABCDEFGBHIJKCDLCMNGOPQRSTKIIUHV","WFFXYUTZaMJYMbcdUecfUaKbLDNMM","REIgOHUhKHYPQXWfViYNYBiVjCABkhd","JKSYkPYcGHHZOHKCfOSObPCPPHMiPL","KQAhZWEKRNgISTCQdOTgNfVllSHFXIQ","AegZWLMXabYcDQJYLLXPUhNAEWNKgO","iRXPfPmJJQdTKmjaTWWKLNGUUeGDlkk","OnhKPMShZXHgYBOQLCcBkaIRRKgjkgD","mGVeMNIEGKCOCMaGHlJgVfKZjcQXQd","KMmkKPTgmAORbPDIIkHSikHPBHDdmFm","jQFQlgOBMIamXNeWPdKbILkXPGBFBU","FlIOPJQiHhMkHUPKFjGeVPTFmgldmRb"];

/* Расписание мастер-классов. Правится через admin.html */
/* Расписание. Пусто, пока Наталья не внесёт даты через admin.html —
   тогда SCHED заполнится и таблица заменит блок schedEmpty автоматически. */
var SCHED=[];
(function(){
  var box=document.getElementById('sched'), empty=document.getElementById('schedEmpty');
  if(!box) return;
  var M=UI.months;
  var W=UI.days;
  var now=new Date(); now.setHours(0,0,0,0);
  var upcoming=SCHED.filter(function(e){return new Date(e.d)>=now;}).slice(0,4);
  if(!upcoming.length) return; // остаётся честное "даты появятся" состояние
  upcoming.forEach(function(e){
    var dt=new Date(e.d), r=document.createElement('div');
    r.className='sched__row'+(e.s===0?' sched__row--out':'');
    r.innerHTML='<span class="sched__d">'+dt.getDate()+' '+M[dt.getMonth()]+
      ' <i>'+W[dt.getDay()]+'</i></span><span>'+e.t+'</span><span class="sched__s">'+
      (e.s===0?UI.noSeats:e.s+' '+UI.ofEight)+'</span>';
    box.appendChild(r);
  });
  box.style.display='';
  empty.style.display='none';
})();

var bd=document.getElementById('bd'), res=document.getElementById('res'), found=document.getElementById('found'), bdx=document.getElementById('bdx');
var shownDate='';
var MIN=window.GS_MIN||null;
var SL={
  ru:{rows:['Для чего','Когда'],astro:['Астроминералогия','Планеты','Знаки','Чакры'],week:'Минерал недели',lnk:'Украшения с этим камнем →',clear:'Стереть дату'},
  ro:{rows:['Pentru ce','Când'],astro:['Astromineralogie','Planete','Zodii','Chakre'],week:'Mineralul săptămânii',lnk:'Bijuterii cu această piatră →',clear:'Șterge data'},
  en:{rows:['For','When'],astro:['Astromineralogy','Planets','Signs','Chakras'],week:'Mineral of the week',lnk:'Jewellery with this stone →',clear:'Clear date'}
}[LANG]||null;
function stoneArt(look,alt){
  if(!MIN) return '';
  try{return MIN.render(look,alt)||'';}catch(e){return '';}
}
function fillStone(o,now){
  var card=document.querySelector('.stone'); if(!card) return;
  var ph=document.getElementById('stPh');
  if(!now) card.classList.add('swap');
  setTimeout(function(){
    document.getElementById('stK').textContent=o.k;
    document.getElementById('stN').textContent=o.n;
    document.getElementById('stR').innerHTML=o.rows.map(function(r){return '<div class="stone__r"><span>'+r[0]+'</span><span>'+r[1]+'</span></div>';}).join('');
    document.getElementById('stF').textContent=o.f;
    var lk=document.getElementById('stL'); if(lk){lk.hidden=true; lk.removeAttribute('href');}
    if(ph){var art=stoneArt(o.look,o.n), photo=art.indexOf('<img')===0; ph.innerHTML=photo?art.replace(' loading="lazy"',' fetchpriority="high"'):art; ph.classList.toggle('photo',photo); card.classList.toggle('nophoto',!art);}
    card.classList.toggle('lit',!!o.lit);
    card.classList.remove('swap');
    card.setAttribute('data-look',o.look||'');
    card.setAttribute('data-mode',o.lit?'yours':'week');
    if(!o.lit) linkWeek();
  },now?0:380);
}
/* минерал недели: меняется каждый понедельник, порядок задан в assets/minerals.js */
function weekCard(now){
  if(!MIN||!SL) return;
  var w=MIN.week();
  fillStone({k:SL.week+' · '+w.range,n:w.name,look:w.look,lit:false,
    rows:[[SL.rows[0],w.purpose],[SL.rows[1],w.when]],f:w.fact},now);
}
function linkWeek(){
  var lk=document.getElementById('stL'), card=document.querySelector('.stone');
  if(!lk||!card||card.getAttribute('data-mode')!=='week'||!window.GS_SHOP||!GS_SHOP.link) return;
  var l=GS_SHOP.link(card.getAttribute('data-look'));
  if(l&&l.n){lk.textContent=SL.lnk; lk.href=l.href; lk.hidden=false;} else {lk.hidden=true;}
}
document.addEventListener('gs:catalog',linkWeek);

function show(){
  var m=bd.value.match(/^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{4})\s*$/);
  if(!m){bd.focus();return;}
  var mm=+m[2], dd=+m[1];
  if(mm<1||mm>12||dd<1||dd>CAL[mm-1].length){bd.focus();return;}
  var c=CAL[mm-1].charAt(dd-1);
  var si=c===c.toUpperCase()?c.charCodeAt(0)-65:c.charCodeAt(0)-97+26, st=ST[si];
  var inf=MIN&&MIN.info?MIN.info(ST_RU[si][0]):null, prop=inf?inf.purpose:st[1], desc=inf?inf.text:(STD[si]||'');
  document.getElementById('rS').textContent=st[0];
  var rT=document.getElementById('rT'), rPh=document.getElementById('rPh'), rN=document.getElementById('rN');
  if(rT) rT.textContent=prop;
  /* кристалл слева, в блоке результата (справа остаётся «минерал недели» — без дубля) */
  if(rPh){var art=stoneArt(ST_RU[si][0],st[0]), ph=art.indexOf('<img')===0; rPh.innerHTML=ph?art.replace(' loading="lazy"',''):art; rPh.classList.toggle('photo',ph); rPh.hidden=!art;}
  if(inf){
    /* три коротких фразы: 1-я попадает в состояние («Вы…»), остальные — образ камня и ритуал */
    var ss=(desc.match(/[^.!?]+[.!?]+/g)||[desc]).map(function(x){return x.trim();});
    rN.innerHTML='<span class="res__lead">'+ss[0]+'</span>'+(ss.length>1?'<span class="res__desc">'+ss.slice(1).join(' ')+'</span>':'');
  } else rN.innerHTML=desc?'<span class="res__desc">'+desc+'</span>':'<b>'+st[1]+'</b> — '+st[2]+'.';
  /* астроминералогия (из «Шпаргалки»): планеты · знаки · чакры — только для камней, которые есть в шпаргалке */
  var rA=document.getElementById('rA'), ai=MIN&&MIN.astro&&SL?MIN.astro(ST_RU[si][0]):null;
  if(rA){
    rA.innerHTML=ai?'<span class="mono res__ah">'+SL.astro[0]+'</span>'+[[SL.astro[1],ai.planets],[SL.astro[2],ai.signs],[SL.astro[3],ai.chakras]].filter(function(r){return r[1].length;}).map(function(r){return '<div class="res__ar"><span>'+r[0]+'</span><b>'+r[1].join(' · ')+'</b></div>';}).join(''):'';
    rA.hidden=!ai;
  }
  document.getElementById('rD').textContent=('0'+dd).slice(-2)+'.'+('0'+mm).slice(-2);
  shownDate=bd.value;
  /* v3: подборка украшений с этим камнем из каталога (assets/shop.js) */
  var fs=document.getElementById('fS'); if(fs) fs.textContent=st[0];
  if(found) found.hidden=false;
  try{document.dispatchEvent(new CustomEvent('gs:stone',{detail:{ru:ST_RU[si][0],name:st[0],prop:prop,desc:desc}}));}catch(e){}
  res.classList.remove('on'); void res.offsetWidth; res.classList.add('on');
  setTimeout(revealResult,160);
}
/* прокрутить так, чтобы результат и начало подборки были на экране; только если они ещё не видны */
function revealResult(){
  try{
    var r=res.getBoundingClientRect(), vh=window.innerHeight||800;
    if(r.top>vh*.5||r.bottom>vh-10){
      var y=window.scrollY+r.top-Math.min(96,vh*.12);
      window.scrollTo({top:Math.max(0,y),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
  }catch(e){}
}
/* дату стёрли или изменили: результат и подборка уходят (карточка справа всегда остаётся «минералом недели») */
function resetResult(){
  var had=res.classList.contains('on')||(found&&!found.hidden);
  shownDate='';
  res.classList.remove('on');
  if(found) found.hidden=true;
  try{document.dispatchEvent(new CustomEvent('gs:stone',{detail:null}));}catch(e){}
}
function syncX(){ if(bdx) bdx.hidden=!bd.value; }
document.getElementById('go').addEventListener('click',show);
bd.addEventListener('keydown',function(e){if(e.key==='Enter')show();});
bd.addEventListener('input',function(){
  var v=bd.value.replace(/\D/g,'').slice(0,8), o=v.slice(0,2);
  if(v.length>2)o+='.'+v.slice(2,4);
  if(v.length>4)o+='.'+v.slice(4,8);
  bd.value=o;
  syncX();
  if(shownDate&&o!==shownDate) resetResult();
});
if(bdx){
  if(SL) bdx.setAttribute('aria-label',SL.clear);
  bdx.addEventListener('click',function(){bd.value='';syncX();resetResult();bd.focus();});
}
weekCard(true);

/* Наклон карточки за курсором. На тач-экранах — отклик на касание. */
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function bind(el){
    if(fine){
      el.addEventListener('pointermove',function(e){
        var r=el.getBoundingClientRect();
        var x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        el.style.transform='perspective(900px) rotateX('+(-y*4).toFixed(2)+'deg) rotateY('+(x*4).toFixed(2)+'deg) translateY(-6px)';
        var img=el.querySelector('img');
        if(img) img.style.transformOrigin=(50+x*18)+'% '+(50+y*18)+'%';
      });
      el.addEventListener('pointerleave',function(){el.style.transform='';});
    } else {
      el.addEventListener('touchstart',function(){el.classList.add('tap');},{passive:true});
      el.addEventListener('touchend',function(){setTimeout(function(){el.classList.remove('tap');},900);});
    }
  }
  document.querySelectorAll('.cap,.good,.stone').forEach(bind);
})();

var io=new IntersectionObserver(function(es){
  es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}});
},{threshold:.15});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});

var img=document.getElementById('heroImg'), tick=false;
/* v5: текст героя и результат подбора при скролле НЕ гасим — человек читает. Только мягкий параллакс фото на десктопе. */
if(img && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(min-width:861px)').matches){
  window.addEventListener('scroll',function(){
    if(tick)return; tick=true;
    requestAnimationFrame(function(){
      var y=window.scrollY, h=window.innerHeight;
      if(y<h) img.style.transform='translateY('+(y*.12)+'px)';
      tick=false;
    });
  },{passive:true});
}

/* ── Модалка заявки: сбор контакта, отправка в /api/lead (Worker -> Telegram отдела продаж) ── */
(function(){
  var wrap=document.getElementById('leadwrap'); if(!wrap) return;
  var body=document.getElementById('leadBody'), ok=document.getElementById('leadOk');
  var itemEl=document.getElementById('leadItem'), errEl=document.getElementById('ldErr');
  var submitBtn=document.getElementById('ldSubmit');
  var currentItem='', currentLabel='';

  function open(item,label){
    currentItem=item||UI.generalTopic;
    currentLabel=label||currentItem;
    itemEl.textContent=UI.topicPrefix+currentLabel+(currentPrice?' · '+currentPrice:'');
    body.style.display=''; ok.style.display='none';
    errEl.textContent='';
    document.getElementById('ldName').value='';
    document.getElementById('ldContact').value='';
    document.getElementById('ldCountry').value='';
    document.getElementById('ldComment').value='';
    var pillsBox=document.getElementById('ldMethod');
    pillsBox.setAttribute('data-value','Telegram');
    pillsBox.querySelectorAll('.lead__pill').forEach(function(p){
      p.classList.toggle('on', p.getAttribute('data-v')==='Telegram');
    });
    wrap.classList.add('on'); wrap.setAttribute('aria-hidden','false');
    setTimeout(function(){document.getElementById('ldName').focus();},350);
  }
  document.querySelectorAll('.lead__pill').forEach(function(p){
    p.addEventListener('click',function(){
      var box=p.closest('.lead__pills');
      box.setAttribute('data-value', p.getAttribute('data-v'));
      box.querySelectorAll('.lead__pill').forEach(function(x){x.classList.remove('on');});
      p.classList.add('on');
    });
  });
  function close(){
    wrap.classList.remove('on'); wrap.setAttribute('aria-hidden','true');
  }

  document.querySelectorAll('[data-lead]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.preventDefault();
      var pr=(el.closest('.cap__b, .natal, .ws')||document).querySelector('.price:not([hidden]) .price__v');
      currentPrice=pr?pr.textContent:'';
      open(el.getAttribute('data-lead'), el.getAttribute('data-lead-label'));
    });
  });
  wrap.querySelectorAll('[data-close]').forEach(function(el){
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && wrap.classList.contains('on')) close();
  });

  submitBtn.addEventListener('click', function(){
    var name=document.getElementById('ldName').value.trim();
    var contact=document.getElementById('ldContact').value.trim();
    if(!name || !contact){
      errEl.textContent=UI.validationErr;
      return;
    }
    errEl.textContent='';
    submitBtn.disabled=true; submitBtn.textContent=UI.sending;

    var payload={
      name:name, contact:contact,
      method:document.getElementById('ldMethod').getAttribute('data-value'),
      country:document.getElementById('ldCountry').value.trim(),
      comment:(currentPrice?'Цена на сайте: '+currentPrice+(document.getElementById('ldComment').value.trim()?' · ':''):'')+document.getElementById('ldComment').value.trim(),
      interest:currentItem,
      page:location.href,
      lang:navigator.language||''
    };

    fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){ if(!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function(d){
        if(!d.ok) throw new Error(d.error||'unknown');
        body.style.display='none'; ok.style.display='block';
      })
      .catch(function(){
        errEl.textContent=UI.sendErr;
      })
      .finally(function(){
        submitBtn.disabled=false; submitBtn.textContent=UI.submitBtn;
      });
  });
})();

/* ── Закреплённая панель заявки: появляется после хиро, на мобильном разворачивается по клику ── */
(function(){
  var bar=document.getElementById('stickybar'); if(!bar) return;
  var toggle=document.getElementById('sbToggle'), form=document.getElementById('sbForm'),
      closeBtn=document.getElementById('sbClose'), submitBtn=document.getElementById('sbSubmit'),
      nameEl=document.getElementById('sbName'), contactEl=document.getElementById('sbContact'),
      methodEl=document.getElementById('sbMethod'), countryEl=document.getElementById('sbCountry'),
      commentEl=document.getElementById('sbComment'),
      errEl=document.getElementById('sbErr'), okEl=document.getElementById('sbOk');
  var hero=document.querySelector('.hero');
  var shown=false, submitLabel=submitBtn.textContent;

  bar.classList.add('show'); shown=true;

  toggle.addEventListener('click',function(){
    form.classList.add('open');
    toggle.classList.add('hidden');
    setTimeout(function(){nameEl.focus();},300);
  });
  closeBtn.addEventListener('click',function(){
    form.classList.remove('open');
    toggle.classList.remove('hidden');
  });

  submitBtn.addEventListener('click',function(){
    var name=nameEl.value.trim(), contact=contactEl.value.trim();
    if(!name||!contact){ errEl.textContent=UI.validationErr; return; }
    errEl.textContent=''; submitBtn.disabled=true; submitBtn.textContent=UI.sending;
    fetch('/api/lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      name:name, contact:contact, interest:'Общая заявка (закреплённая панель)',
      method:methodEl.value, country:countryEl.value.trim(), comment:commentEl.value.trim(),
      page:location.href, lang:navigator.language||''
    })})
    .then(function(r){ if(!r.ok) throw new Error(); return r.json(); })
    .then(function(d){
      if(!d.ok) throw new Error();
      form.classList.remove('open'); toggle.classList.remove('hidden');
      okEl.style.display='block';
      setTimeout(function(){okEl.style.display='none';},4000);
      nameEl.value=''; contactEl.value=''; countryEl.value=''; commentEl.value='';
    })
    .catch(function(){ errEl.textContent=UI.sendErr; })
    .finally(function(){ submitBtn.disabled=false; submitBtn.textContent=submitLabel; });
  });
})();


/* ── v2 · 30.09.2026: переключатель языка прячется при скролле вниз ── */
(function(){
  var el=document.querySelector('.langsw-top'); if(!el) return;
  var last=window.scrollY, ticking=false;
  window.addEventListener('scroll',function(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      var y=window.scrollY;
      if(y>140 && y>last+4) el.classList.add('is-hidden');
      else if(y<last-4 || y<=140) el.classList.remove('is-hidden');
      last=y; ticking=false;
    });
  },{passive:true});
})();
