import type { Metadata } from "next";
import { EmbedCatalogApp } from "@/components/EmbedCatalogApp";

export const metadata: Metadata = {
  title: "Digital Catalog Embed",
  description: "Embeddable digital catalog viewer."
};

export default function EmbedPage() {
  return <EmbedCatalogApp />;
}
