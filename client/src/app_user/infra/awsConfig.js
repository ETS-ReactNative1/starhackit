/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { observable, action } from "mobx";
import { observer } from "mobx-react";
import validate from "validate.js";
import { get, or, pipe } from "rubico";
import { isEmpty } from "rubico/x";

import AsyncOp from "mdlean/lib/utils/asyncOp";
import button from "mdlean/lib/button";
import input from "mdlean/lib/input";
import formGroup from "mdlean/lib/formGroup";
import spinner from "mdlean/lib/spinner";
import alert from "mdlean/lib/alert";

import createForm from "components/form";
import { infraDeleteLink } from "./infraDeleteLink";
import { buttonWizardBack, buttonHistoryBack } from "./wizardCreate";

const AWS_REGION = [
  "eu-north-1",
  "ap-south-1",
  "eu-west-3",
  "eu-west-2",
  "eu-west-1",
  "ap-northeast-3",
  "ap-northeast-2",
  "ap-northeast-1",
  "sa-east-1",
  "ca-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "eu-central-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
];

import selectRegion from "./SelectRegion";

const rules = {
  name: {
    presence: true,
    length: {
      minimum: 3,
      message: "must be at least 3 characters",
    },
  },
  AWSAccessKeyId: {
    presence: true,
    length: {
      minimum: 20,
      message: "must be at least 20 characters",
    },
  },
  AWSSecretKey: {
    presence: true,
    length: {
      minimum: 40,
      message: "must be at least 40 characters",
    },
  },
};

const defaultData = {
  id: "",
  name: "",
  AWSAccessKeyId: "",
  AWSSecretKey: "",
  AWS_REGION: "us-east-1",
};

