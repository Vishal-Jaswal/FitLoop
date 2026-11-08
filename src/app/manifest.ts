import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitLoop — Train with intention",
    short_name: "FitLoop",
    description: "A calmer, more intentional way to track your fitness journey.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
