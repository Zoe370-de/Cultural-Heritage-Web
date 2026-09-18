import api from './index.js';

export function getProgress() {
  return api.get('/quiz/progress');
}

export function saveProgress(data) {
  return api.put('/quiz/progress', data);
}

export function getWrongQuestions() {
  return api.get('/quiz/wrong-questions');
}

export function addWrongQuestion(data) {
  return api.post('/quiz/wrong-questions', data);
}

export function clearWrongQuestions() {
  return api.delete('/quiz/wrong-questions');
}

export function removeWrongQuestion(questionId) {
  return api.delete(`/quiz/wrong-questions/${questionId}`);
}