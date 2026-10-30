import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";
import { beginApplication } from "@/app/company-requests/actions";
import { emptyContact } from "@/app/company-requests/_components/ContactFields";
import { NewApplicationForm } from "./NewApplicationForm";

const meta = {
  title: "Pages/dashboard/applications/new/NewApplicationForm",
  component: NewApplicationForm,
  args: {
    kind: "registration",
    defaults: {
      ...emptyContact,
      companyName: "しおさい資材株式会社",
      email: "contact@example.test",
    },
    recipient: "contact@example.test",
  },
} satisfies Meta<typeof NewApplicationForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Failed: Story = {
  beforeEach: () => {
    mocked(beginApplication).mockResolvedValue({ ok: false, error: "internal" });
  },
};

export const Retried: Story = {
  beforeEach: () => {
    mocked(beginApplication)
      .mockResolvedValueOnce({ ok: false, error: "internal" })
      .mockResolvedValue({ ok: true, data: "11111111-1111-4111-8111-111111111111" });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "もう一度試す" }));
    await expect(canvas.queryByRole("button", { name: "もう一度試す" })).not.toBeInTheDocument();
  },
};
