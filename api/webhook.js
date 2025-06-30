import { Telegraf } from 'telegraf';
import OpenAI from 'openai';

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MAX_LOGS = 10;
const requestLogs = [];
const errorLogs = [];

let lastUpdate = null;
let lastRequestTime = null;

function addRequestLog(entry) {
    requestLogs.push(entry);
    if (requestLogs.length > MAX_LOGS) requestLogs.shift();
}

function addErrorLog(entry) {
    errorLogs.push(entry);
    if (errorLogs.length > MAX_LOGS) errorLogs.shift();
}

bot.command('start', (ctx) => ctx.reply('Привет! Я бот на базе OpenAI. Напиши что-нибудь.'));

bot.on('text', async (ctx) => {
    lastRequestTime = new Date().toISOString();
    const userMessage = ctx.message.text;
    addRequestLog({ time: lastRequestTime, type: 'text', text: userMessage });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Ты дружелюбный и полезный ассистент.' },
                { role: 'user', content: userMessage },
            ],
        });

        const botReply = response.choices[0].message.content.trim();
        addRequestLog({ time: new Date().toISOString(), type: 'reply', text: botReply });

        await ctx.reply(botReply);
    } catch (error) {
        const errMsg = error.message || error.toString();
        addErrorLog({ time: new Date().toISOString(), error: errMsg });
        console.error('OpenAI error:', errMsg);

        // Отправляем подробности ошибки в чат
        const errorText = `Ошибка при обработке запроса:\n${errMsg}\n\nПоследние ошибки:\n` +
            errorLogs.map(e => `[${e.time}] ${e.error}`).join('\n');

        try {
            await ctx.reply(errorText);
        } catch {
            // Если ошибка при отправке ответа, молча пропускаем
        }
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
            requestLogs,
            errorLogs,
            message: 'Webhook is alive. Отправь POST запрос с update от Telegram.',
        });
    }

    if (req.method === 'POST') {
        lastUpdate = req.body;
        addRequestLog({ time: lastRequestTime, type: 'POST update', data: req.body });

        try {
            await bot.handleUpdate(req.body);
            return res.status(200).json({ ok: true, message: 'Update handled successfully' });
        } catch (error) {
            const errMsg = error.message || error.toString();
            addErrorLog({ time: new Date().toISOString(), error: errMsg });
            console.error('Error in bot handler:', errMsg);

            // Попробуем отправить сообщение об ошибке в чат, если возможно
            if (lastUpdate && lastUpdate.message && lastUpdate.message.chat && lastUpdate.message.chat.id) {
                const chatId = lastUpdate.message.chat.id;
                try {
                    await bot.telegram.sendMessage(chatId, `Ошибка при обработке обновления:\n${errMsg}`);
                } catch {
                    // Игнорируем ошибку отправки
                }
            }

            return res.status(500).json({ ok: false, error: errMsg });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
