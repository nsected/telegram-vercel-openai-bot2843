const bot = require('./bot');
require('dotenv').config();

(async () => {
  const url = 'https://your-vercel-app.vercel.app/api'; // Замени на свой адрес
  await bot.telegram.setWebhook(url);
  console.log('Webhook установлен на:', url);
})();