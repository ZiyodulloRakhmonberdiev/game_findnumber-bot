const express = require("express");
const app = express();
const TELEGRAM_BOT = require("node-telegram-bot-api");
require('dotenv').config();

const bot = new TELEGRAM_BOT(process.env.token, { polling: true });
app.use(express.json());

// O'yin holatini saqlash uchun ob'ekt
const games = {};

// Tasodifiy raqamni generatsiya qilish
const generateRandomNumber = () => Math.floor(Math.random() * 100) + 1;

// Tugmalarni yaratish
function createGameMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Boshlash", callback_data: "start_game" }
        ]
      ]
    }
  };
}

// /start buyrug'ini ishlov berish
bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;

  if (text === "/start") {
    bot.sendMessage(chatId, `Salom, ${msg.from.first_name}! O'ynash uchun pastdagi tugmani bosing.`, createGameMenu());
  }
});

// Tugmani bosilganda o'yin boshlanishi
bot.on("callback_query", (query) => {
  const chatId = query.from.id;

  if (query.data === "start_game") {
    // O'yin uchun tasodifiy raqamni generatsiya qilish
    const randomNumber = generateRandomNumber();

    // Foydalanuvchi uchun o'yinni saqlash
    games[chatId] = {
      number: randomNumber,
      attempts: 5, // 5 urinish
      time: Date.now() + 30 * 1000, // 30 soniya
    };

    // O'yin boshlanishi xabari
    bot.sendMessage(chatId, "Men 1 dan 100 gacha raqam tanladim. Sizda uni topish uchun 5 urinish va 30 soniya vaqt bor. Raqamni kiriting.");
  }
});

// Foydalanuvchi raqam kiritganini tekshirish
bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;

  if (games[chatId]) {
    const userGame = games[chatId];

    // Vaqt o'tganini tekshirish
    if (Date.now() > userGame.time) {
      bot.sendMessage(chatId, `Vaqt tugadi! Raqam ${userGame.number} edi.`);
      delete games[chatId]; // O'yinni o'chirish
      bot.sendMessage(chatId, "Yana o'ynash uchun pastdagi tugmani bosing.", createGameMenu());
      return;
    }

    // Foydalanuvchi raqam kiritganini tekshirish
    const guessedNumber = parseInt(text);
    if (isNaN(guessedNumber)) {
      bot.sendMessage(chatId, "Iltimos, to'g'ri raqam kiriting.");
      return;
    }

    // Kiritilgan raqam to'g'ri bo'lsa
    if (guessedNumber === userGame.number) {
      bot.sendMessage(chatId, `🎉 Tabriklaymiz! Siz ${userGame.number} raqamini topdingiz.`);
      delete games[chatId]; // O'yin tugadi, ma'lumotni o'chirish
      bot.sendMessage(chatId, "Yana o'ynash uchun pastdagi tugmani bosing.", createGameMenu());
    } else {
      userGame.attempts -= 1;

      // Urinishlar tugaganini tekshirish
      if (userGame.attempts === 0) {
        bot.sendMessage(chatId, `Urinishlar tugadi. Raqam ${userGame.number} edi.`);
        delete games[chatId]; // O'yinni o'chirish
        bot.sendMessage(chatId, "Yana o'ynash uchun pastdagi tugmani bosing.", createGameMenu());
      } else {
        // Foydalanuvchiga maslahat berish
        if (guessedNumber < userGame.number) {
          bot.sendMessage(chatId, `Kattaroq son kiriting! Qolgan urinishlar: ${userGame.attempts}`);
        } else {
          bot.sendMessage(chatId, `Kichikroq son kiriting! Qolgan urinishlar: ${userGame.attempts}`);
        }
      }
    }
  }
});

async function dev() {
  try {
    app.listen(3000, () => {
      console.log('Server ishga tushdi');
    });
  } catch (error) {
    console.log(error);
  }
}

dev().catch(console.dir);