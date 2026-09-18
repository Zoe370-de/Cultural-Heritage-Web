<template>
  <div class="ai-chat">
    <button class="ai-toggle" :class="{ 'active': isOpen }" @click="toggleChat" title="AI文化助手">
      <span class="ai-toggle-icon">🤖</span>
    </button>

    <div class="ai-panel" :class="{ 'show': isOpen }">
      <div class="ai-header">
        <div class="ai-header-left">
          <span class="ai-avatar">🤖</span>
          <div>
            <h3>AI文化助手</h3>
            <p>非遗文化智能问答</p>
          </div>
        </div>
        <button class="ai-close" @click="isOpen = false">✕</button>
      </div>

      <div class="ai-messages" ref="messagesRef">
        <div class="ai-welcome">
          <div class="welcome-icon">🏮</div>
          <p>你好！我是非遗文化AI助手，可以为你解答关于中国非物质文化遗产的各种问题，包括传统技艺、戏曲、节庆、美食等。试试问我吧！</p>
          <div class="quick-questions">
            <button v-for="q in quickQuestions" :key="q" class="quick-btn" @click="sendQuick(q)">{{ q }}</button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i" class="ai-message" :class="msg.role">
          <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
          <div class="msg-content">
            <div class="msg-text">{{ msg.content }}</div>
            <div v-if="msg.role === 'assistant' && msg.isStreaming" class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="ai-input">
        <input
          v-model="inputText"
          type="text"
          placeholder="输入问题，探索非遗文化..."
          @keyup.enter="sendMessage"
          :disabled="isStreaming"
        >
        <button class="send-btn" @click="sendMessage" :disabled="isStreaming || !inputText.trim()">
          <span>发送</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { streamAIRecommend } from '../api/ai.js';

const isOpen = ref(false);
const inputText = ref('');
const messages = ref([]);
const isStreaming = ref(false);
const messagesRef = ref(null);

const quickQuestions = [
  '中国有哪些世界级非遗？',
  '京剧和昆曲有什么区别？',
  '景德镇瓷器有什么特点？',
  '端午节有哪些习俗？'
];

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => scrollBottom());
  }
};

const sendQuick = (q) => {
  inputText.value = q;
  sendMessage();
};

