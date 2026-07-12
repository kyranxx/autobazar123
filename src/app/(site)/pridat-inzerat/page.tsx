import { redirect } from "next/navigation";
import { CREATE_LISTING_ROUTE } from "@/lib/routes";

export default function AddAdPage() {
  redirect(CREATE_LISTING_ROUTE);
}
