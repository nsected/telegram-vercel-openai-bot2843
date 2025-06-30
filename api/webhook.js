import { Telegraf } from 'telegraf';
import OpenAI from 'openai';

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Обработчик команды /start
bot.command('start', (ctx) => ctx.reply('Привет! Я бот на базе OpenAI. Напиши что-нибудь.'));

// Обработка входящих текстов
bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    console.log('User message:', userMessage);

    try {
        // Запрос к OpenAI Chat Completion
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // или 'gpt-4o' / 'gpt-3.5-turbo' — выбери свой вариант
            messages: [
                { role: 'system', content: 'Ты дружелюбный и полезный ассистент.' },
                { role: 'user', content: userMessage },
            ],
        });

        const botReply = response.choices[0].message.content.trim();
        console.log('OpenAI reply:', botReply);

        await ctx.reply(botReply);
    } catch (error) {
        console.error('OpenAI error:', error);
        await ctx.reply('Извини, произошла ошибка при обработке твоего сообщения.');
    }
});

console.log('Bot initialized');

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'alive',
            message: 'Webhook is alive. Отправь POST запрос с update от Telegram.',
        });
    }

    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            return res.status(200).send('OK');
        } catch (error) {
            console.error('Error in bot handler:', error);
            return res.status(500).send('Error');
        }
    }

    res.status(405).send('Method Not Allowed');
}
