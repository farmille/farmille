import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useForm, useStore } from "@tanstack/react-form";
import { fn } from "storybook/test";
import { css } from "../../../../styled-system/css";
import { applicationCopy } from "@/lib/company-application-copy";

import { ConsentFields } from "./ConsentFields";
const meta = {
  title: "Pages/company-requests/ConsentFields",
  component: ConsentFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { kind: "registration", values: [], onChange: fn() },
  render: function ControlledConsentFields(args) {
    const form = useForm({
      defaultValues: { consents: applicationCopy[args.kind].consents.map(() => false) },
    });
    const values = useStore(form.store, (state) => state.values.consents);
    return (
      <ConsentFields
        {...args}
        values={values}
        onChange={(index, checked) =>
          form.setFieldValue("consents", (current) =>
            current.map((value, i) => (i === index ? checked : value)),
          )
        }
      />
    );
  },
  decorators: [(Story) => <div className={css({ p: "4" })}>{Story()}</div>],
} satisfies Meta<typeof ConsentFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
