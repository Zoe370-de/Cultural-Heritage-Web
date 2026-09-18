const base = 'http://localhost:5005';

async function main() {
  // 登录拿 token
  const loginRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('login ok, user id =', loginData.user.id);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 测试新增错题
  const addRes = await fetch(base + '/api/quiz/wrong-questions', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      questionId: 1,
      questionData: { id: 1, question: '景泰蓝是瓷器吗？', options: ['对', '错'], answer: 1, type: 'judge', region: '北京', item: '景泰蓝', explanation: '金属工艺' },
      userAnswer: 0,
      wrongCount: 1
    })
  });
  console.log('add wrong question:', addRes.status, await addRes.text());

  // 测试获取错题
  const getRes = await fetch(base + '/api/quiz/wrong-questions', { headers: authHeaders });
  const getData = await getRes.json();
  console.log('get wrong questions:', JSON.stringify(getData));

  // 测试删除单条错题
  const delRes = await fetch(base + '/api/quiz/wrong-questions/1', { method: 'DELETE', headers: authHeaders });
  console.log('delete wrong question:', delRes.status, await delRes.text());

  // 清空错题
  const clearRes = await fetch(base + '/api/quiz/wrong-questions', { method: 'DELETE', headers: authHeaders });
  console.log('clear wrong questions:', clearRes.status, await clearRes.text());
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });