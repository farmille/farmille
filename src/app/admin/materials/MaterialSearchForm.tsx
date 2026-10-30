"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { parseAsString, useQueryState } from "nuqs";

import { Button } from "@/components/Button";
import { Input } from "@/components/form";
import { css } from "../../../../styled-system/css";

const formStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  alignItems: "center",
  mb: "3",
});

const inputStyle = css({ w: "full", maxW: "[320px]" });

export function MaterialSearchForm() {
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false, history: "push", scroll: false }),
  );

  return (
    <SearchForm key={query} query={query} onSearch={(value) => void setQuery(value || null)} />
  );
}

function SearchForm({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const form = useForm({
    defaultValues: { query },
    onSubmit: ({ value }) => onSearch(value.query.trim()),
  });

  const value = useStore(form.store, (state) => state.values.query);

  return (
    <form
      action="/admin/materials"
      className={formStyle}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Input
        hideLabel
        label="資材名・メーカー名で検索"
        fieldClassName={inputStyle}
        name="q"
        onChange={(event) => form.setFieldValue("query", event.target.value)}
        placeholder="資材名・メーカー名で検索"
        type="search"
        value={value}
      />
      <Button size="sm" type="submit" variant="ghost">
        検索
      </Button>
    </form>
  );
}
