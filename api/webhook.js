import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', (ctx) => ctx.reply('Привет! Бот запущен и готов к работе.'));

bot.on('text', (ctx) => {
    console.log('Text message received:', ctx.message.text);
    ctx.reply(`Ты написал: ${ctx.message.text}`);
});

console.log('Bot initialized');

let lastUpdate = null;      // Хранить последний апдейт
let lastError = null;       // Хранить последнюю ошибку
let lastMethod = null;      // Последний HTTP метод

export default async function handler(req, res) {
    lastMethod = req.method;

    if (req.method === 'GET') {
        // Вернуть статус и последние данные для отладки
        return res.status(200).json({
            status: 'alive',
            lastMethod,
            lastUpdate,
            lastError,
            message: 'Webhook is alive. Отправь POST запрос с update от Telegram или напиши сюда в GET для проверки.',
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