const localKnowledge = {
  '传统节日': '中国非物质文化遗产中的传统节日丰富多彩：\n🏮 端午节：赛龙舟、吃粽子、挂艾草，2009年入选人类非遗代表作名录\n🏮 春节：中国最重要的传统节日，贴春联、放鞭炮、吃年夜饭\n🏮 中秋节：赏月、吃月饼、家人团圆，承载着中华民族的文化记忆\n🏮 清明节：扫墓祭祖、踏青、放风筝，慎终追远的传统美德\n🏮 元宵节：赏花灯、猜灯谜、吃元宵，春节庆祝活动的压轴戏\n🏮 七夕节：源于牛郎织女传说，是中国传统的"情人节"',
  '端午节': '端午节是中国首个入选联合国教科文组织人类非遗的节日（2009年）。\n🐉 主要习俗：赛龙舟、吃粽子、挂艾草菖蒲、饮雄黄酒、佩香囊\n🌿 文化意义：纪念屈原，祛病防疫，祈求安康\n🌏 分布：全国各地都有庆祝，以湖南汨罗、浙江嘉兴、湖北秭归最为著名',
  '春节': '春节是中国最重要的传统节日，俗称"过年"。\n🧧 主要习俗：贴春联、放鞭炮、吃年夜饭、发红包、拜年\n🏮 特色活动：舞龙舞狮、逛庙会、看春晚、守岁\n📅 时间：农历正月初一，是中华民族最隆重的团圆时刻',
  '中秋节': '中秋节是中国传统的团圆佳节。\n🥮 主要习俗：赏月、吃月饼、提灯笼、猜灯谜\n🌕 文化内涵：寄托思念，期盼团圆，象征丰收\n🏯 著名景点：杭州西湖赏月、南京夫子庙灯会',
  '戏曲': '中国戏曲非遗瑰宝：\n🎭 京剧：中国国粹，融合唱念做打，2010年入选人类非遗代表作名录\n🎭 昆曲：百戏之祖，2001年首批入选人类非遗，典雅婉转\n🎭 越剧：江南灵秀，以《梁祝》《红楼梦》闻名\n🎭 秦腔：中国最古老的戏曲剧种之一，高亢激昂\n🎭 川剧：变脸绝技惊艳世界，2006年入选国家级非遗\n🎭 皮影戏：电影的鼻祖，2011年入选人类非遗',
  '京剧': '京剧被誉为"中国国粹"，2010年入选联合国人类非遗代表作名录。\n🎭 四大行当：生、旦、净、丑\n🎵 四大名旦：梅兰芳、程砚秋、尚小云、荀慧生\n🎨 表演形式：唱、念、做、打\n🏛️ 经典剧目：《霸王别姬》《贵妃醉酒》《空城计》《三岔口》',
  '昆曲': '昆曲被誉为"百戏之祖"，2001年成为中国首个入选联合国人类非遗的项目。\n🎭 起源：江苏昆山，明代嘉靖年间形成\n🎵 特点：曲调婉转典雅，唱词典雅优美\n📜 经典剧目：《牡丹亭》《长生殿》《桃花扇》《玉簪记》\n🎨 表演：载歌载舞，身段优美',
  '瓷器': '中国陶瓷类非遗：\n🏺 景德镇手工制瓷技艺：千年瓷都，72道工序的精湛工艺\n🏺 龙泉青瓷烧制技艺：2009年入选人类非遗，青如玉、明如镜\n🏺 宜兴紫砂陶制作技艺：紫砂壶天下闻名，2006年入选国家级非遗\n🏺 德化白瓷烧制技艺：中国白瓷代表，瓷质洁白细腻\n🏺 唐三彩烧制技艺：唐代彩色釉陶，绚丽多彩的艺术瑰宝',
  '景德镇': '景德镇被誉为"千年瓷都"，景德镇手工制瓷技艺是国家级非遗。\n🏺 制瓷工艺：72道精细工序，从选土到成瓷\n🎨 著名瓷器：青花瓷、玲珑瓷、粉彩瓷、颜色釉瓷\n🏛️ 景点：古窑民俗博览区、景德镇御窑厂、中国陶瓷博物馆\n🌏 历史：制瓷历史超过2000年，宋代以来就是皇家御窑所在地',
  '美食': '中国饮食类非遗丰富多样：\n🍵 茶文化：中国茶艺涵盖绿茶、红茶、乌龙茶等，2022年入选人类非遗\n🍜 传统面食制作：兰州拉面、山西刀削面等技艺精湛\n🥟 饺子制作技艺：北方传统美食，春节必备，皮薄馅大\n🥮 月饼制作技艺：广式、苏式、京式等各具特色\n🍶 白酒酿造技艺：茅台、五粮液等，传统固态发酵工艺\n🍯 豆腐制作技艺：传承两千多年，中式烹饪的智慧结晶',
  '技艺': '中国传统手工技艺非遗：\n🪡 苏绣：中国四大名绣之首，2006年入选国家级非遗\n🪡 剪纸：2009年入选人类非遗，民间最普及的艺术形式\n🪡 景泰蓝制作技艺：北京传统工艺，铜胎掐丝珐琅\n🪡 木雕技艺：东阳木雕、潮州木雕各具特色\n🪡 竹编技艺：东阳竹编、四川青神竹编等\n🪡 中国篆刻：金石艺术，2009年入选人类非遗',
  '苏绣': '苏绣是中国四大名绣之首，2006年入选国家级非遗。\n🪡 特点：针法精细、色彩典雅、题材广泛\n🎨 代表作：《猫》《百鸟朝凤》《金鱼》\n🏛️ 产地：江苏苏州，有2000多年历史\n🌟 特色：双面绣、乱针绣等独特技法',
  '剪纸': '剪纸是中国民间最普及的艺术形式之一，2009年入选联合国人类非遗代表作名录。\n✂️ 特点：取材广泛、造型生动、线条流畅\n🎨 风格：北方粗犷豪放、南方细腻精致\n🏮 用途：窗花、喜花、年画、装饰\n🌟 著名流派：陕西剪纸、山西剪纸、广东剪纸',
  '联合国': '中国已有43个项目列入联合国教科文组织非物质文化遗产名录，位居世界第一。\n主要入选项目包括：\n• 昆曲（2001年）\n• 古琴艺术（2003年）\n• 新疆维吾尔木卡姆艺术（2005年）\n• 蒙古族长调民歌（2005年）\n• 中国篆刻（2009年）\n• 中国雕版印刷技艺（2009年）\n• 中国书法（2009年）\n• 中国剪纸（2009年）\n• 端午节（2009年）\n• 京剧（2010年）\n• 中医针灸（2010年）\n• 皮影戏（2011年）\n• 珠算（2013年）\n• 二十四节气（2016年）\n• 太极拳（2020年）\n• 送王船（2020年）\n• 中国传统制茶技艺（2022年）',
  '古琴': '古琴艺术是中国最早的弹拨乐器之一，2003年入选联合国人类非遗代表作名录。\n🎹 特点：音色深沉、余音悠长、意境深远\n📜 文化地位：文人四艺（琴棋书画）之首\n🎵 名曲：《广陵散》《高山流水》《梅花三弄》《平沙落雁》\n🏺 历史：有3000多年历史，是中国古代文化的重要象征',
  '皮影戏': '皮影戏被誉为"电影的鼻祖"，2011年入选联合国人类非遗代表作名录。\n🎬 特点：光影艺术、傀儡戏、手工雕刻\n🎨 制作：驴皮或牛皮雕刻，色彩鲜艳\n🎭 分布：陕西华县皮影、河北唐山皮影、四川皮影等\n🌟 文化意义：集绘画、雕刻、音乐、表演于一体',
  '二十四节气': '二十四节气于2016年被列入联合国人类非遗代表作名录。\n🌿 内容：立春、雨水、惊蛰、春分、清明、谷雨\n🌞 特点：指导农事、反映季节变化、体现自然规律\n📜 起源：中国古代黄河流域，已有2000多年历史\n🎋 文化价值：体现了中国人对自然的深刻理解和尊重',
  '太极拳': '太极拳于2020年被列入联合国人类非遗代表作名录。\n🥋 特点：刚柔并济、虚实相生、动静结合\n📜 流派：陈式、杨式、武式、吴式、孙式\n🌿 功效：强身健体、修身养性、防身自卫\n🏛️ 起源：河南温县陈家沟，明末清初由陈王廷创立',
  '针灸': '中医针灸于2010年被列入联合国人类非遗代表作名录。\n💉 内容：针刺和艾灸两种疗法\n📜 理论基础：中医经络学说\n🏥 功效：治疗疾病、保健养生\n🌏 历史：有2000多年历史，是中医的重要组成部分',
  '书法': '中国书法于2009年被列入联合国人类非遗代表作名录。\n✍️ 字体：篆书、隶书、楷书、行书、草书\n🎨 名家：王羲之、颜真卿、柳公权、欧阳询\n📜 文化地位：文人四艺之一，是中华文化的核心艺术\n🌟 价值：不仅是文字书写，更是一种艺术表达',
  '篆刻': '中国篆刻于2009年被列入联合国人类非遗代表作名录。\n🖋️ 特点：书法、章法、刀法三位一体\n🎨 用途：印章艺术，用于书画、收藏\n📜 流派：浙派、皖派、吴派等\n🌟 价值：方寸之间展现金石之美，是文人雅士的必备',
  '茶文化': '中国传统制茶技艺于2022年被列入联合国人类非遗代表作名录。\n🍵 种类：绿茶、红茶、乌龙茶、白茶、黄茶、黑茶\n🍃 特点：讲究茶的色、香、味、形\n🏮 茶道：注重礼仪和精神内涵\n🌏 传播：中国是茶叶的故乡，茶文化影响深远',
  '蜀锦': '蜀锦织造技艺是国家级非遗，有2000多年历史。\n🧣 特点：色彩鲜艳、图案精美、质地厚重\n🎨 传统图案：云气纹、鸟兽纹、几何纹\n🏛️ 产地：四川成都，是中国四大名锦之一\n🌟 历史：汉代以来就是皇家贡品，被誉为"锦绣中华"',
  '景泰蓝': '景泰蓝制作技艺是北京传统工艺，国家级非遗。\n🎨 学名：铜胎掐丝珐琅\n🖌️ 工艺：制胎、掐丝、点蓝、烧蓝、磨光、镀金\n💎 特点：色彩绚丽、造型典雅、金碧辉煌\n🏛️ 历史：明代景泰年间最为兴盛，故名景泰蓝',
  '刺绣': '中国刺绣是传统手工技艺的瑰宝：\n🪡 四大名绣：苏绣、湘绣、粤绣、蜀绣\n🎨 特点：针法多样、色彩丰富、形象生动\n🏛️ 产地：各地有不同风格和特色\n🌟 文化价值：体现了中国女性的巧手和智慧',
  '舞狮': '舞狮是中国传统民间舞蹈，各地有不同流派。\n🦁 流派：北狮（河北）、南狮（广东）\n🎵 配乐：锣鼓、钹、唢呐\n🏮 用途：节庆表演、开业庆典、祈福驱邪\n🌟 文化意义：象征吉祥如意，展现民族精神',
  '舞龙': '舞龙是中国传统民间舞蹈，历史悠久。\n🐉 特点：龙身由多节组成，舞者协调配合\n🎵 配乐：锣鼓喧天，气势磅礴\n🏮 用途：节庆表演、祈求风调雨顺\n🌟 文化意义：龙是中华民族的图腾，舞龙体现民族凝聚力',
  '庙会': '庙会是中国传统的民俗活动。\n🏮 特点：集宗教、娱乐、商贸于一体\n🎭 活动：舞龙舞狮、戏曲表演、小吃摊点\n📅 时间：多在春节、元宵节等传统节日\n🌟 文化意义：传承民俗文化，促进社区交流',
  '灯会': '灯会是中国传统的民俗活动，历史悠久。\n🏮 特点：各式各样的彩灯，造型精美\n🎨 制作：传统工艺与现代技术结合\n🏛️ 著名灯会：自贡灯会、南京夫子庙灯会、西安城墙灯会\n🌟 文化意义：照亮节日夜晚，传递美好祝福',
};

