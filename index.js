const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.CLIENT_TOKEN);

client.on('messageCreate', async msg => {
    if (msg.content === '!scrape') {
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();

            await page.goto('https://protime.si/sl_si/dogodki/', { waitUntil: 'load', timeout: 0 });
            await page.setDefaultNavigationTimeout(5000);

            let events = await page.evaluate(() => {
                let data = [];

                const articles = document.querySelectorAll('article.mec-event-article');
                articles.forEach((article) => {
                    const dateElement = article.querySelector('.mec-event-date .mec-start-date-label');
                    const titleElement = article.querySelector('h4.mec-event-title a.mec-color-hover');
                    
                    if (dateElement && titleElement) {
                        if(data.length < 5) { 
                            data.push({
                                Date: dateElement.textContent,
                                Title: titleElement.textContent.trim(),
                                Link: titleElement.href
                            });
                        }
                    }
                });
                return data;
            });

            await browser.close();

            if (events.length > 0) {
                const eventString = events.map(event => `Date: ${event.Date}, Title: ${event.Title}, Link: <${event.Link}>`).join('\n')
                msg.reply(`Scraped events: \n${eventString}`);
            } else {
                msg.reply('No events found on the page.');
            }

        } catch (error) {
            console.error('Error occurred while scraping:', error);
            msg.reply('An error occurred while scraping the page.');
        }
    }
});
