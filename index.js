const { Client, GatewayIntentBits } = require("discord.js");
const { DateTime } = require("luxon");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const reminders = new Map();

const getNowInGMT7 = () =>
  DateTime.utc().setZone("Asia/Ho_Chi_Minh");

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 1) Nếu user reply vào message gốc đã lên lịch, tức đã báo cáo trước giờ nhắc
  const repliedToId = message.reference?.messageId;
  if (repliedToId && reminders.has(repliedToId)) {
    clearTimeout(reminders.get(repliedToId).timeoutId);
    reminders.delete(repliedToId);
    return message.reply("✅ Cảm ơn bạn đã báo cáo sớm! Mình sẽ không nhắc lại.");
  }

  // 2) Kiểm tra regex "Thời gian dự toán kết thúc: HH:MM"
  const match = message.content.match(
    /Thời gian dự toán kết thúc:\s*(\d{2}:\d{2})/
  );
  if (!match) return;

  const finishTimeStr = match[1];
  const now = getNowInGMT7();
  let finishTime;
  try {
    finishTime = DateTime.fromFormat(finishTimeStr, "HH:mm", { zone: "Asia/Ho_Chi_Minh" })
      .set({ year: now.year, month: now.month, day: now.day });
  } catch {
    return message.channel.send("❌ Không đọc được thời gian kết thúc.");
  }

  const delaySeconds = finishTime.diff(now, "seconds").seconds;

  // 3a) Nếu quá giờ rồi, gửi ngay
  if (delaySeconds <= 0) {
    return message.reply(
      `✅ Đã quá thời gian dự toán kết thúc (${finishTimeStr}). Vui lòng báo cáo tiến độ!`
    );
  }

  // 3b) Nếu chưa đến giờ, lên lịch nhắc
  const timeoutId = setTimeout(async () => {
    if (!reminders.has(message.id)) return;
    await message.reply(
      `⏰ Đến giờ (${finishTimeStr}). Vui lòng báo cáo tiến độ!`
    );
    reminders.delete(message.id);
  }, delaySeconds * 1000);

  reminders.set(message.id, { timeoutId });
});

client.login(process.env.DISCORD_ENV);
