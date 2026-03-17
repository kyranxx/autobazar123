
export type AuthView = "login" | "register" | "reset" | "verify";
export type AuthField = "email" | "password" | "confirmPassword" | "fullName";
export type PasswordStrength = "weak" | "medium" | "strong" | null;

export interface AuthState {
  view: AuthView;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  loading: boolean;
  resendLoading: boolean;
  resendCooldown: number;
  showPassword: boolean;
  showConfirmPassword: boolean;
  agreedToTerms: boolean;
  wantsDealerAccount: boolean;
  viewTransitioning: boolean;
}

export interface AuthModalController {
  state: AuthState;
  passwordStrength: PasswordStrength;
  hasMinLength: boolean;
  hasLetterAndNumber: boolean;
  passwordsMatch: boolean;
  canSubmitRegister: boolean;
  loginEmailRef: React.RefObject<HTMLInputElement | null>;
  registerNameRef: React.RefObject<HTMLInputElement | null>;
  resetEmailRef: React.RefObject<HTMLInputElement | null>;
  closeModal: () => void;
  changeView: (nextView: AuthView) => void;
  handleLogin: (event: React.FormEvent) => Promise<void>;
  handleRegister: (event: React.FormEvent) => Promise<void>;
  handleResetPassword: (event: React.FormEvent) => Promise<void>;
  handleResendConfirmation: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  setField: (field: AuthField, value: string) => void;
  toggleShowPassword: () => void;
  toggleShowConfirmPassword: () => void;
  setAgreedToTerms: (checked: boolean) => void;
  setDealerIntent: (checked: boolean) => void;
}
