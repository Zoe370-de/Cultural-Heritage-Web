import { Router } from 'express';
import axios from 'axios';
import { BAILIAN_CONFIG } from '../config/ai.js';

const router = Router();

// 本地知识库 - 当远程AI服务不可用时使用
const localKnowledge = {
  '传统节日': '中国重要的传统节日包括：\n🏮 春节（农历正月初一）：贴春联、放鞭炮、吃年夜饭，是最重要的传统节日\n🐉 端午节（农历五月初五）：赛龙舟、吃粽子、挂艾草，纪念屈原，已列入人类非遗\n🌕 中秋节（农历八月十五）：赏月、吃月饼、家人团聚\n🏮 元宵节（农历正月十五）：赏花灯、猜灯谜、吃汤圆\n🎋 清明节：扫墓祭祖、踏青、放风筝\n二十四节气于2016年被列入联合国教科文组织人类非遗代表作名录。',
  '端午节': '端午节是中国首个入选联合国教科文组织人类非遗的节日（2009年）。\n🐉 主要习俗：赛龙舟、吃粽子、挂艾草菖蒲、饮雄黄酒、佩香囊\n🌿 文化意义：纪念屈原，祛病防疫，祈求安康\n🌏 分布：全国各地都有庆祝，以湖南汨罗、浙江嘉兴、湖北秭归最为著名',
  '端午': '端午节是中国首个入选联合国教科文组织人类非遗的节日（2009年）。\n🐉 主要习俗：赛龙舟、吃粽子、挂艾草菖蒲、饮雄黄酒、佩香囊\n🌿 文化意义：纪念屈原，祛病防疫，祈求安康\n🌏 分布：全国各地都有庆祝，以湖南汨罗、浙江嘉兴、湖北秭归最为著名',
  '旅游': '推荐中国非遗文化旅游路线：\n📍 北京：故宫、颐和园、天坛，感受京剧、景泰蓝等宫廷非遗文化\n📍 苏州：苏州园林、平江路，体验昆曲、苏绣、苏州评弹\n📍 景德镇：古窑民俗博览区，亲手体验千年瓷都的制瓷技艺\n📍 西安：兵马俑、钟鼓楼，欣赏皮影戏、秦腔表演\n📍 成都：锦里、宽窄巷子，看川剧变脸、品盖碗茶\n📍 杭州：西湖、中国丝绸博物馆，了解蚕桑丝织技艺\n最佳旅游季节：春季（3-5月）和秋季（9-11月），气候宜人，适合深度文化之旅。',
  '春节': '春节是中国最重要的传统节日，俗称"过年"。\n🧧 主要习俗：贴春联、放鞭炮、吃年夜饭、发红包、拜年\n🏮 特色活动：舞龙舞狮、逛庙会、看春晚、守岁\n📅 时间：农历正月初一，是中华民族最隆重的团圆时刻',
  '过年': '春节是中国最重要的传统节日，俗称"过年"。\n🧧 主要习俗：贴春联、放鞭炮、吃年夜饭、发红包、拜年\n🏮 特色活动：舞龙舞狮、逛庙会、看春晚、守岁\n📅 时间：农历正月初一，是中华民族最隆重的团圆时刻',
  '中秋节': '中秋节是中国传统的团圆佳节。\n🥮 主要习俗：赏月、吃月饼、提灯笼、猜灯谜\n🌕 文化内涵：寄托思念，期盼团圆，象征丰收\n🏯 著名景点：杭州西湖赏月、南京夫子庙灯会',
  '中秋': '中秋节是中国传统的团圆佳节。\n🥮 主要习俗：赏月、吃月饼、提灯笼、猜灯谜\n🌕 文化内涵：寄托思念，期盼团圆，象征丰收\n🏯 著名景点：杭州西湖赏月、南京夫子庙灯会',
  '美食': '中国非遗美食文化丰富多样：\n🍜 北京烤鸭：挂炉烤制，皮脆肉嫩，国家级非遗\n🥟 饺子：北方春节必备，寓意团圆\n🍲 火锅：川渝火锅麻辣鲜香，各地风味各异\n🍡 糖画：以糖为墨，在石板上绘制各种图案，传统手工艺\n🥮 月饼：中秋传统糕点，各地风味不同\n🍵 茶文化：中国茶艺是国家级非遗，西湖龙井、碧螺春等名茶享誉世界\n中国饮食文化博大精深，八大菜系各具特色。',
  '舞蹈': '中国非遗传统舞蹈形式多样：\n🦁 舞狮：南狮北狮各具特色，春节期间最受欢迎\n🐉 舞龙：祈求风调雨顺，场面壮观\n💃 秧歌：北方民间舞蹈，欢快热烈\n🎭 傩舞：古老祭祀舞蹈，面具文化独特\n🥁 腰鼓舞：陕北安塞腰鼓，气势磅礴\n🎵 花鼓灯：安徽民间舞蹈，已被列入国家级非遗\n中国传统舞蹈注重"形神兼备"，讲究身韵与气韵的结合。',
  '语言': '中国语言文字博大精深：\n📝 汉字：世界上最古老的文字之一，从甲骨文演变至今\n🗣️ 汉语：使用人数最多的语言，包含普通话和多种方言\n📚 书法：中国书法于2009年列入人类非遗，包含篆、隶、楷、行、草五种书体\n🌏 方言：粤语、闽南语、吴语、客家话等，各有特色\n📖 篆刻：金石篆刻于2009年列入人类非遗，西泠印社是代表\n中国非遗中与文字相关的项目包括：书法、篆刻、木活字印刷术等。',
  '非遗': '中国非遗概况：\n🏆 中国已有43个项目列入联合国教科文组织非遗名录，位居世界第一\n📋 国家级非遗代表性项目超过1500项\n🎭 代表类别：传统戏剧（京剧、昆曲）、传统美术（剪纸、刺绣）、传统技艺（陶瓷、织锦）、传统医药（中医针灸）、民俗（端午节、二十四节气）\n👤 国家级非遗代表性传承人超过3000人\n🏛️ 2005年建立国家级非遗名录体系，2011年《非遗法》正式施行',
  '京剧': '京剧是中国国粹，形成于清代乾隆年间：\n🎭 四大名旦：梅兰芳、程砚秋、尚小云、荀慧生\n🎭 角色行当：生、旦、净、末、丑\n🎭 表演形式：唱、念、做、打\n🎭 代表剧目：《贵妃醉酒》《霸王别姬》《四郎探母》《将相和》\n🎭 2010年列入人类非遗代表作名录\n京剧融合了徽剧、汉调等剧种精华，经过两百多年发展，成为影响最大的戏曲剧种。',
  '昆曲': '昆曲被誉为"百戏之祖"：\n🎭 发源于江苏昆山，距今已有600多年历史\n🎭 2001年列入人类非遗代表作名录，是中国首个获此殊荣的项目\n🎭 代表剧目：《牡丹亭》《长生殿》《桃花扇》\n🎭 艺术特点：唱腔婉转、表演细腻、文辞典雅\n🎭 昆曲对京剧、川剧等众多剧种产生了深远影响',
  '苏绣': '苏绣是中国四大名绣之首：\n🧵 发源地：江苏苏州\n🧵 特点：针法细腻、色彩典雅、图案秀丽\n🧵 代表技法：双面绣——正反两面图案不同，令人叹为观止\n🧵 一根丝线可劈成1/128根使用\n🧵 国家级非遗传承人：姚建萍，开创"融针绣"技法\n🧵 代表作品：《猫》《丝绸之路》等',
  '景德镇': '景德镇是千年瓷都：\n🏺 制瓷历史始于汉代，有"瓷都"之美誉\n🏺 手工制瓷技艺包含72道工序\n🏺 代表品种：青花瓷、玲珑瓷、粉彩瓷、颜色釉\n🏺 国家级传承人：黄云鹏（仿古瓷第一人）、秦锡麟（现代青花开创者）\n🏺 景德镇御窑厂是明清两代皇家瓷厂\n🏺 青花瓷以典雅蓝色图案闻名世界，远销海外',
  '皮影': '皮影戏被称为"电影的鼻祖"：\n🎬 利用灯光照射兽皮制成的人物剪影来表演故事\n🎬 2011年列入人类非遗代表作名录\n🎬 国家级传承人：汪天稳（中国皮影雕刻第一人）\n🎬 主要流派：陕西皮影、唐山皮影、甘肃皮影等\n🎬 制作工序：选皮、制皮、画稿、雕刻、敷彩、装订',
  '皮影戏': '皮影戏被称为"电影的鼻祖"：\n🎬 利用灯光照射兽皮制成的人物剪影来表演故事\n🎬 2011年列入人类非遗代表作名录\n🎬 国家级传承人：汪天稳（中国皮影雕刻第一人）\n🎬 主要流派：陕西皮影、唐山皮影、甘肃皮影等\n🎬 制作工序：选皮、制皮、画稿、雕刻、敷彩、装订',
  '蜀锦': '蜀锦是中国四大名锦之一：\n🧣 发源地：四川成都，已有两千多年历史\n🧣 与南京云锦、苏州宋锦、广西壮锦并称四大名锦\n🧣 国家级传承人：贺斌，掌握全套织造工艺\n🧣 曾作为皇家贡品，图案精美、工艺复杂\n🧣 唐代"陵阳公样"等失传纹样已被复原',
  '川剧': '川剧是巴蜀文化瑰宝：\n🎭 变脸绝活享誉世界，演员瞬间变换脸谱\n🎭 国家级非遗传承人：陈巧茹（二度梅得主）\n🎭 代表剧目：《白蛇传》《拉郎配》等\n🎭 艺术特点：幽默风趣、生活气息浓厚\n🎭 川剧高腔是重要声腔之一',
  '秦腔': '秦腔是中国最古老的戏曲剧种之一：\n🎭 发源于陕西，又称"梆子腔"\n🎭 国家级非遗传承人：李梅（二度梅得主）\n🎭 代表剧目：《再续红梅缘》《三滴血》等\n🎭 艺术特点：唱腔高亢激昂、表演粗犷豪放\n🎭 被誉为"中国戏曲的活化石"',
  '西安鼓乐': '西安鼓乐被誉为"中国古代音乐活化石"：\n🎵 2009年列入人类非遗代表作名录\n🎵 保留唐宋宫廷音乐遗韵\n🎵 使用的乐谱（俗字谱）为宋代流传\n🎵 乐器：笙、笛、管、鼓等\n🎵 与唐代燕乐有密切渊源关系',
  '金石篆刻': '金石篆刻是文人艺术代表：\n📜 2009年列入人类非遗代表作名录\n📜 西泠印社被誉为"天下第一名社"\n📜 当代篆刻泰斗：刘江（西泠印社执行社长）\n📜 篆刻三法：篆法、章法、刀法\n📜 与书法、绘画并称"诗书画印"四绝',
  '篆刻': '中国篆刻于2009年被列入联合国人类非遗代表作名录。\n🖋️ 特点：书法、章法、刀法三位一体\n🎨 用途：印章艺术，用于书画、收藏\n📜 流派：浙派、皖派、吴派等\n🌟 价值：方寸之间展现金石之美，是文人雅士的必备',
  '刺绣': '中国刺绣历史悠久，四大名绣各具特色：\n🧵 苏绣（苏州）：针法细腻、双面绣闻名\n🧵 蜀绣（成都）：色彩鲜艳、立体感强\n🧵 湘绣（湖南）：以狮虎题材著称\n🧵 粤绣（广东）：金银线绣、垫高绣\n🧵 2009年，中国传统蚕桑丝织技艺列入人类非遗',
  '剪纸': '剪纸是中国民间最普及的艺术形式之一，2009年入选联合国人类非遗代表作名录。\n✂️ 特点：取材广泛、造型生动、线条流畅\n🎨 风格：北方粗犷豪放、南方细腻精致\n🏮 用途：窗花、喜花、年画、装饰\n🌟 著名流派：陕西剪纸、山西剪纸、广东剪纸',
  '古琴': '古琴艺术是中国最早的弹拨乐器之一，2003年入选联合国人类非遗代表作名录。\n🎹 特点：音色深沉、余音悠长、意境深远\n📜 文化地位：文人四艺（琴棋书画）之首\n🎵 名曲：《广陵散》《高山流水》《梅花三弄》《平沙落雁》\n🏺 历史：有3000多年历史，是中国古代文化的重要象征',
  '二十四节气': '二十四节气于2016年被列入联合国人类非遗代表作名录。\n🌿 内容：立春、雨水、惊蛰、春分、清明、谷雨\n🌞 特点：指导农事、反映季节变化、体现自然规律\n📜 起源：中国古代黄河流域，已有2000多年历史\n🎋 文化价值：体现了中国人对自然的深刻理解和尊重',
  '太极拳': '太极拳于2020年被列入联合国人类非遗代表作名录。\n🥋 特点：刚柔并济、虚实相生、动静结合\n📜 流派：陈式、杨式、武式、吴式、孙式\n🌿 功效：强身健体、修身养性、防身自卫\n🏛️ 起源：河南温县陈家沟，明末清初由陈王廷创立',
  '针灸': '中医针灸于2010年被列入联合国人类非遗代表作名录。\n💉 内容：针刺和艾灸两种疗法\n📜 理论基础：中医经络学说\n🏥 功效：治疗疾病、保健养生\n🌏 历史：有2000多年历史，是中医的重要组成部分',
  '书法': '中国书法于2009年被列入联合国人类非遗代表作名录。\n✍️ 字体：篆书、隶书、楷书、行书、草书\n🎨 名家：王羲之、颜真卿、柳公权、欧阳询\n📜 文化地位：文人四艺之一，是中华文化的核心艺术\n🌟 价值：不仅是文字书写，更是一种艺术表达',
  '茶文化': '中国传统制茶技艺于2022年被列入联合国非遗代表作名录。\n🍵 种类：绿茶、红茶、乌龙茶、白茶、黄茶、黑茶\n🍃 特点：讲究茶的色、香、味、形\n🏮 茶道：注重礼仪和精神内涵\n🌏 传播：中国是茶叶的故乡，茶文化影响深远',
  '景泰蓝': '景泰蓝制作技艺是北京传统工艺，国家级非遗。\n🎨 学名：铜胎掐丝珐琅\n🖌️ 工艺：制胎、掐丝、点蓝、烧蓝、磨光、镀金\n💎 特点：色彩绚丽、造型典雅、金碧辉煌\n🏛️ 历史：明代景泰年间最为兴盛，故名景泰蓝',
  '介绍': '我是非遗文化AI助手，可以帮你解答中国非物质文化遗产相关问题。目前我能为你介绍：\n\n🏮 **传统节日**：端午节、春节、中秋节、二十四节气等\n🎭 **传统戏剧**：京剧、昆曲、川剧、秦腔、皮影戏、西安鼓乐等\n🏺 **传统技艺**：苏绣、蜀锦、刺绣、剪纸、景泰蓝、景德镇瓷器、茶文化等\n🖌️ **传统美术**：书法、篆刻等\n🏃 **传统体育医药**：太极拳、中医针灸等\n\n你可以直接问我具体项目，比如：\n• 端午节有哪些习俗？\n• 苏绣有什么特点？\n• 京剧和昆曲有什么区别？\n• 景德镇瓷器为什么有名？\n• 川剧变脸有什么奥秘？',
  '你能': '我是非遗文化AI助手，可以帮你解答中国非物质文化遗产相关问题。目前我能为你介绍：\n\n🏮 **传统节日**：端午节、春节、中秋节、二十四节气等\n🎭 **传统戏剧**：京剧、昆曲、川剧、秦腔、皮影戏、西安鼓乐等\n🏺 **传统技艺**：苏绣、蜀锦、刺绣、剪纸、景泰蓝、景德镇瓷器、茶文化等\n🖌️ **传统美术**：书法、篆刻等\n🏃 **传统体育医药**：太极拳、中医针灸等\n\n你可以直接问我具体项目，比如：\n• 端午节有哪些习俗？\n• 苏绣有什么特点？\n• 京剧和昆曲有什么区别？\n• 景德镇瓷器为什么有名？\n• 川剧变脸有什么奥秘？',
  '介绍一下': '我是非遗文化AI助手，可以帮你解答中国非物质文化遗产相关问题。目前我能为你介绍：\n\n🏮 **传统节日**：端午节、春节、中秋节、二十四节气等\n🎭 **传统戏剧**：京剧、昆曲、川剧、秦腔、皮影戏、西安鼓乐等\n🏺 **传统技艺**：苏绣、蜀锦、刺绣、剪纸、景泰蓝、景德镇瓷器、茶文化等\n🖌️ **传统美术**：书法、篆刻等\n🏃 **传统体育医药**：太极拳、中医针灸等\n\n你可以直接问我具体项目，比如：\n• 端午节有哪些习俗？\n• 苏绣有什么特点？\n• 京剧和昆曲有什么区别？\n• 景德镇瓷器为什么有名？\n• 川剧变脸有什么奥秘？',
  '功能': '我是非遗文化AI助手，可以帮你解答中国非物质文化遗产相关问题。目前我能为你介绍：\n\n🏮 **传统节日**：端午节、春节、中秋节、二十四节气等\n🎭 **传统戏剧**：京剧、昆曲、川剧、秦腔、皮影戏、西安鼓乐等\n🏺 **传统技艺**：苏绣、蜀锦、刺绣、剪纸、景泰蓝、景德镇瓷器、茶文化等\n🖌️ **传统美术**：书法、篆刻等\n🏃 **传统体育医药**：太极拳、中医针灸等\n\n你可以直接问我具体项目，比如：\n• 端午节有哪些习俗？\n• 苏绣有什么特点？\n• 京剧和昆曲有什么区别？\n• 景德镇瓷器为什么有名？\n• 川剧变脸有什么奥秘？',
};

