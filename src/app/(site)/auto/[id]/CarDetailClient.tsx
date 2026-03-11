"use client";

import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useReducer,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { formatCurrency } from "@/config/vat";
import { createClient } from "@/lib/supabase/client";
import type { CarData, SimilarCar } from "@/lib/cars/car-detail";
import { useAuthOptional } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { optimizeCloudflareImage } from "@/lib/image-optimizer";
import { buildAdPath } from "@/lib/cars/ad-path";
import TurnstileCaptcha from "@/components/security/TurnstileCaptcha";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  HeartIcon,
  ShareIcon,
  SpinnerIcon,
} from "@/components/ui/Icons";
import { getCityCoordinates } from "@/lib/geo/cities";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";

const SimpleMap = dynamic(() => import("@/components/SimpleMap"), {
  ssr: false,
});

interface CarDetailClientProps {
  carId: string;
  initialCar: CarData | null;
  initialSimilarCars: SimilarCar[];
}

interface CarDetailState {
  car: CarData | null;
  similarCars: SimilarCar[];
  isLoading: boolean;
  error: string;
  selectedImageIndex: number;
  isSaved: boolean;
  showPhone: boolean;
  showContactForm: boolean;
  contactMessage: string;
  isSendingMessage: boolean;
  messageSent: boolean;
}

type CarDetailAction =
  | { type: "set_selected_image"; index: number }
  | { type: "set_saved"; isSaved: boolean }
  | { type: "toggle_phone" }
  | { type: "toggle_contact_form"; defaultMessage: string }
  | { type: "set_contact_message"; contactMessage: string }
  | { type: "send_message_start" }
  | { type: "send_message_finished"; messageSent: boolean };

function createInitialState(
  initialCar: CarData | null,
  initialSimilarCars: SimilarCar[],
): CarDetailState {
  return {
    car: initialCar,
    similarCars: initialSimilarCars,
    isLoading: false,
    error: initialCar ? "" : "Inzerát sa nepodarilo načítať",
    selectedImageIndex: 0,
    isSaved: false,
    showPhone: false,
    showContactForm: false,
    contactMessage: "",
    isSendingMessage: false,
    messageSent: false,
  };
}

const LOADING_SKELETON_KEYS = [
  "loading-spec-1",
  "loading-spec-2",
  "loading-spec-3",
  "loading-spec-4",
];

function carDetailReducer(
  state: CarDetailState,
  action: CarDetailAction,
): CarDetailState {
  switch (action.type) {
    case "set_selected_image":
      return {
        ...state,
        selectedImageIndex: action.index,
      };
    case "set_saved":
      return {
        ...state,
        isSaved: action.isSaved,
      };
    case "toggle_phone":
      return {
        ...state,
        showPhone: !state.showPhone,
      };
    case "toggle_contact_form": {
      const willOpen = !state.showContactForm;
      return {
        ...state,
        showContactForm: willOpen,
        contactMessage:
          willOpen && !state.contactMessage.trim()
            ? action.defaultMessage
            : state.contactMessage,
      };
    }
    case "set_contact_message":
      return {
        ...state,
        contactMessage: action.contactMessage,
      };
    case "send_message_start":
      return {
        ...state,
        isSendingMessage: true,
      };
    case "send_message_finished":
      return {
        ...state,
        isSendingMessage: false,
        messageSent: action.messageSent,
      };
    default:
      return state;
  }
}

