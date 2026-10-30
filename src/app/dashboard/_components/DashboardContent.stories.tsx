import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DashboardContent } from "./DashboardContent";

const meta = {
  title: "Pages/dashboard/DashboardContent",
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

export const WithMaterials: Story = {
  args: {
    seller: {
      ...meta.args.seller,
      logo_url: "https://example.com/logo.png",
      profile_text:
        "1978年の創業以来、土壌微生物の研究をもとにした資材を開発しています。北海道から沖縄まで、全国の生産者と試験圃場で効果を確かめながら製品を改良しています。製品の使い方や試験の結果は、各製品ページで公開しています。",
    },
    materials: [
      {
        id: "55555555-5555-4555-8555-555555555551",
        name: "バイオルート液剤",
        manufacturer_name: "農業資材株式会社",
        avg_rating: 4.2,
        publication_status: "published",
        manufacturer_verified_at: "2026-09-01T00:00:00Z",
        container_type_id: 1,
      },
      {
        id: "55555555-5555-4555-8555-555555555552",
        name: "微生物たい肥ミックス 20kg 有機JAS適合資材（施設栽培・露地栽培兼用）",
        manufacturer_name: "農業資材株式会社",
        avg_rating: null,
        publication_status: "published",
        manufacturer_verified_at: null,
        container_type_id: 1,
      },
      {
        id: "55555555-5555-4555-8555-555555555553",
        name: "旧製品 土壌改良材",
        manufacturer_name: "農業資材株式会社",
        avg_rating: 3.5,
        publication_status: "archived",
        manufacturer_verified_at: "2025-04-01T00:00:00Z",
        container_type_id: 1,
      },
    ],
  },
};