// 获取本地响应
const getLocalResponse = (question) => {
  const q = question.toLowerCase();
  for (const [key, answer] of Object.entries(localKnowledge)) {
    if (q.includes(key)) return answer;
  }
  return '中国是世界非物质文化遗产大国，已有43个项目列入联合国教科文组织非遗名录，位居世界第一。包括昆曲、京剧、古琴艺术、中国书法、二十四节气、端午节、中医针灸等。\n\n中国非遗涵盖传统戏剧、传统美术、传统技艺、传统医药、民俗等多个类别，遍布全国各地。如果你想了解更多，可以问我：\n• 中国有哪些世界级非遗？\n• 京剧和昆曲有什么区别？\n• 景德镇瓷器有什么特点？\n• 端午节有哪些习俗？\n• 苏绣和蜀绣有什么不同？\n• 西安鼓乐是什么？\n• 川剧变脸有什么奥秘？\n• 皮影戏是怎么制作的？';
};

// 模拟流式响应
const sendLocalStreamResponse = (res, text) => {
  let index = 0;
  const sendChunk = () => {
    if (index >= text.length) {
      res.write(Buffer.from('data: [DONE]\n\n', 'utf8'));
      res.end();
      return;
    }
    
    const chunkSize = Math.floor(Math.random() * 8) + 3;
    const chunk = text.slice(index, index + chunkSize);
    const jsonData = JSON.stringify({ content: chunk });
    const sseLine = `data: ${jsonData}\n\n`;
    res.write(Buffer.from(sseLine, 'utf8'));
    index += chunkSize;
    
    // 使用较短的延迟确保快速响应
    setTimeout(sendChunk, 20 + Math.random() * 30);
  };
  
  // 立即开始发送，不延迟
  setTimeout(sendChunk, 50);
};

