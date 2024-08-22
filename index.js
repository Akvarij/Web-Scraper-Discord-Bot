const { scrape } = require('./function.js');

const cron = require('node-cron');

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });


client.login(process.env.CLIENT_TOKEN);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const sportsChannel = client.channels.cache.find(channel => channel.name === 'sport');
    
    if (!sportsChannel) {
        console.error('No channel named "sport" found.');
        return;
    }

    cron.schedule('0 12 * * 1', async () => { // Scheduled task: Monday at 12:00
        scrape(sportsChannel, {
            scheduled: true,
            timezone: "Europe/Belgrade"
        });
    });
});

client.on('messageCreate', async (msg) => {
    if (msg.content === '!scrape') {
        const sportsChannel = client.channels.cache.find(channel => channel.name === 'sport');
        
        if (!sportsChannel) {
            console.error('No channel named "sport" found.');
            msg.channel.send('Error: The "sport" channel was not found.');
            return;
        }

        scrape(sportsChannel, { msg });
    }
});
