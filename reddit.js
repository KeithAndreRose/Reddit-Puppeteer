const puppeteer = require("puppeteer");

const REDDIT_URL = `https://old.reddit.com/`;
const SUBREDDIT_URL = subreddit => `https://old.reddit.com/r/${subreddit}/`;
const SUBREDDIT_SUBMIT_LINK_URL = subreddit =>
  `https://old.reddit.com/r/${subreddit}/submit`;
const SUBREDDIT_SUBMIT_TEXT_URL = subreddit =>
  `https://old.reddit.com/r/${subreddit}/submit?selftext=true`;

const self = {
  browser: null,
  page: null,

  init: async subreddit => {
    self.browser = await puppeteer.launch({
      headless: false
    });
    self.page = await self.browser.newPage();
  },
  login: async (user, passwd) => {
    await self.page.goto(REDDIT_URL, {
      waitUntil: "networkidle0"
    });

    await self.page.type('input[name="user"]', user, { delay: 30 });
    await self.page.type('input[name="passwd"]', passwd, { delay: 30 });
    await self.page.click("#login_login-main > div.submit > button");

    await self.page.waitFor(
      'form[action="https://old.reddit.com/logout"], div[class="status error"]'
    );

    let error = await self.page.$('div[class="status error"]');
    if (error) {
      let errorMsg = await (await error.getProperty("innerText")).jsonValue();
      console.log(`User: ${user} failed to login`);
      console.log(`Site Error: ${errorMsg}`);
      setTimeout(() => {
        console.log(`Shutting down in 5 seconds`);
      }, 400);
      setTimeout(async () => {
        await self.shutdown();
      }, 5400);
    } else console.log(`[${user}] Login Successful`);
  },
  makePost: async (subreddit, data = {}) => {
    switch (data.type) {
      case "text":
        await self.page.goto(SUBREDDIT_SUBMIT_TEXT_URL(subreddit), {
          waitUntil: "networkidle0"
        });

        await self.page.waitFor(3000)
        
        await self.page.type('textarea[name="title"]', data.title);
        await self.page.type('textarea[name="text"]', data.text);
        break;
      case "link":
        await self.page.goto(SUBREDDIT_SUBMIT_LINK_URL(subreddit), {
          waitUntil: "networkidle0"
        });

        await self.page.waitFor(3000)

        await self.page.type('#url', data.url);
        await self.page.type('textarea[name="title"]', data.title);
        break;
      default:
        break;
    }

    await self.page.click('#newlink > div.spacer > button')

  },
  getResults: async (subreddit, desiredAmount) => {
    let results = [];
    await self.page.goto(SUBREDDIT_URL(subreddit), {
      waitUntil: "networkidle0"
    });

    do {
      let pageResults = await self.parseResults();
      results = [...results, ...pageResults];
      if (results.length < desiredAmount) {
        let nextPageButton = await self.page.$(
          'span[class="next-button"] > a[rel="nofollow next"]'
        );
        if (nextPageButton) {
          await nextPageButton.click();
          await self.page.waitForNavigation({
            waitUntil: "networkidle0"
          });
        } else {
          break;
        }
      }
    } while (results.length <= desiredAmount);

    return results.slice(0, desiredAmount);
  },
  parseResults: async () => {
    let elements = await self.page.$$('#siteTable > div[class*="thing"]');
    let results = [];
    for (let element of elements) {
      let title = await element
        .$eval('p[class="title"]', node => node.innerText.trim())
        .catch(err => err);
      5;
      let rank = await element
        .$eval('span[class="rank"]', node => node.innerText.trim())
        .catch(err => err);
      let postTime = await element
        .$eval('p[class="tagline "] > time', node => node.getAttribute("title"))
        .catch(err => err);
      let authorName = await element
        .$eval('p[class="tagline "] > a[class*="author"]', node =>
          node.innerText.trim()
        )
        .catch(err => err);
      let authorUrl = await element
        .$eval('p[class="tagline "] > a[class*="author"]', node =>
          node.getAttribute("href")
        )
        .catch(err => err);
      let score = await element
        .$eval('div[class="score likes"]', node => node.innerText.trim())
        .catch(err => err);
      let comments = await element
        .$eval('a[data-event-action="comments"]', node => node.innerText.trim())
        .catch(err => err);
      const thing = {
        title,
        rank,
        postTime,
        authorName,
        authorUrl,
        score,
        comments
      };
      results.push(thing);
    }
    return results;
  },
  shutdown: async () => {
    console.log(`Shutting down`)
    await self.browser.close();
    self.browser.disconnect();
    process.exit(1);
  }
};

module.exports = self;
