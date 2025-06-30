import { Telegraf } from 'telegraf';
import OpenAI from 'openai';

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let lastUpdate = null;
let lastError = null;
let lastRequestTime = null;

bot.command('start', (ctx) => ctx.reply('Привет! Я бот на базе OpenAI. Напиши что-нибудь.'));

bot.on('text', async (ctx) => {
    lastRequestTime = new Date().toISOString();
    const userMessage = ctx.message.text;
    console.log('User message:', userMessage);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Ты дружелюбный и полезный ассистент.' },
                { role: 'user', content: userMessage },
            ],
        });

        const botReply = response.choices[0].message.content.trim();
        console.log('OpenAI reply:', botReply);

        await ctx.reply(botReply);
    } catch (error) {
        lastError = error.message || error.toString();
        console.error('OpenAI error:', lastError);
        await ctx.reply('Извини, произошла ошибка при обработке твоего сообщения.');
    }
});

console.log('Bot initialized');

export default async function handler(req, res) {
    lastRequestTime = new Date().toISOString();

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'alive',
            lastRequestTime,
            lastUpdate,
            lastError,
            message: 'Webhook is alive. Отправь POST запрос с update от Telegram.',
        });
    }

    if (req.method === 'POST') {
        lastUpdate = req.body;
        lastError = null;

        console.log('Incoming request:', JSON.stringify(req.body, null, 2));
        try {
            await bot.handleUpdate(req.body);
            return res.status(200).json({ ok: true, message: 'Update handled successfully' });
        } catch (error) {
            lastError = error.message || error.toString();
            console.error('Error in bot handler:', lastError);
            return res.status(500).json({ ok: false, error: lastError });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
