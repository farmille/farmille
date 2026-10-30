import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteFooter } from "./SiteFooter";

const meta = { title: "Pages/Shared/SiteFooter", component: SiteFooter } satisfies Meta<
  typeof SiteFooter
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ヘッダーが「ログイン中」の目印を付けた画面では、会員登録のリンクを出さない。 */
export const SignedIn: Story = {
  decorators: [
    (Story) => (
      <>
        <span data-signed-in="true" hidden />
        <Story />
      </>
    ),
  ],
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile375", isRotated: false } },
};
