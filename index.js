const reddit = require("./reddit");
const botUser = require('./env/botUser');

(async () => {
  await reddit.init();
  await reddit.login(botUser.name, botUser.password)
  // await reddit.makePost('dankmemes',{
  //   type: 'text',
  //   title: 'This is a automated text test',
  //   text: 'Hello World'
  // })
  // let results = await reddit.getResults("dankmemes", 35)
  await reddit.shutdown()
  debugger
})();
