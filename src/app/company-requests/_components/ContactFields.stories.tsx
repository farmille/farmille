import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useForm, useStore } from "@tanstack/react-form";
import { fn } from "storybook/test";
import { css } from "../../../../styled-system/css";

import { ContactFields } from "./ContactFields";
import { emptyContact } from "./ContactFields";
const meta = {
  title: "Pages/company-requests/ContactFields",
  component: ContactFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { values: emptyContact, onChange: fn() },
  render: function ControlledContactFields(args) {
    const form = useForm({ defaultValues: args.values });
    const values = useStore(form.store, (state) => state.values);
    return (
      <ContactFields
        {...args}
        values={values}
        onChange={(name, value) => form.setFieldValue(name, value)}
      />
    );
  },
  decorators: [(Story) => <div className={css({ p: "4" })}>{Story()}</div>],
} satisfies Meta<typeof ContactFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
