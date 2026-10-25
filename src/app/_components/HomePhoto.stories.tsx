import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import heroPhoto from "./home-hero-rice-field.webp";
import { HomePhoto } from "./HomePhoto";

const meta = {
  title: "Pages/Home/HomePhoto",
  component: HomePhoto,
  args: { alt: "", ratio: "landscape", sizes: "100vw", src: heroPhoto },
  decorators: [
    (Story) => (
      <div className={css({ maxW: "content.form" })}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomePhoto>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Landscape: Story = {};
export const Portrait: Story = { args: { ratio: "portrait" } };
export const Square: Story = { args: { ratio: "square" } };
