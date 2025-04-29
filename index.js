const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const { DateTime } = require('luxon'); // Dùng Luxon để thao tác với thời gian

dotenv.config();

const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
] });

const convertSystemTo24hr = () => {
    const now = DateTime.utc();
    const timeInGMT7 = now.setZone('Asia/Ho_Chi_Minh');
    return timeInGMT7.toFormat('HH:mm');
};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content;

    // Tìm thời gian dự toán kết thúc bằng regex
    const regex = /Thời gian dự toán kết thúc:\s*(\d{2}:\d{2})/;
    const match = content.match(regex);
    if (match) {
        const finishTimeStr = match[1];
        const now = DateTime.utc();
		const timeInGMT7 = now.setZone('Asia/Ho_Chi_Minh');
        // Đọc và chuyển đổi thời gian kết thúc
        let finishTime;
        try {
            finishTime = DateTime.fromFormat(finishTimeStr, 'HH:mm').set({ year: timeInGMT7.year, month: timeInGMT7.month, day: timeInGMT7.day });
        } catch (error) {
            await message.channel.send('❌ Không đọc được thời gian kết thúc.');
            return;
        }

        const systemTimeStr = convertSystemTo24hr();
        const systemTime = DateTime.fromFormat(systemTimeStr, 'HH:mm').set({ year: timeInGMT7.year, month: timeInGMT7.month, day: timeInGMT7.day });

        const delay = finishTime.diff(systemTime, 'seconds').seconds;

        if (delay <= 0) {
            // Quá thời gian rồi → phản hồi luôn
            await message.reply(`✅ Đã quá thời gian dự toán kết thúc (${finishTimeStr}). Bạn vui lòng báo cáo tiến độ công việc nhé!`);
        } else {
            // Chờ đúng đến thời gian kết thúc
            setTimeout(async () => {
                await message.reply(`⏰ Đã đến thời gian dự toán kết thúc (${finishTimeStr}). Bạn vui lòng báo cáo tiến độ công việc nhé!`);
            }, delay * 1000);
        }
    }
});
client.login(process.env.DISCORD_ENV);
