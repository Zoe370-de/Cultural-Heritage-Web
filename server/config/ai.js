import dotenv from 'dotenv';
dotenv.config();

export const BAILIAN_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  apiKey: process.env.BAILIAN_API_KEY || 'sk-35808d20945a411da2f623c8eda34ac5',
  models: {
    text: 'deepseek-chat',
    vision: 'deepseek-chat'
  }
};
