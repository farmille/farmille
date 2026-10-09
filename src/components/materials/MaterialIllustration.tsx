import Image from "next/image";
import { css } from "../../../styled-system/css";

export function MaterialIllustration({ imageUrl }: { imageUrl: string | null }) {
  return (
    <figure className={css({ m: "0" })}>
      <div
        className={css({
          w: "imagePreview",
          h: "imagePreview",
          display: "grid",
          placeItems: "center",
          borderRadius: "card",
          borderWidth: "1px",
          borderColor: "border.default",
          color: "text.subtle",
          fontSize: "xs",
        })}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="容器のイメージ"
            width={160}
            height={160}
            className={css({ w: "full", h: "full", objectFit: "contain" })}
          />
        ) : (
          "NO IMAGE"
        )}
      </div>
      <figcaption className={css({ mt: "1", color: "text.subtle", fontSize: "xs" })}>
        容器のイメージ
      </figcaption>
    </figure>
  );
}
