const testMngr = require("../src/test/testManager");

before(async function () {
  await testMngr.seed();
  await testMngr.start();
});

after(async function () {
  await testMngr.stop();
});
