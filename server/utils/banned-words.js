const defaultBannedWords = [
  '暴力', '色情', '赌博', '毒品', '诈骗', '反动',
  '杀人', '枪支', '弹药', '邪教', '传销', '裸聊'
];

let dbBannedWords = [];

export async function loadBannedWords(db) {
  try {
    const [rows] = await db.execute('SELECT word FROM banned_words');
    dbBannedWords = rows.map(r => r.word);
  } catch (e) {
    dbBannedWords = [];
  }
}

export function containsBannedWords(content) {
  const allWords = [...defaultBannedWords, ...dbBannedWords];
  const lower = content.toLowerCase();
  return allWords.some(word => lower.includes(word.toLowerCase()));
}

export function getBannedWords(content) {
  const allWords = [...defaultBannedWords, ...dbBannedWords];
  const lower = content.toLowerCase();
  return allWords.filter(word => lower.includes(word.toLowerCase()));
}