import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { css } from "../../styled-system/css";
import { Button } from "./Button";
import { FormPageShell } from "./FormPageShell";
import { Input } from "./Input";
import { SurfaceCard } from "./SurfaceCard";
import { Textarea } from "./Textarea";

const field = css({
  mt: "5",
  _first: { mt: "0" },
});

const label = css({
  display: "block",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "700",
});

const fixedFooter = css({
  position: "fixed",
  left: "3",
  right: "3",
  bottom: "3",
  maxW: "content.form",
  mx: "auto",
  p: "3",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const meta = {
  title: "Components/FormPageShell",
  component: FormPageShell,
  args: {
    chrome: "public",
    title: "感想口コミを投稿",
    backHref: "/materials/m-001",
  },
} satisfies Meta<typeof FormPageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <form>
        <div className={field}>
          <label className={label} htmlFor="crop">
            対象の作物
          </label>
          <Input id="crop" name="crop" defaultValue="トマト（施設）" />
        </div>
        <div className={field}>
          <label className={label} htmlFor="body">
            感想口コミ本文
          </label>
          <Textarea
            id="body"
            name="body"
            defaultValue="定植前に土壌灌注で使用。うどんこ病の発生が例年より明らかに少なく、追肥との併用でも問題なかった。リピート予定。"
          />
        </div>
        <div className={field}>
          <Button type="submit" onClick={fn()}>
            投稿する
          </Button>
        </div>
      </form>
    ),
  },
};

export const WithFixedFooter: Story = {
  args: {
    title: "実証詳細レポートを投稿",
    hasFixedFooter: true,
    children: (
      <>
        <form>
          <div className={field}>
            <label className={label} htmlFor="material-name">
              資材名
            </label>
            <Input id="material-name" name="material-name" placeholder="例：木酢液プレミアム" />
          </div>
          <div className={field}>
            <label className={label} htmlFor="report-body">
              実証詳細レポート
            </label>
            <Textarea
              id="report-body"
              name="report-body"
              placeholder="散布時期・希釈倍率・効果の実感などを記録してください"
            />
          </div>
        </form>
        <div className={fixedFooter}>
          <Button onClick={fn()}>次へ進む</Button>
        </div>
      </>
    ),
  },
};

export const MaterialVariant: Story = {
  args: {
    variant: "material",
    title: "バチルス菌体資材 ツチイキル",
    children: (
      <SurfaceCard
        title="使用のポイント"
        description="施用前によく振ってから、株元にかん注してください。"
      >
        <p>定植の2週間前から使用すると、根の活着が安定しやすくなります。</p>
      </SurfaceCard>
    ),
  },
};

export const MaterialWithFab: Story = {
  args: {
    variant: "material",
    hasFab: true,
    title: "トリコデルマ菌床 ネマガード",
    children: (
      <SurfaceCard title="口コミサマリー" description="直近30件の感想口コミから抽出した傾向です。">
        <p>「効果を実感」との回答が7割を超え、リピート意向も高い傾向です。</p>
      </SurfaceCard>
    ),
  },
};