export default function CarDetailClient({
  carId,
  initialCar,
  initialSimilarCars,
}: CarDetailClientProps) {
  const { user } = useAuthOptional();
  const [state, dispatch] = useReducer(
    carDetailReducer,
    createInitialState(initialCar, initialSimilarCars),
  );
  const [contactCaptchaToken, setContactCaptchaToken] = useState<string | null>(null);
  const [contactCaptchaKey, setContactCaptchaKey] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!carId || !initialCar) {
      return;
    }

    const supabase = createClient();

    void (async () => {
      try {
        await supabase.rpc("increment_ad_views", { ad_id: carId });
      } catch (error) {
        console.error("Error incrementing car views:", error);
      }
    })();
  }, [carId, initialCar]);

  useEffect(() => {
    let isActive = true;

    if (!userId) {
      dispatch({ type: "set_saved", isSaved: false });
      return () => {
        isActive = false;
      };
    }

    const supabase = createClient();

    const syncSavedState = async () => {
      try {
        const { data, error } = await supabase
          .from("saved_ads")
          .select("id")
          .eq("user_id", userId)
          .eq("ad_id", carId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (isActive) {
          dispatch({ type: "set_saved", isSaved: Boolean(data) });
        }
      } catch (error) {
        console.error("Error loading saved state:", error);
      }
    };

    void syncSavedState();

    return () => {
      isActive = false;
    };
  }, [carId, userId]);

  const car = state.car;

  const handleSaveToggle = async () => {
    if (!user) {
      toast.info("Pre uloženie inzerátu sa musíte prihlásiť.");
      return;
    }

    try {
      const supabase = createClient();
      if (state.isSaved) {
        await supabase
          .from("saved_ads")
          .delete()
          .eq("user_id", user.id)
          .eq("ad_id", carId);
        dispatch({ type: "set_saved", isSaved: false });
        toast.success("Inzerát odstránený z obľúbených");
        return;
      }

      await supabase.from("saved_ads").insert({ user_id: user.id, ad_id: carId });
      dispatch({ type: "set_saved", isSaved: true });
      toast.success("Inzerát uložený");
    } catch {
      toast.error("Nepodarilo sa upraviť obľúbené inzeráty");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Odkaz skopírovaný do schránky");
    } catch {
      toast.error("Nepodarilo sa skopírovať odkaz");
    }
  };

  const handleShareLink = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: car ? `${car.brand} ${car.model}` : "Autobazar123",
          text: car
            ? `Pozrite si inzerát ${car.brand} ${car.model} na Autobazar123.`
            : "Pozrite si tento inzerát na Autobazar123.",
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await handleCopyLink();
  };

  const submitMessage = async () => {
    if (!user) {
      toast.info("Pre odoslanie správy sa musíte prihlásiť.");
      return;
    }

    if (!car?.id || !state.contactMessage.trim()) {
      return;
    }

    if (!contactCaptchaToken) {
      toast.error("Pred odoslanym správy potvrďte captcha.");
      return;
    }

    dispatch({ type: "send_message_start" });

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId: car.id,
          recipientId: car.seller.id,
          message: state.contactMessage,
          captchaToken: contactCaptchaToken,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Nepodarilo sa odoslať dopyt.");
        dispatch({ type: "send_message_finished", messageSent: false });
        return;
      }
      toast.success("Správa odoslaná");
      setContactCaptchaToken(null);
      setContactCaptchaKey((value) => value + 1);
      dispatch({ type: "send_message_finished", messageSent: true });
    } catch {
      toast.error("Nepodarilo sa odoslať dopyt");
      dispatch({ type: "send_message_finished", messageSent: false });
    }
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!state.isSendingMessage && state.contactMessage.trim()) {
        void submitMessage();
      }
    }
  };

  const handleMessagePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText) {
      return;
    }

    event.preventDefault();
    dispatch({
      type: "set_contact_message",
      contactMessage: pastedText.replace(/\r\n/g, "\n").replace(/\u3000/g, " ").trim(),
    });
  };

  if (state.isLoading) {
    return <CarLoadingSkeleton />;
  }

  if (state.error || !car) {
    return <CarNotFoundState />;
  }

  const cityCoords = car.location_city ? getCityCoordinates(car.location_city) : null;
  const defaultContactMessage = `Dobrý deň, mám záujem o ${car.brand} ${car.model}. Je vozidlo stále dostupné?`;

  return (
    <main className="pt-6 pb-20 sm:pt-8 bg-background">
      <div className="container-main">
        <CarBreadcrumb brand={car.brand} model={car.model} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-10">
            <CarGallery
              car={car}
              selectedImageIndex={state.selectedImageIndex}
              onSelectImage={(index) =>
                dispatch({ type: "set_selected_image", index })
              }
            />

            <CarHeading
              car={car}
              isSaved={state.isSaved}
              onToggleSaved={handleSaveToggle}
              onShare={handleShareLink}
              onCopyLink={handleCopyLink}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SpecItem label="Výkon" value={`${car.power_kw} kW`} />
              <SpecItem label="Objem" value={`${car.engine_volume_cm3} cm3`} />
              <SpecItem label="Karoséria" value={car.body_style} />
              <SpecItem label="Farba" value={car.color || "-"} />
            </div>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                Popis vozidlá
              </h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {car.description}
              </p>
            </section>

            {car.equipment_json?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  Výbava
                </h2>
                <div className="flex flex-wrap gap-2">
                  {toUniqueKeyedStrings(car.equipment_json, "equipment").map((entry) => (
                    <span
                      key={entry.key}
                      className="px-3 py-1.5 bg-surface rounded-full text-xs text-text-secondary border border-border-subtle"
                    >
                      {entry.value}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {cityCoords && (
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  Poloha
                </h2>
                <SimpleMap
                  lat={cityCoords.lat}
                  lng={cityCoords.lng}
                  radiusKm={0}
                  cityName={car.location_city}
                />
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <ContactSellerCard
              car={car}
              showPhone={state.showPhone}
              showContactForm={state.showContactForm}
              contactMessage={state.contactMessage}
              isSendingMessage={state.isSendingMessage}
              messageSent={state.messageSent}
              onTogglePhone={() => dispatch({ type: "toggle_phone" })}
              onToggleContactForm={() =>
                dispatch({
                  type: "toggle_contact_form",
                  defaultMessage: defaultContactMessage,
                })
              }
              onSubmit={handleSendMessage}
              onMessageChange={(value) =>
                dispatch({ type: "set_contact_message", contactMessage: value })
              }
              onMessageKeyDown={handleMessageKeyDown}
              onMessagePaste={handleMessagePaste}
              contactCaptchaToken={contactCaptchaToken}
              captchaInstanceKey={contactCaptchaKey}
              onContactCaptchaTokenChange={setContactCaptchaToken}
            />

            <SellerInfoCard car={car} />

            <div className="flex items-center justify-between text-xs text-text-muted px-2">
              <span>{car.views_count} zobrazení</span>
              <span>{formatDate(car.created_at)}</span>
            </div>
          </aside>
        </div>

        <SimilarCarsSection similarCars={state.similarCars} />
      </div>
    </main>
  );
}

function CarBreadcrumb({ brand, model }: { brand: string; model: string }) {
  return (
    <nav className="mb-3">
      <ol className="flex items-center gap-2 text-sm text-text-tertiary">
        <li>
          <Link href="/" className="hover:text-text-primary transition-colors">
            Domov
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link href="/vysledky" className="hover:text-text-primary transition-colors">
            Autá
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link
            href={`/vysledky?brand=${encodeURIComponent(brand)}`}
            className="hover:text-text-primary transition-colors"
          >
            {brand}
          </Link>
        </li>
        <li>/</li>
        <li className="text-text-primary font-medium">{model}</li>
      </ol>
    </nav>
  );
}

function CarGallery({
  car,
  selectedImageIndex,
  onSelectImage,
}: {
  car: CarData;
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
}) {
  const photos = car.photos_json?.length
    ? car.photos_json
    : ["/placeholder-car-hero.jpg"];
  const safeImageIndex = Math.min(selectedImageIndex, photos.length - 1);
  const selectedPhoto = optimizeCloudflareImage(photos[safeImageIndex], {
    width: 1600,
    height: 900,
    fit: "cover",
    quality: 85,
    format: "auto",
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
      <div className="relative aspect-video rounded-2xl outer-radius overflow-hidden bg-background-secondary border border-border-subtle shadow-sm">
        <Image
          src={selectedPhoto}
          alt={`${car.brand} ${car.model}`}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
          loading="eager"
          fetchPriority="high"
          className="object-cover"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Predchádzajúca fotografia"
              onClick={() =>
                onSelectImage(safeImageIndex > 0 ? safeImageIndex - 1 : photos.length - 1)
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 hit-target rounded-full bg-background-secondary/90 border border-border-subtle flex items-center justify-center hover:bg-background-secondary transition-colors motion-interruptible"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Ďalšia fotografia"
              onClick={() =>
                onSelectImage(safeImageIndex < photos.length - 1 ? safeImageIndex + 1 : 0)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 hit-target rounded-full bg-background-secondary/90 border border-border-subtle flex items-center justify-center hover:bg-background-secondary transition-colors motion-interruptible"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 px-3 py-1 bg-background-dark/70 rounded-full border border-white/10 text-white text-xs font-medium">
          {safeImageIndex + 1} / {photos.length}
        </div>
      </div>

      {photos.length > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-1 lg:pb-0 min-h-0">
          {toUniqueKeyedStrings(photos, "thumb").map((entry, index) => (
            <button
              key={entry.key}
              type="button"
              aria-label={`Zobraziť fotografiu ${index + 1}`}
              onClick={() => onSelectImage(index)}
              className={cn(
                "relative w-20 h-14 lg:w-full lg:h-20 rounded-lg inner-radius overflow-hidden flex-shrink-0 border-2 transition-colors",
                safeImageIndex === index
                  ? "border-text-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={optimizeCloudflareImage(entry.value, {
                  width: 320,
                  height: 180,
                  fit: "cover",
                  quality: 80,
                  format: "auto",
                })}
                alt={`${car.brand} ${car.model} - fotografia ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 80px, 140px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CarHeading({
  car,
  isSaved,
  onToggleSaved,
  onShare,
  onCopyLink,
}: {
  car: CarData;
  isSaved: boolean;
  onToggleSaved: () => void;
  onShare: () => void;
  onCopyLink: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text-primary">
          {car.brand} {car.model}
        </h1>
        <p className="text-text-secondary mt-1">
          {car.year} • {car.mileage_km.toLocaleString("sk-SK")} km • {car.fuel} •{" "}
          {car.transmission}
        </p>
      </div>

      <TooltipProvider delayDuration={120}>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={isSaved ? "Odobrať z obľúbených" : "Uložiť do obľúbených"}
                onClick={onToggleSaved}
                className={cn(
                  "w-10 h-10 hit-target rounded-full border border-border-subtle bg-background-secondary/90 flex items-center justify-center transition-colors motion-interruptible",
                  isSaved
                    ? "border-error/20 bg-error/10 text-error"
                    : "hover:border-border-strong",
                )}
              >
                <HeartIcon className={cn("w-5 h-5", isSaved && "fill-current text-error")} />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {isSaved ? "Odobrať z uložených" : "Uložiť inzerát"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Zdieľať inzerát"
                onClick={onShare}
                className="w-10 h-10 hit-target rounded-full border border-border-subtle bg-background-secondary/90 flex items-center justify-center hover:border-border-strong transition-colors motion-interruptible"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>Zdieľať inzerát</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Skopírovať odkaz na inzerát"
                onClick={onCopyLink}
                className="w-10 h-10 hit-target rounded-full border border-border-subtle bg-background-secondary/90 flex items-center justify-center hover:border-border-strong transition-colors motion-interruptible"
              >
                <ExternalLinkIcon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>Skopírovať odkaz</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}

function ContactSellerCard({
  car,
  showPhone,
  showContactForm,
  contactMessage,
  isSendingMessage,
  messageSent,
  onTogglePhone,
  onToggleContactForm,
  onSubmit,
  onMessageChange,
  onMessageKeyDown,
  onMessagePaste,
  contactCaptchaToken,
  captchaInstanceKey,
  onContactCaptchaTokenChange,
}: {
  car: CarData;
  showPhone: boolean;
  showContactForm: boolean;
  contactMessage: string;
  isSendingMessage: boolean;
  messageSent: boolean;
  contactCaptchaToken: string | null;
  captchaInstanceKey: number;
  onTogglePhone: () => void;
  onToggleContactForm: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMessageChange: (value: string) => void;
  onMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onMessagePaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onContactCaptchaTokenChange: (token: string | null) => void;
}) {
  return (
    <div className="card p-6">
      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
        Cena vozidlá
      </p>
      <p className="text-3xl font-display font-semibold text-text-primary tabular-nums">
        {formatCurrency(car.price_eur)}
      </p>
      {car.is_vat_deductible && (
        <p className="mt-2 text-xs text-text-tertiary">Možný odpočet DPH</p>
      )}

      <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-3">
        <p className="text-xs leading-relaxed text-text-secondary">
          Najrýchlejšie je napísať správu. Predajca ju vidí okamžite a odpoveď príde
          priamo do vašej schránky.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onToggleContactForm}
          className="btn-primary w-full py-3.5 text-sm font-semibold"
        >
          {showContactForm ? "Skryť formulár správy" : "Napísať správu predajcovi"}
        </button>
        <button
          type="button"
          onClick={onTogglePhone}
          className="btn-secondary w-full py-3"
        >
          {showPhone ? car.seller.phone : "Zobraziť telefón"}
        </button>
      </div>

      {!showContactForm ? (
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
          Tip: kratka vecna správa zvysuje sancu na rychlu odpoveď.
        </p>
      ) : null}

      <ul className="mt-3 space-y-1 text-xs font-medium text-text-tertiary">
        <li>Odpoveď najdete v Môj účet - Správy.</li>
        <li>Anti-spam ochrana: max 3 správy na toto vozidlo za 10 minút.</li>
      </ul>

      {showContactForm && (
        <div className="mt-6 border-t border-border pt-6">
          {messageSent ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
                <CheckIcon className="h-6 w-6 text-success" />
              </div>
              <p className="mb-1 font-medium text-text-primary">Správa odoslaná</p>
              <p className="text-sm text-text-secondary">Predajca vám coskoro odpovie.</p>
              <Link
                href="/moj-ucet?tab=messages"
                className="btn-secondary mt-3 inline-flex items-center justify-center px-4 py-2 text-sm"
              >
                Otvoriť správy
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <textarea
                rows={5}
                value={contactMessage}
                onChange={(event) => onMessageChange(event.target.value)}
                onKeyDown={onMessageKeyDown}
                onPaste={onMessagePaste}
                placeholder="Mam zaujem o toto auto..."
                className="input mb-3 resize-none"
              />
              <TurnstileCaptcha
                key={`car-contact-${captchaInstanceKey}`}
                onTokenChange={onContactCaptchaTokenChange}
                action="inquiry_submit"
                className="mb-3"
              />
              <p className="mb-3 text-xs text-text-tertiary">
                Enter odošle správu, Shift+Enter vloží nový riadok.
              </p>
              <button
                type="submit"
                disabled={isSendingMessage || !contactMessage.trim() || !contactCaptchaToken}
                className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
              >
                {isSendingMessage && <SpinnerIcon className="h-4 w-4 animate-spin" />}
                {isSendingMessage ? "Odosielanie..." : "Odoslať dopyt"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
function SellerInfoCard({ car }: { car: CarData }) {
  return (
    <div className="card p-6">
      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-4">
        Predajca
      </p>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-xl border border-border-subtle">
          👤
        </div>
        <div>
          <p className="font-medium text-text-primary flex items-center gap-1.5 min-w-0">
            <span className="text-cutoff">{car.seller.name}</span>
            {car.seller.is_verified && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-success bg-success-subtle px-2 py-0.5 rounded-full"
                title="Overený predajca"
              >
                ✓
              </span>
            )}
          </p>
          <p className="text-xs text-text-tertiary">
            Člen od {new Date(car.seller.member_since).getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

function SimilarCarsSection({ similarCars }: { similarCars: SimilarCar[] }) {
  if (similarCars.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="text-2xl font-display font-semibold text-text-primary mb-6">
        Podobné vozidlá
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarCars.map((similar) => (
          <Link
            key={similar.id}
            href={buildAdPath({
              id: similar.id,
              brand: similar.brand,
              model: similar.model,
              year: similar.year,
            })}
            className="group card card-hover overflow-hidden"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-tertiary">
              <Image
                src={optimizeCloudflareImage(
                  similar.photos_json?.[0] || "/placeholder-car.jpg",
                  {
                    width: 720,
                    height: 540,
                    fit: "cover",
                    quality: 82,
                    format: "auto",
                  },
                )}
                alt={`${similar.brand} ${similar.model}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-lg font-display font-semibold text-text-primary leading-tight">
                  {similar.brand}{" "}
                  <span className="font-normal text-text-secondary">
                    {similar.model}
                  </span>
                </h3>
                <p className="text-sm text-text-tertiary mt-1">
                  {similar.year} • {similar.fuel} •{" "}
                  {similar.mileage_km.toLocaleString("sk-SK")} km
                </p>
              </div>
              <p className="text-xl font-display font-semibold text-text-primary tabular-nums">
                {formatCurrency(similar.price_eur)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CarLoadingSkeleton() {
  return (
    <main className="pt-16 sm:pt-20 pb-20 animate-pulse bg-background">
      <div className="container-main">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-12 bg-background-secondary rounded" />
          <div className="h-4 w-2 bg-background-secondary rounded" />
          <div className="h-4 w-10 bg-background-secondary rounded" />
          <div className="h-4 w-2 bg-background-secondary rounded" />
          <div className="h-4 w-28 bg-background-secondary rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
              <div className="aspect-video bg-background-secondary rounded-2xl" />
              <div className="hidden lg:flex flex-col gap-2">
                <div className="h-20 bg-background-secondary rounded-lg" />
                <div className="h-20 bg-background-secondary rounded-lg" />
                <div className="h-20 bg-background-secondary rounded-lg" />
              </div>
            </div>

            <div className="pb-6 border-b border-border">
              <div className="h-9 w-3/4 bg-background-secondary rounded mb-2" />
              <div className="h-5 w-1/2 bg-background-secondary rounded" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {LOADING_SKELETON_KEYS.map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className="bg-background-secondary rounded-lg p-3 h-16"
                />
              ))}
            </div>

            <div>
              <div className="h-6 w-36 bg-background-secondary rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-background-secondary rounded w-full" />
                <div className="h-4 bg-background-secondary rounded w-5/6" />
                <div className="h-4 bg-background-secondary rounded w-4/6" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-background-secondary rounded-lg p-6 space-y-4">
              <div className="h-4 w-20 bg-background-tertiary rounded" />
              <div className="h-9 w-2/3 bg-background-tertiary rounded" />
              <div className="h-12 bg-background-tertiary rounded" />
              <div className="h-12 bg-background-tertiary rounded" />
            </div>
            <div className="bg-background-secondary rounded-lg p-6 h-28" />
          </div>
        </div>
      </div>
    </main>
  );
}

function CarNotFoundState() {
  return (
    <main className="pt-24 pb-16 bg-background">
      <div className="container-main text-center">
        <h1 className="text-3xl font-display font-semibold text-text-primary">
          Inzerát nenájdený
        </h1>
        <p className="mt-2 text-text-secondary">
          Požadovaný inzerát už nie je dostupný.
        </p>
        <Link href="/vysledky" className="text-accent hover:underline mt-4 inline-block">
          Späť na autá
        </Link>
      </div>
    </main>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-3">
      <p className="text-[11px] text-text-tertiary uppercase tracking-[0.2em] mb-1">
        {label}
      </p>
      <p className="text-base font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function toUniqueKeyedStrings(values: string[], prefix: string) {
  const counts = new Map<string, number>();
  return values.map((value) => {
    const nextCount = (counts.get(value) || 0) + 1;
    counts.set(value, nextCount);
    return {
      value,
      key: `${prefix}-${value}-${nextCount}`,
    };
  });
}
