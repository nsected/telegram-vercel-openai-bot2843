const axios = require('axios');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const bot = new Telegraf(BOT_TOKEN);

const MAX_LOGS = 30;
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

// Telegram message handler
bot.on('text', async (ctx) => {
    lastRequestTime = new Date().toISOString();
    const userMessage = ctx.message.text;
    addRequestLog({ time: lastRequestTime, type: 'user_message', text: userMessage });

    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'Ты дружелюбный и полезный ассистент.' },
                    { role: 'user', content: userMessage },
                ],
                stream: false,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                },
            }
        );

        const botReply = response.data.choices[0].message.content.trim();
        addRequestLog({ time: new Date().toISOString(), type: 'bot_reply', text: botReply });

        await ctx.reply(botReply);
    } catch (error) {
        const errMsg = error.response?.data?.error || error.message || error.toString();
        addErrorLog({ time: new Date().toISOString(), error: errMsg });
        console.error('DeepSeek error:', errMsg);

        try {
            await ctx.reply('Извини, произошла ошибка при обработке твоего сообщения.');
        } catch {}
    }
});

console.log('Bot initialized');

module.exports = async function handler(req, res) {
    lastRequestTime = new Date().toISOString();

    if (req.method === 'GET') {
        const { chat_id, text } = req.query || {};

        if (chat_id && text) {
            addRequestLog({ time: lastRequestTime, type: 'rest_api_incoming_message', chat_id, text });

            try {
                const response = await axios.post(
                    DEEPSEEK_API_URL,
                    {
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: 'Ты дружелюбный и полезный ассистент.' },
                            { role: 'user', content: text.toString() },
                        ],
                        stream: false,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
                        },
                    }
                );

                const botReply = response.data.choices[0].message.content.trim();
                addRequestLog({ time: new Date().toISOString(), type: 'rest_api_bot_reply', chat_id, reply: botReply });

                await bot.telegram.sendMessage(chat_id.toString(), botReply);

                return res.status(200).json({
                    ok: true,
                    sentToChatId: chat_id,
                    reply: botReply,
                    logsCount: requestLogs.length,
                });
            } catch (error) {
                const errMsg = error.response?.data?.error || error.message || error.toString();
                addErrorLog({ time: new Date().toISOString(), error: errMsg });
                console.error('DeepSeek error:', errMsg);
                return res.status(500).json({ ok: false, error: errMsg });
            }
        }

        // Без параметров GET — выдаём статус и логи
        let chatId = null;
        if (lastUpdate && lastUpdate.message && lastUpdate.message.chat && lastUpdate.message.chat.id) {
            chatId = lastUpdate.message.chat.id;
        }

        return res.status(200).json({
            status: 'alive',
            lastRequestTime,
            lastUpdate,
            chatId,
            requestLogs,
            errorLogs,
            message: 'Webhook alive. Для отправки сообщения GET /api/webhook?chat_id=123&text=текст',
        });
    }

    if (req.method === 'POST') {
        lastUpdate = req.body;
        addRequestLog({ time: lastRequestTime, type: 'POST_update', data: req.body });

        try {
            await bot.handleUpdate(req.body);
            return res.status(200).json({ ok: true, message: 'Update handled successfully' });
        } catch (error) {
            const errMsg = error.message || error.toString();
            addErrorLog({ time: new Date().toISOString(), error: errMsg });
            console.error('Error in bot handler:', errMsg);
            return res.status(500).json({ ok: false, error: errMsg });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
