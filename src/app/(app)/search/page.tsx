import type { Metadata } from "next";
import { SearchClient } from "@/components/search-client";

export const metadata: Metadata = { title: "さがす" };

export default function SearchPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">さがす</h1>
      <SearchClient />
    </>
  );
}
