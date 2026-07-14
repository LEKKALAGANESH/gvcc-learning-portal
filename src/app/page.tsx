import { redirect } from "next/navigation";

// Middleware already gates auth; send everyone to the library entry point.
export default function Home() {
  redirect("/library");
}
