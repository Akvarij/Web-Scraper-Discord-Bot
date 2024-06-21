const puppeteer = require('puppeteer-extra');
const cron = require('node-cron');
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.login(process.env.CLIENT_TOKEN);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const sportsChannel = client.channels.cache.find(channel => channel.name === process.env.SERVER_NAME);
    if (!sportsChannel) {
        console.error(`Channel ${process.env.SERVER_NAME} not found`);
        return;
    }

    cron.schedule('0 12 * * 1', async () => { // Monday at 12h
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            await page.goto('https://protime.si/sl_si/dogodki/', { waitUntil: 'load', timeout: 0 });
            await page.setDefaultNavigationTimeout(5000);

            let events = await page.evaluate(() => {
                let data = [];

                const articles = document.querySelectorAll('article.mec-event-article');

                articles.slice(0,4).forEach((article) => {
                    const dateElement = article.querySelector('.mec-event-date .mec-start-date-label');
                    const titleElement = article.querySelector('h4.mec-event-title a.mec-color-hover');
                    
                    if (dateElement && titleElement) {
                        data.push({
                            date: dateElement.textContent,
                            title: titleElement.textContent.trim(),
                            link: titleElement.href
                        });
                    }
                });

                return data;
            });

            await browser.close();

            if (events.length > 0) {
                const eventString = events.map(event => `Date: ${event.date}, Title: ${event.title}, Link: <${event.link}>`).join('\n');
                sportsChannel.send(`Scraped events: \n${eventString}`);
            } else {
                sportsChannel.send('No events found on the page.');
            }

        } catch (error) {
            console.error('Error occurred while scraping:', error);
            sportsChannel.send('An error occurred while scraping the page.');
        }
    }, {
        scheduled: true,
        timezone: "Europe/Belgrade"
    });
});
