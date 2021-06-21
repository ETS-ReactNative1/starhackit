/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import { pipe, get, or, tap } from "rubico";
import { isEmpty } from "rubico/x";

import AsyncOp from "mdlean/lib/utils/asyncOp";
import button from "mdlean/lib/button";
import input from "mdlean/lib/input";
import formGroup from "mdlean/lib/formGroup";
import alert from "mdlean/lib/alert";
import spinner from "mdlean/lib/spinner";

import form from "components/form";
import { infraDeleteLink } from "./infraDeleteLink";

export const createStoreAzure = (context) => {
  const { tr, history, alertStack, rest, emitter } = context;
  const Alert = alert(context);
  const asyncOpCreate = AsyncOp(context);
  const store = observable({
    setData: action((data) => {
      store.id = data.id;
      store.data = data.providerAuth;
    }),
    id: "",
    data: {
      name: "",
      SUBSCRIPTION_ID: "",
      TENANT_ID: "",
      APP_ID: "",
      PASSWORD: "",
    },
    errors: {},
    onChange: action((field, value) => {
      store.data[field] = value;
    }),
    get isDisabled() {
      return or([
        pipe([get("name"), isEmpty]),
        pipe([get("SUBSCRIPTION_ID"), isEmpty]),
        pipe([get("TENANT_ID"), isEmpty]),
        pipe([get("APP_ID"), isEmpty]),
        pipe([get("PASSWORD"), isEmpty]),
      ])(store.data);
    },
    opScan: asyncOpCreate((infraItem) =>
      rest.post(`cloudDiagram`, { infra_id: infraItem.id })
    ),
    op: asyncOpCreate((payload) => rest.post("infra", payload)),
    get isCreating() {
      return store.opScan.loading || store.op.loading;
    },
    create: action(async () => {
      store.errors = {};
      const payload = {
        providerType: "azure",
        providerName: "azure",
        name: store.data.name,
        providerAuth: store.data,
      };
      try {
        const result = await store.op.fetch(payload);
        await store.opScan.fetch(result);
        alertStack.add(
          <Alert severity="success" message={tr.t("Infrastructure Created")} />
        );
        history.push(`/infra/detail/${result.id}`, result);
        emitter.emit("infra.created", result);
      } catch (errors) {
        console.log(errors);
        // backend should 422 if the credentials are incorrect
        alertStack.add(
          <Alert
            severity="error"
            data-alert-error-create
            message={tr.t(
              "Error creating infrastructure, check the credentials"
            )}
          />
        );
      }
    }),
    opUpdate: asyncOpCreate((payload) =>
      rest.patch(`infra/${store.id}`, payload)
    ),
    update: action(async () => {
      store.errors = {};

      const payload = {
        providerType: "azure",
        name: store.data.name,
        providerAuth: store.data,
      };
      try {
        const result = await store.opUpdate.fetch(payload);
        alertStack.add(
          <Alert severity="success" message={tr.t("Infrastructure Updated")} />
        );
        history.push(`/infra/detail/${result.id}`, result);
        emitter.emit("infra.updated", result);
      } catch (errors) {
        console.log(errors);
        alertStack.add(
          <Alert
            severity="error"
            data-alert-error-update
            message={tr.t("Error updating infrastructure")}
          />
        );
      }
    }),
  });
  return store;
};

