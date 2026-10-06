import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DashboardContent } from "./DashboardContent";

const meta = {
  title: "Dashboard/DashboardContent",
  component: DashboardContent,
  args: {
    seller: {
      id: "11111111-1111-4111-8111-111111111111",
      official_name: "農業資材株式会社",
      manufacturer_name: "農業資材株式会社",
      login_id: "agri-maker",
      contact_email: "contact@example.com",
      contact_name: "山田太郎",
      location: "東京都千代田区",
      region_scope: "全国",
      website_url: "https://example.com",
      logo_url: null,
      profile_text: "農業資材の開発・製造を行っています。",
      status: "approved",
      approved_at: "2026-09-23T00:00:00Z",
    },
    materials: [],
  },
} satisfies Meta<typeof DashboardContent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
