import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  const session = await getSession();
  
  if (session) {
    redirect("/admin/dashboard");
  }

  return <RegisterForm />;
}
