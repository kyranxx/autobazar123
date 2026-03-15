import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { NextIntlClientProvider } from "next-intl";
import AuthModal from "./AuthModal";
import skMessages from "@/i18n/messages/sk.json";

export function renderAuthModal(props: ComponentProps<typeof AuthModal>) {
  return render(
    <NextIntlClientProvider locale="sk" messages={skMessages}>
      <AuthModal {...props} />
    </NextIntlClientProvider>,
  );
}

export function getRegisterFormElements() {
  const fullNameInput = document.getElementById(
    "auth-register-full-name",
  ) as HTMLInputElement | null;
  const emailInput = document.getElementById(
    "auth-register-email",
  ) as HTMLInputElement | null;
  const passwordInput = document.getElementById(
    "auth-register-password",
  ) as HTMLInputElement | null;
  const confirmPasswordInput = document.getElementById(
    "auth-register-confirm-password",
  ) as HTMLInputElement | null;
  const termsCheckbox = document.getElementById(
    "auth-register-terms",
  ) as HTMLInputElement | null;

  return {
    fullNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    termsCheckbox,
  };
}

export function fillRegisterForm({
  fullName = "Test User",
  email = "test@example.com",
  password = "secret1234",
  confirmPassword = password,
}: {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  const fields = getRegisterFormElements();

  fireEvent.change(fields.fullNameInput!, { target: { value: fullName } });
  fireEvent.change(fields.emailInput!, { target: { value: email } });
  fireEvent.change(fields.passwordInput!, { target: { value: password } });
  fireEvent.change(fields.confirmPasswordInput!, {
    target: { value: confirmPassword },
  });
  fireEvent.click(fields.termsCheckbox!);

  return fields;
}