// SSE streaming AI tourism/culture chat
router.get('/recommend', async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // 检查API Key是否有效配置
  const isValidApiKey = BAILIAN_CONFIG.apiKey && BAILIAN_CONFIG.apiKey !== 'your-api-key-here' && BAILIAN_CONFIG.apiKey.length > 10;
  
  // 如果没有有效的API Key，直接使用本地知识库
  if (!isValidApiKey) {
    console.log('No valid API Key configured, using local knowledge base');
    const localAnswer = getLocalResponse(prompt);
    sendLocalStreamResponse(res, localAnswer);
    return;
  }

  try {
    const response = await axios({
      method: 'POST',
      url: BAILIAN_CONFIG.apiUrl,
      headers: {
        'Authorization': `Bearer ${BAILIAN_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: BAILIAN_CONFIG.models.text,
        messages: [
          {
            role: 'system',
            content: '你是中国非遗文化专家AI助手，精通中国传统技艺、戏曲、民俗、节日、美食、服饰、建筑、艺术等领域的知识。请根据用户的问题，提供专业、详尽的中国非遗文化解读。回答请使用中文，语气亲切友好，多举实际的非遗项目和传承人例子。'
          },
          { role: 'user', content: prompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      },
      responseType: 'stream',
      timeout: 30000 // 缩短超时时间到30秒
    });

    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // skip unparseable chunks
          }
        }
      }
    });

    response.data.on('end', () => {
      if (buffer) {
        const line = buffer.trim();
        if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6).trim());
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) { /* skip */ }
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', (err) => {
      console.log('Remote AI service error, falling back to local knowledge');
      const localAnswer = getLocalResponse(prompt);
      sendLocalStreamResponse(res, localAnswer);
    });

  } catch (e) {
    console.log('Remote AI connection failed, falling back to local knowledge:', e.message);
    const localAnswer = getLocalResponse(prompt);
    sendLocalStreamResponse(res, localAnswer);
  }

  req.on('close', () => {
    res.end();
  });
});

// SSE streaming AI image analysis
router.post('/analyze-image', async (req, res) => {
  const { imageBase64, prompt } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  try {
    const userPrompt = prompt || '请分析这张图片中的中国非遗文化元素，包括但不限于传统服饰、建筑、工艺品、书法、戏曲等方面，提供详细的文化解读。';

    const response = await axios({
      method: 'POST',
      url: BAILIAN_CONFIG.apiUrl,
      headers: {
        'Authorization': `Bearer ${BAILIAN_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: BAILIAN_CONFIG.models.vision,
        messages: [
          {
            role: 'system',
            content: '你是中国非遗文化图像分析专家，擅长识别和分析中国传统服饰、建筑、工艺品、书法、戏曲脸谱等视觉元素。请用专业且易懂的中文进行详细解读。'
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: 'text', text: userPrompt }
            ]
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1500
      },
      responseType: 'stream',
      timeout: 60000
    });

    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) { /* skip */ }
        }
      }
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', () => {
      res.write(`data: ${JSON.stringify({ error: 'AI视觉分析服务暂时不可用' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });

  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: 'AI视觉分析连接失败，请检查API Key配置' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }

  req.on('close', () => {
    res.end();
  });
});

export default router;
