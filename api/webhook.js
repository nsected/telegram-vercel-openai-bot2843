import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Пример простой команды
bot.command('start', (ctx) => ctx.reply('Привет! Бот запущен.'));

// Логирование для проверки работы
console.log('Bot initialized');

export default async function handler(req, res) {
    if (req.method === 'POST') {
        console.log('Incoming request:', req.body);
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
