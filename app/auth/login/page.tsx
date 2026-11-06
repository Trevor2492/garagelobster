import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="flex flex-col min-h-svh w-full items-center justify-center p-6 md:p-10 gap-5">
      <h1 className="mb-6 text-center text-2xl font-semibold">
        Garage Lobster Login
      </h1>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