const generateLocalResponse = (question) => {
  const q = question.toLowerCase();
  const keywordMap = {
    '端午': '端午节',
    '粽子': '端午节',
    '龙舟': '端午节',
    '屈原': '端午节',
    '春节': '春节',
    '过年': '春节',
    '除夕': '春节',
    '中秋': '中秋节',
    '月饼': '中秋节',
    '赏月': '中秋节',
    '京剧': '京剧',
    '国粹': '京剧',
    '昆曲': '昆曲',
    '百戏之祖': '昆曲',
    '牡丹亭': '昆曲',
    '瓷器': '瓷器',
    '景德镇': '景德镇',
    '陶瓷': '瓷器',
    '苏绣': '苏绣',
    '刺绣': '刺绣',
    '四大名绣': '刺绣',
    '剪纸': '剪纸',
    '窗花': '剪纸',
    '古琴': '古琴',
    '古筝': '古琴',
    '广陵散': '古琴',
    '皮影戏': '皮影戏',
    '皮影': '皮影戏',
    '二十四节气': '二十四节气',
    '节气};': '二十四节气',
    '太极': '太极拳',
    '太极拳': '太极拳',
    '针灸': '针灸',
    '中医': '针灸',
    '书法': '书法',
    '毛笔': '书法',
    '篆刻': '篆刻',
    '印章': '篆刻',
    '茶': '茶文化',
    '茶道': '茶文化',
    '蜀锦': '蜀锦',
    '锦': '蜀锦',
    '景泰蓝': '景泰蓝',
    '掐丝珐琅': '景泰蓝',
    '舞狮': '舞狮',
    '舞龙': '舞龙',
    '庙会': '庙会',
    '灯会': '灯会',
    '人类非遗': '联合国',
    '世界非遗': '联合国',
    '世界遗产': '联合国',
    '传统节日': '传统节日',
    '戏曲': '戏曲',
    '美食': '美食',
    '技艺': '技艺',
  };
  for (const [keyword, topic] of Object.entries(keywordMap)) {
    if (q.includes(keyword)) {
      return localKnowledge[topic];
    }
  }
  for (const [key, answer] of Object.entries(localKnowledge)) {
    if (q.includes(key)) return answer;
  }
  return '中国非物质文化遗产是中华文明绵延传承的生动见证。截至2023年，中国已有43个项目列入联合国教科文组织非物质文化遗产名录，位居世界第一。\n\n非遗涵盖：传统口头文学、传统美术书法音乐舞蹈戏曲、传统技艺医药历法、传统礼仪节庆民俗、传统体育游艺等。\n\n如果你想了解更多，可以问我：\n• 中国有哪些世界级非遗？\n• 京剧和昆曲有什么区别？\n• 景德镇瓷器有什么特点？\n• 端午节有哪些习俗？\n• 中国传统手工技艺有哪些？\n• 中国美食类非遗有哪些？';
};

