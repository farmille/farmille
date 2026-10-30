"use client";

import Form from "next/form";
import { useForm, useStore } from "@tanstack/react-form";

import { SearchInput } from "@/components/form";
import { css } from "../../../styled-system/css";

const entry = css({ display: "block", w: "full", m: "0" });

export function HomeSearchEntry() {
  const form = useForm({ defaultValues: { query: "" } });
  const query = useStore(form.store, (state) => state.values.query);
  return (
    <Form action="/search" aria-label="資材検索" className={entry} role="search">
      <SearchInput
        aria-label="資材を検索する。作物、悩み、資材名から探せます"
        name="q"
        onValueChange={(value) => form.setFieldValue("query", value)}
        placeholder="作物・悩み・資材名から探す"
        size="lg"
        submitLabel="検索"
        surface="raised"
        value={query}
      />
    </Form>
  );
}
