import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import UserApp from "../UserApp";

chai.use(chaiAsPromised);
const { expect, assert } = chai;

describe("Router", function() {
  let app;
  let router;
  before(async () => {
    app = await UserApp();
    router = app.router
  })
  it("/login", async () => {
    const route = await router.instance.resolve("/auth/login");
    assert(route);
    assert(route.component)
    assert.equal(route.title, "Login");
  });
  it("/app/profile not authenticated", async () => {
    expect(router.instance.resolve("/profile")).to.be.rejectedWith(Error);
  });
});