export const azureFormCreate = (context) => {
  const {
    tr,
    emitter,
    theme: { palette },
  } = context;
  const Spinner = spinner(context);
  const Form = form(context);
  const Button = button(context);
  const FormGroup = formGroup(context);
  const Input = input(context, {
    cssOverride: css`
      input {
        width: 25rem;
      }
    `,
  });

  return observer(({ store }) => (
    <Form data-infra-create-azure>
      <main>
        <p>
          Please follow the instructions to setup a service principal used by
          Grucloud to scan an Azure infrastructure.
        </p>
        <ol
          css={css`
            list-style: none;
            counter-reset: counter;
            padding-left: 40px;
            > li {
              counter-increment: counter;
              margin: 0 0 0.5rem 0;
              position: relative;
              ::before {
                background-color: ${palette.primary.main};
                color: ${palette.primary.contrastText};
                content: counter(counter) ".";
                font-weight: bold;
                position: absolute;
                --size: 32px;
                left: calc(-1 * var(--size) - 10px);
                line-height: var(--size);
                width: var(--size);
                height: var(--size);
                top: -0.3rem;
                border-radius: 50%;
                text-align: center;
              }
            }
          `}
        >
          <li>
            <h3>Name</h3>
            <p>Choose a name for this architecture.</p>
            <Input
              data-input-azure-name
              value={store.data.name}
              onChange={(e) => store.onChange("name", e.target.value)}
              label={tr.t("Infrastrucure Name")}
              error={store.errors.name && store.errors.name[0]}
            />
          </li>
          <li>
            <h3>Subscription ID</h3>
            <p>
              Retrieve the <em>Subscription ID</em> with the following command:{" "}
            </p>
            <pre>az account show --query id -otsv</pre>
            <Input
              data-input-azure-subscription-id
              value={store.data.SUBSCRIPTION_ID}
              onChange={(e) =>
                store.onChange("SUBSCRIPTION_ID", e.target.value)
              }
              label={tr.t("Subscription Id")}
              error={
                store.errors.SUBSCRIPTION_ID && store.errors.SUBSCRIPTION_ID[0]
              }
            />
          </li>
          <li>
            <h3>Tenant ID</h3>
            <p>
              Retrieve the <em>TENANT_ID</em> with the following command:{" "}
            </p>
            <pre>az account show</pre>
            <Input
              data-input-azure-tenant-id
              value={store.data.TENANT_ID}
              onChange={(e) => store.onChange("TENANT_ID", e.target.value)}
              label={tr.t("Tenant Id")}
              error={store.errors.TENANT_ID && store.errors.TENANT_ID[0]}
            />
          </li>
          <li>
            <h3>App ID and PASSWORD</h3>
            <p>
              Retrieve the <em>APP_ID</em> and <em>PASSWORD</em> by creating a
              service principal called grucloud:
            </p>
            <pre>az ad sp create-for-rbac -n "grucloud"</pre>
            <FormGroup>
              <Input
                data-input-azure-app-id
                value={store.data.APP_ID}
                onChange={(e) => store.onChange("APP_ID", e.target.value)}
                label={tr.t("App Id")}
                error={store.errors.APP_ID && store.errors.APP_ID[0]}
              />
            </FormGroup>
            <FormGroup>
              <Input
                data-input-azure-password
                type="PASSWORD"
                value={store.data.PASSWORD}
                onChange={(e) => store.onChange("PASSWORD", e.target.value)}
                label={tr.t("Password")}
                error={store.errors.PASSWORD && store.errors.PASSWORD[0]}
              />
            </FormGroup>
          </li>
        </ol>
      </main>
      <footer>
        <Button
          onClick={() => emitter.emit("step.select", "ProviderSelection")}
        >
          {"\u25c0"} Back
        </Button>
        <Button
          data-infra-create-submit
          disabled={store.isCreating}
          raised
          primary
          onClick={() => store.create()}
        >
          Save and Scan
        </Button>
        <Spinner
          css={css`
            visibility: ${store.isCreating ? "visible" : "hidden"};
          `}
          color={palette.primary.main}
        />
      </footer>
    </Form>
  ));
};
export const azureFormEdit = (context) => {
  const {
    tr,
    history,
    theme: { palette },
  } = context;
  const Spinner = spinner(context);
  const Form = form(context);
  const Button = button(context);
  const FormGroup = formGroup(context);
  const Input = input(context, {
    cssOverride: css`
      input {
        width: 25rem;
      }
    `,
  });
  const InfraDeleteLink = infraDeleteLink(context);

  return observer(({ store }) => (
    <Form>
      <header>
        <h2>{tr.t("Update Azure Infrastructure")}</h2>
      </header>
      <main>
        <FormGroup>
          <Input
            value={store.data.name}
            onChange={(e) => store.onChange("name", e.target.value)}
            label={tr.t("Infrastrucure Name")}
            error={store.errors.name && store.errors.name[0]}
          />
        </FormGroup>
        <FormGroup>
          <Input
            value={store.data.SUBSCRIPTION_ID}
            onChange={(e) => store.onChange("SUBSCRIPTION_ID", e.target.value)}
            label={tr.t("Subscription Id")}
            error={
              store.errors.SUBSCRIPTION_ID && store.errors.SUBSCRIPTION_ID[0]
            }
          />
        </FormGroup>
        <FormGroup>
          <Input
            value={store.data.TENANT_ID}
            onChange={(e) => store.onChange("TENANT_ID", e.target.value)}
            label={tr.t("Tenant Id")}
            error={store.errors.TENANT_ID && store.errors.TENANT_ID[0]}
          />
        </FormGroup>
        <FormGroup>
          <Input
            value={store.data.APP_ID}
            onChange={(e) => store.onChange("APP_ID", e.target.value)}
            label={tr.t("App Id")}
            error={store.errors.APP_ID && store.errors.APP_ID[0]}
          />
        </FormGroup>
        <FormGroup>
          <Input
            type="PASSWORD"
            value={store.data.PASSWORD}
            onChange={(e) => store.onChange("PASSWORD", e.target.value)}
            label={tr.t("Password")}
            error={store.errors.PASSWORD && store.errors.PASSWORD[0]}
          />
        </FormGroup>
      </main>
      <footer>
        <Button onClick={() => history.back()}>{"\u25c0"} Back</Button>
        <Button
          disabled={store.isDisabled}
          raised
          primary
          onClick={() => store.update()}
        >
          {tr.t("Update")}
        </Button>
        <Spinner
          css={css`
            visibility: ${store.opUpdate.loading ? "visible" : "hidden"};
          `}
          color={palette.primary.main}
        />
      </footer>
      <InfraDeleteLink store={store} />
    </Form>
  ));
};
