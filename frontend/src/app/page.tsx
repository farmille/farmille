import { css } from "../../styled-system/css";

export default function Home() {
  return (
    <main>
      <h1
        className={css({
          color: "green.700",
          fontSize: "2xl",
          fontWeight: "bold",
        })}
      >
        Farmille
      </h1>
    </main>
  );
}
