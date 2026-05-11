import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AvatarUpload } from "./avatar-upload";

// Phase 19: AvatarUpload の MIME / サイズガードを検証する。
// supabase client (storage.upload) は spy で握りつぶす。

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
  }),
}));

describe("AvatarUpload", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({
      data: {
        publicUrl:
          "https://abcd.supabase.co/storage/v1/object/public/avatars/u/avatar/x.png",
      },
    });
  });

  it("rejects files larger than 2MB", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AvatarUpload
        userId="11111111-1111-1111-1111-111111111111"
        currentAvatarUrl={null}
        value={null}
        onChange={onChange}
      />,
    );
    const oversize = new File([new Uint8Array(3 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, oversize);
    expect(uploadMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("2MB");
  });

  it("rejects unsupported mime types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AvatarUpload
        userId="11111111-1111-1111-1111-111111111111"
        currentAvatarUrl={null}
        value={null}
        onChange={onChange}
      />,
    );
    const gif = new File([new Uint8Array(10)], "x.gif", { type: "image/gif" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, gif);
    expect(uploadMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("WebP");
  });

  it("uploads accepted png and reports the public URL", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AvatarUpload
        userId="11111111-1111-1111-1111-111111111111"
        currentAvatarUrl={null}
        value={null}
        onChange={onChange}
      />,
    );
    const png = new File([new Uint8Array(10)], "face.png", {
      type: "image/png",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, png);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [path] = uploadMock.mock.calls[0];
    expect(path).toMatch(
      /^11111111-1111-1111-1111-111111111111\/avatar\/.+_face\.png$/,
    );
    expect(onChange).toHaveBeenCalledWith(
      "https://abcd.supabase.co/storage/v1/object/public/avatars/u/avatar/x.png",
    );
  });

  it("clear button emits null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AvatarUpload
        userId="11111111-1111-1111-1111-111111111111"
        currentAvatarUrl="https://abcd.supabase.co/storage/v1/object/public/avatars/u/avatar/old.png"
        value={null}
        onChange={onChange}
      />,
    );
    const clearBtn = screen.getByRole("button", { name: /アバターを削除/ });
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
