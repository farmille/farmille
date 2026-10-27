/** エラーの印が付いた入力欄。Base UI は入力欄に aria-invalid、Field.Root に data-invalid を付ける。 */
const INVALID_SELECTOR = '[aria-invalid="true"], [data-invalid]';

const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 画面の上から見て最初のエラーの欄を画面の中央へ移し、その入力欄にフォーカスする。
 * スマホで送信ボタンを押したあと、画面の外にある欄のエラーに気付けるようにする。
 */
export function revealFirstError(form: HTMLFormElement): boolean {
  const invalid = form.querySelector<HTMLElement>(INVALID_SELECTOR);
  if (invalid === null) return false;
  const control = invalid.matches(FOCUSABLE_SELECTOR)
    ? invalid
    : invalid.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  const target = control ?? invalid;
  // 見出し・エラー文も見えるよう、入力欄を中央に置く
  target.scrollIntoView({ block: "center" });
  control?.focus({ preventScroll: true });
  return true;
}
