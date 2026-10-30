declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

const scripts = new Map<string, Promise<void>>();

/** reCAPTCHA v3 の script を読み込む。使う画面を開いたときだけ呼ぶ。 */
export function loadRecaptcha(siteKey: string): Promise<void> {
  const loaded = scripts.get(siteKey);

  if (loaded !== undefined) return loaded;

  const loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      scripts.delete(siteKey);
      script.remove();
      reject(new Error("reCAPTCHA を読み込めませんでした。"));
    });
    document.head.append(script);
  });

  scripts.set(siteKey, loading);

  return loading;
}

/** action を付けたトークンを取る。トークンの有効期限は2分なので、送る直前に呼ぶ。 */
export async function executeRecaptcha(siteKey: string, action: string): Promise<string> {
  await loadRecaptcha(siteKey);
  const { grecaptcha } = window;

  if (grecaptcha === undefined) throw new Error("reCAPTCHA を読み込めませんでした。");
  await new Promise<void>((resolve) => grecaptcha.ready(resolve));

  return grecaptcha.execute(siteKey, { action });
}
