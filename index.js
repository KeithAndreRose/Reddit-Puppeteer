const reddit = require("./reddit");
(async () => {
  await reddit.init("dankmemes");
  let results = await reddit.getResults(35)
  console.log(results)
  await reddit.shutdown()
  debugger
})();
