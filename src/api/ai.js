export function streamAIRecommend(prompt, onChunk, onDone, onError) {
  const url = `/api/ai/recommend?prompt=${encodeURIComponent(prompt)}`;
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
  }).then(async (res) => {
    if (!res.ok) throw new Error('AI服务返回错误');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') { onDone?.(); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) onChunk(parsed.content);
            if (parsed.error) onError?.(parsed.error);
          } catch {}
        }
      }
    }
    onDone?.();
  }).catch(e => onError?.(e.message));
}

export function streamImageAnalysis(imageBase64, prompt, onChunk, onDone, onError) {
  fetch('/api/ai/analyze-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    },
    body: JSON.stringify({ imageBase64, prompt: prompt || '' })
  }).then(async (res) => {
    if (!res.ok) throw new Error('AI视觉服务返回错误');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') { onDone?.(); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) onChunk(parsed.content);
            if (parsed.error) onError?.(parsed.error);
          } catch {}
        }
      }
    }
    onDone?.();
  }).catch(e => onError?.(e.message));
}
