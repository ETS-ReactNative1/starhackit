import { createElement as h } from "react";
import { observable, action } from "mobx";
import AsyncOp from "utils/asyncOp";
import user from "./userComponent";
import usersCreate from "./users";

export default function(context) {
  const { rest } = context;
  const asyncOpCreate = AsyncOp(context);

  function Stores() {
    const userStore = observable({
      opGet: asyncOpCreate((id, data) => rest.get(`users/${id}`, data)),
      get: action(async function(id) {
        await this.opGet.fetch(id);
      })
    });
    return {
      user: userStore
    };
  }

  function selectOne(userId) {
    context.history.push(`users/${userId}`);
  }

  const users = usersCreate(context, {
    selectOne,
    getAll: data => rest.get(`users/`, data)
  });

  function Routes(stores) {
    return [
      {
        path: "/users",
        children: [
          {
            path: "",
            action: () => {
              users.store.selectPage(1);
              return {
                title: "Users",
                component: users.component
              };
            }
          },
          {
            path: "/:userId",
            action: ({ params }) => {
              stores.user.get(params.userId);
              return {
                title: "User",
                component: h(user(context), { store: stores.user })
              };
            }
          }
        ]
      }
    ];
  }
  const stores = Stores();

  return {
    stores: () => stores,
    routes: () => Routes(stores)
  };
}