const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrape(sportsChannel, options = {}) {
    const { msg, scheduled } = options;

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto('https://protime.si/sl_si/dogodki/', { waitUntil: 'load', timeout: 60000 }); // Increased timeout to 60 seconds
        await page.setDefaultNavigationTimeout(60000);

        const events = await page.evaluate(() => {
            const data = [];
            const articles = document.querySelectorAll('article.mec-event-article');

            articles.forEach((article) => {
                const dateElement = article.querySelector('.mec-event-date .mec-start-date-label');
                const titleElement = article.querySelector('h4.mec-event-title a.mec-color-hover');

                if (dateElement && titleElement && data.length < 5) {
                    data.push({
                        Date: dateElement.textContent.trim(),
                        Title: titleElement.textContent.trim(),
                        Link: titleElement.href,
                    });
                }
            });

            return data;
        });

        await browser.close();

        if (events.length > 0) {
            const eventString = events
                .map(event => `Date: ${event.Date}, Title: ${event.Title}, Link: <${event.Link}>`)
                .join('\n');

            if (scheduled) {
                // If triggered by cron job, tag @here
                await sportsChannel.send(`@here Scraped events:\n${eventString}`);
            } else if (msg) {
                // If triggered by !scrape command, reply to the message
                await msg.reply(`Scraped events:\n${eventString}`);
            }
        } else {
            if (scheduled) {
                await sportsChannel.send('@here No events found on the page.');
            } else if (msg) {
                await msg.reply('No events found on the page.');
            }
        }

    } catch (error) {
        console.error('Error occurred while scraping:', error);

        if (scheduled) {
            await sportsChannel.send('@here An error occurred while scraping the page.');
        } else if (msg) {
            await msg.reply('An error occurred while scraping the page.');
        }
    }
}

module.exports = { scrape };