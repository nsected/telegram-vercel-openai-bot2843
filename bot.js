const { Telegraf } = require('telegraf');
const { askChatGPT } = require('./openai');
require('dotenv').config();
console.log('Bot started')
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('text', async (ctx) => {
  try {
    await ctx.reply('Думаю...');
    const reply = await askChatGPT(ctx.message.text);
    await ctx.reply(reply);
  } catch (err) {
    console.error(err);
    await ctx.reply('Произошла ошибка при обращении к ИИ.');
  }
});

module.exports = bot;