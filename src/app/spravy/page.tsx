import { redirect } from "next/navigation";

export default function MessagesRedirect() {
  redirect("/moj-ucet?tab=messages");
}