const simulateStream = (text, onChunk, onDone) => {
  let index = 0;
  const interval = setInterval(() => {
    const chunkSize = Math.floor(Math.random() * 5) + 2;
    const chunk = text.slice(index, index + chunkSize);
    if (chunk) {
      onChunk(chunk);
      index += chunkSize;
    } else {
      clearInterval(interval);
      onDone();
    }
  }, 30);
};

const sendMessage = () => {
  const text = inputText.value.trim();
  if (!text || isStreaming.value) return;
  inputText.value = '';

  messages.value.push({ role: 'user', content: text });
  const assistantMsg = { role: 'assistant', content: '', isStreaming: true };
  messages.value.push(assistantMsg);
  isStreaming.value = true;

  nextTick(() => scrollBottom());

  let hasResponded = false;

  streamAIRecommend(text,
    (chunk) => {
      hasResponded = true;
      assistantMsg.content += chunk;
      nextTick(() => scrollBottom());
    },
    () => {
      assistantMsg.isStreaming = false;
      isStreaming.value = false;
      nextTick(() => scrollBottom());
    },
    (err) => {
      if (!hasResponded) {
        assistantMsg.content = '';
        const localAnswer = generateLocalResponse(text);
        simulateStream(localAnswer,
          (chunk) => {
            assistantMsg.content += chunk;
            nextTick(() => scrollBottom());
          },
          () => {
            assistantMsg.isStreaming = false;
            isStreaming.value = false;
            nextTick(() => scrollBottom());
          }
        );
      }
    }
  );
};

const scrollBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};
</script>

<style scoped>
.ai-chat {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 998;
}

.ai-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(74, 144, 164, 0.4);
}

.ai-toggle.active {
  opacity: 0;
  pointer-events: none;
}

.ai-panel {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.ai-panel.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  font-size: 32px;
}

.ai-header h3 {
  font-size: 16px;
  margin-bottom: 2px;
}

.ai-header p {
  font-size: 12px;
  opacity: 0.8;
}

.ai-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
}

.ai-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  max-height: 420px;
  background: #f8f9fa;
}

.ai-welcome {
  text-align: center;
  padding: 10px 0;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.ai-welcome p {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 15px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.quick-btn {
  padding: 8px 14px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.ai-message {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.ai-message.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.ai-message.user .msg-avatar {
  background: var(--primary-color);
}

.msg-content {
  max-width: 80%;
}

.ai-message.user .msg-content {
  text-align: right;
}

.msg-text {
  padding: 10px 15px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  display: inline-block;
}

.ai-message.user .msg-text {
  background: var(--primary-color);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message.assistant .msg-text {
  background: white;
  color: var(--text-dark);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 5px 10px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-light);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

.ai-input {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  background: white;
}

.ai-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.ai-input input:focus {
  border-color: var(--primary-color);
}

.send-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .ai-panel {
    right: 0;
    bottom: 0;
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .ai-panel.show {
    border-radius: 0;
  }

  .ai-messages {
    max-height: calc(100vh - 180px);
  }
}
</style>
