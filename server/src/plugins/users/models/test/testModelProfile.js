const assert = require("chai").assert;
const testMngr = require("test/testManager");

describe("profileModel", function () {
  let models = testMngr.app.data.models();
  let profileModel = models.Profile;

  before(async () => {});
  after(async () => {});
  it("create a profile", async () => {
    let profileData = {
      biography: "Ciao",
    };
    let profile = await profileModel.create(profileData);
    let user = await models.User.findByUsername("admin");
    await profile.setUser(user.get().id);
  });

  it("should count profiles", async () => {
    let count = await profileModel.count();
    assert.isAbove(count, 0);
  });
});