export const createStoreAws = (
  context,
  { gitCredentialStore, gitRepositoryStore }
) => {
  const { tr, history, alertStack, rest, emitter } = context;
  const Alert = alert(context);
  const asyncOpCreate = AsyncOp(context);

  const buildPayload = ({ data }) => ({
    name: data.name,
    providerType: "aws",
    providerName: "aws",
    providerAuth: {
      AWSAccessKeyId: data.AWSAccessKeyId.trim(),
      AWSSecretKey: data.AWSSecretKey,
      AWS_REGION: data.AWS_REGION,
    },
    git_credential_id: gitCredentialStore.id,
    git_repository_id: gitRepositoryStore.id,
  });

  const store = observable({
    id: "",
    data: defaultData,
    errors: {},
    onChange: action((field, event) => {
      store.data[field] = event.target.value;
    }),
    reset: action(() => {
      store.data = defaultData;
    }),
    setData: action((data) => {
      store.id = data.id;
      store.data = data.providerAuth;
      store.data.name = data.name;
    }),
    opScan: asyncOpCreate((infraItem) =>
      rest.post(`cloudDiagram`, { infra_id: infraItem.id })
    ),
    op: asyncOpCreate((payload) => rest.post("infra", payload)),
    get isCreating() {
      return store.opScan.loading || store.op.loading;
    },
    get isDisabled() {
      return or([
        pipe([get("name"), isEmpty]),
        pipe([get("AWSAccessKeyId"), isEmpty]),
        pipe([get("AWSSecretKey"), isEmpty]),
      ])(store.data);
    },
    create: action(async () => {
      store.errors = {};
      const { data } = store;

      const vErrors = validate(data, rules);
      if (vErrors) {
        store.errors = vErrors;
        return;
      }

      try {
        const result = await store.op.fetch(buildPayload({ data: store.data }));
        await store.opScan.fetch(result);
        alertStack.add(
          <Alert severity="success" message={tr.t("Infrastructure Created")} />
        );
        history.push(`/infra/detail/${result.id}`, result);
        emitter.emit("infra.created", result);
      } catch (errors) {
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
    get isUpdating() {
      return store.opScan.loading || store.opUpdate.loading;
    },
    update: action(async () => {
      store.errors = {};
      const { data } = store;
      const vErrors = validate(data, rules);
      if (vErrors) {
        store.errors = vErrors;
        return;
      }

      try {
        const result = await store.opUpdate.fetch(buildPayload(store));
        await store.opScan.fetch(result);

        alertStack.add(
          <Alert severity="success" message={tr.t("Infrastructure Udated")} />
        );
        history.push(`/infra/detail/${result.id}`, result);
        emitter.emit("infra.updated", result);
      } catch (errors) {
        alertStack.add(
          <Alert
            severity="error"
            data-alert-error-update
            message={tr.t("Error updating the infrastructure")}
          />
        );
      }
    }),
  });
  return store;
};

export const awsConfigForm = (context) => {
  const { tr } = context;
  const FormGroup = formGroup(context);
  const AwsSelectRegion = selectRegion(context, { items: AWS_REGION });
  const Input = input(context, {
    cssOverride: css`
      > input {
        width: 300px;
      }
    `,
  });

  return observer(({ store }) => (
    <>
      <FormGroup>
        <Input
          autoFocus
          name="infraName"
          value={store.data.name}
          onChange={(event) => store.onChange("name", event)}
          label={tr.t("Infrastructure Name")}
          error={get("name[0]")(store.errors)}
        />
      </FormGroup>
      <FormGroup>
        <Input
          name="AWSAccessKeyId"
          value={store.data.AWSAccessKeyId}
          onChange={(event) => store.onChange("AWSAccessKeyId", event)}
          autoComplete="off"
          label={tr.t("AWS Access Key Id")}
          error={get("AWSAccessKeyId[0]")(store.errors)}
        />
      </FormGroup>
      <FormGroup>
        <Input
          name="AWSSecretKey"
          value={store.data.AWSSecretKey}
          onChange={(event) => store.onChange("AWSSecretKey", event)}
          label={tr.t("AWS Secret Key")}
          type="password"
          error={get("AWSSecretKey[0]")(store.errors)}
        />
      </FormGroup>
      <FormGroup className="aws-region">
        <AwsSelectRegion
          placeholder="Select a region"
          value={store.data.AWS_REGION}
          onSelected={(region) => {
            store.data.AWS_REGION = region;
          }}
        />
      </FormGroup>
    </>
  ));
};

export const awsFormCreate = (context) => {
  const {
    tr,
    theme: { palette },
  } = context;
  const Form = createForm(context);
  const Spinner = spinner(context);
  const Button = button(context);
  const ButtonWizardBack = buttonWizardBack(context);

  const AwsConfigForm = awsConfigForm(context);

  return observer(({ store }) => (
    <Form spellCheck="false" autoCapitalize="none" data-infra-create-aws>
      <header>
        <h2>{tr.t("Create new AWS Infrastructure")}</h2>
      </header>
      <main>
        <div>
          {tr.t(
            "Please provide the following information to create and scan a new infrastructure"
          )}
        </div>
        <AwsConfigForm store={store} />
      </main>
      <footer>
        <ButtonWizardBack />
        <Button
          data-button-submit
          primary
          raised
          disabled={store.isCreating || store.isDisabled}
          onClick={() => store.create()}
          label={tr.t("Create Infrastructure")}
        />
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

export const awsFormEdit = (context) => {
  const {
    tr,
    history,
    theme: { palette },
  } = context;

  const Form = createForm(context);
  const Spinner = spinner(context);
  const Button = button(context, {
    cssOverride: css``,
  });
  const AwsConfigForm = awsConfigForm(context);
  const InfraDeleteLink = infraDeleteLink(context);
  const ButtonHistoryBack = buttonHistoryBack(context);

  return observer(({ store }) => (
    <Form spellCheck="false" autoCapitalize="none" data-infra-update>
      <header>
        <h2>{tr.t("Update AWS Infrastructure")}</h2>
      </header>
      <main>
        <AwsConfigForm store={store} />
      </main>
      <footer>
        <ButtonHistoryBack />
        <Button
          data-infra-update-submit
          primary
          raised
          disabled={store.isUpdating}
          onClick={() => store.update()}
          label={tr.t("Update Infrastructure")}
        />
        <Spinner
          css={css`
            visibility: ${store.isUpdating ? "visible" : "hidden"};
          `}
          color={palette.primary.main}
        />
      </footer>
      <InfraDeleteLink store={store} />
    </Form>
  ));
};
