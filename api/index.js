const bot = require('../bot');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('ok');
    } catch (e) {
      console.error('Ошибка обработки запроса:', e);
      res.status(500).send('error');
    }
  } else {
    res.status(200).send('Бот работает (GET)');
  }
};