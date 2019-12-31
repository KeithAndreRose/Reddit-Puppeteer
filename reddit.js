const puppeteer = require("puppeteer");

const SUBREDDIT_URL = subreddit => `https://old.reddit.com/r/${subreddit}/`;

const self = {
  browser: null,
  page: null,

  init: async subreddit => {
    self.browser = await puppeteer.launch({
      headless: false
    });
    self.page = await self.browser.newPage();
    await self.page.goto(SUBREDDIT_URL(subreddit), {
      waitUntil: "networkidle0"
    });
  },
  getResults: async desiredAmount => {
    let results = []

    do {
      let pageResults = await self.parseResults() 
      results = [...results, ...pageResults]
      if( results.length < desiredAmount){
        let nextPageButton = await self.page.$('span[class="next-button"] > a[rel="nofollow next"]');
        if(nextPageButton){
          await nextPageButton.click()
          await self.page.waitForNavigation({
            waitUntil: "networkidle0"
          })
        } else {
          break
        }
      }

    } while (results.length <= desiredAmount)

    return results.slice(0, desiredAmount)
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
    return results
  },
  shutdown: async () => {
    await self.browser.close()
    self.browser.disconnect()
  }
};

module.exports = self;
