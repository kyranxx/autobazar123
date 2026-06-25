"use client";

import {
  type ClipboardEvent,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
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
import { formatSkYear } from "@/utils/date-format";
import { buildAdPath } from "@/lib/cars/ad-path";
import { buildCarDetailBreadcrumbItems } from "@/lib/cars/detail-breadcrumbs";
import { getListingFallbackGallery } from "@/lib/cars/fallback-images";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { startViewTransition } from "@/utils/view-transitions";
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
import { Modal } from "@/components/ui/shadcn/modal";

const SimpleMap = dynamic(() => import("@/components/SimpleMap"), {
  ssr: false,
});

interface CarDetailClientProps {
  carId: string;
  initialCar: CarData | null;
  initialSimilarCars: SimilarCar[];
  enableViewTransitions: boolean;
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

type ReportCategory =
  | "fraud"
  | "duplicate"
  | "incorrect_info"
  | "prohibited"
  | "abuse"
  | "other";

interface CarDetailInteractionState {
  contactCaptchaKey: number;
  contactCaptchaToken: string | null;
  isReportModalOpen: boolean;
  isReporting: boolean;
  reportCaptchaKey: number;
  reportCaptchaToken: string | null;
  reportCategory: ReportCategory;
  reportDetails: string;
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

function useIncrementAdViews(carId: string, initialCar: CarData | null) {
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
}

function useSavedAdState(
  carId: string,
  userId: string | undefined,
  dispatch: Dispatch<CarDetailAction>,
) {
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
  }, [carId, userId, dispatch]);
}

function useListingViewTracking(car: CarData | null) {
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (!car?.id || hasTrackedViewRef.current) {
      return;
    }

    trackAnalyticsEvent("listing_viewed", {
      adId: car.id,
      source: "direct",
    });
    hasTrackedViewRef.current = true;
  }, [car]);
}

function useCarDetailShareActions(car: CarData | null) {
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

  return { handleCopyLink, handleShareLink };
}

export default function CarDetailClient({
  carId,
  initialCar,
  initialSimilarCars,
  enableViewTransitions,
}: CarDetailClientProps) {
  const { user } = useAuthOptional();
  const [state, dispatch] = useReducer(
    carDetailReducer,
    createInitialState(initialCar, initialSimilarCars),
  );
  const [interactionState, setInteractionState] = useState<CarDetailInteractionState>({
    contactCaptchaKey: 0,
    contactCaptchaToken: null,
    isReportModalOpen: false,
    isReporting: false,
    reportCaptchaKey: 0,
    reportCaptchaToken: null,
    reportCategory: "fraud",
    reportDetails: "",
  });
  const {
    contactCaptchaKey,
    contactCaptchaToken,
    isReportModalOpen,
    isReporting,
    reportCaptchaKey,
    reportCaptchaToken,
    reportCategory,
    reportDetails,
  } = interactionState;
  const setContactCaptchaToken = useCallback((contactCaptchaToken: string | null) => {
    setInteractionState((current) =>
      current.contactCaptchaToken === contactCaptchaToken
        ? current
        : { ...current, contactCaptchaToken },
    );
  }, []);
  const setReportCaptchaToken = useCallback((reportCaptchaToken: string | null) => {
    setInteractionState((current) =>
      current.reportCaptchaToken === reportCaptchaToken
        ? current
        : { ...current, reportCaptchaToken },
    );
  }, []);
  const userId = user?.id;
  useIncrementAdViews(carId, initialCar);
  useSavedAdState(carId, userId, dispatch);
  useListingViewTracking(state.car);

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
  const { handleCopyLink, handleShareLink } = useCarDetailShareActions(car);

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
        | { error?: string; inquiryId?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Nepodarilo sa odoslať dopyt.");
        dispatch({ type: "send_message_finished", messageSent: false });
        return;
      }

      if (payload?.inquiryId) {
        trackAnalyticsEvent("lead_submitted", {
          leadId: payload.inquiryId,
          adId: car.id,
          channel: "message",
        });
      }

      toast.success("Správa odoslaná");
      setInteractionState((current) => ({
        ...current,
        contactCaptchaKey: current.contactCaptchaKey + 1,
        contactCaptchaToken: null,
      }));
      dispatch({ type: "send_message_finished", messageSent: true });
    } catch {
      toast.error("Nepodarilo sa odoslať dopyt");
      dispatch({ type: "send_message_finished", messageSent: false });
    }
  };

  const submitReport = async () => {
    if (!car?.id) {
      return;
    }

    if (!reportCaptchaToken) {
      toast.error("Pred odoslaním hlásenia potvrďte captcha.");
      return;
    }

    setInteractionState((current) => ({ ...current, isReporting: true }));

    try {
      const response = await fetch("/api/listing-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId: car.id,
          category: reportCategory,
          details: reportDetails,
          captchaToken: reportCaptchaToken,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; duplicate?: boolean }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Hlásenie sa nepodarilo odoslať.");
        return;
      }

      toast.success(
        payload?.duplicate
          ? "Otvorené hlásenie pre tento inzerát už existuje."
          : "Hlásenie bolo odoslané na kontrolu.",
      );
      setInteractionState((current) => ({
        ...current,
        isReportModalOpen: false,
        reportCaptchaKey: current.reportCaptchaKey + 1,
        reportCaptchaToken: null,
        reportCategory: "fraud",
        reportDetails: "",
      }));
    } catch {
      toast.error("Hlásenie sa nepodarilo odoslať.");
    } finally {
      setInteractionState((current) => ({ ...current, isReporting: false }));
    }
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleTogglePhone = () => {
    if (!state.car) {
      return;
    }

    if (!state.showPhone) {
      trackAnalyticsEvent("seller_contact_started", {
        adId: state.car.id,
        channel: "phone",
      });
    }

    dispatch({ type: "toggle_phone" });
  };

  const handleToggleContactForm = () => {
    if (!state.car) {
      return;
    }

    if (!state.showContactForm) {
      trackAnalyticsEvent("seller_contact_started", {
        adId: state.car.id,
        channel: "message",
      });
    }

    dispatch({
      type: "toggle_contact_form",
      defaultMessage: defaultContactMessage,
    });
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
    <CarDetailView
      car={car}
      state={state}
      dispatch={dispatch}
      userId={user?.id}
      enableViewTransitions={enableViewTransitions}
      cityCoords={cityCoords}
      contactCaptchaKey={contactCaptchaKey}
      contactCaptchaToken={contactCaptchaToken}
      setContactCaptchaToken={setContactCaptchaToken}
      isReportModalOpen={isReportModalOpen}
      isReporting={isReporting}
      reportCaptchaKey={reportCaptchaKey}
      reportCaptchaToken={reportCaptchaToken}
      reportCategory={reportCategory}
      reportDetails={reportDetails}
      setInteractionState={setInteractionState}
      handleSaveToggle={handleSaveToggle}
      handleShareLink={handleShareLink}
      handleCopyLink={handleCopyLink}
      handleTogglePhone={handleTogglePhone}
      handleToggleContactForm={handleToggleContactForm}
      handleSendMessage={handleSendMessage}
      handleMessageKeyDown={handleMessageKeyDown}
      handleMessagePaste={handleMessagePaste}
      submitReport={submitReport}
      setReportCaptchaToken={setReportCaptchaToken}
    />
  );
}

function CarDetailView({
  car,
  state,
  dispatch,
  userId,
  enableViewTransitions,
  cityCoords,
  contactCaptchaKey,
  contactCaptchaToken,
  setContactCaptchaToken,
  isReportModalOpen,
  isReporting,
  reportCaptchaKey,
  reportCaptchaToken,
  reportCategory,
  reportDetails,
  setInteractionState,
  handleSaveToggle,
  handleShareLink,
  handleCopyLink,
  handleTogglePhone,
  handleToggleContactForm,
  handleSendMessage,
  handleMessageKeyDown,
  handleMessagePaste,
  submitReport,
  setReportCaptchaToken,
}: {
  car: CarData;
  state: CarDetailState;
  dispatch: Dispatch<CarDetailAction>;
  userId?: string;
  enableViewTransitions: boolean;
  cityCoords: { lat: number; lng: number } | null;
  contactCaptchaKey: number;
  contactCaptchaToken: string | null;
  setContactCaptchaToken: (token: string | null) => void;
  isReportModalOpen: boolean;
  isReporting: boolean;
  reportCaptchaKey: number;
  reportCaptchaToken: string | null;
  reportCategory: ReportCategory;
  reportDetails: string;
  setInteractionState: Dispatch<SetStateAction<CarDetailInteractionState>>;
  handleSaveToggle: () => Promise<void>;
  handleShareLink: () => Promise<void>;
  handleCopyLink: () => Promise<void>;
  handleTogglePhone: () => void;
  handleToggleContactForm: () => void;
  handleSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  handleMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleMessagePaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  submitReport: () => Promise<void>;
  setReportCaptchaToken: (token: string | null) => void;
}) {
  return (
    <main className="market-page pb-16 pt-4 sm:pt-6">
      <div className="container-main">
        <CarBreadcrumb car={car} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="space-y-5 lg:col-span-1 sm:space-y-6">
            <CarGallery
              car={car}
              selectedImageIndex={state.selectedImageIndex}
              enableViewTransitions={enableViewTransitions}
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SpecItem label="Výkon" value={`${car.power_kw} kW`} />
              <SpecItem label="Objem" value={`${car.engine_volume_cm3} cm3`} />
              <SpecItem label="Karoséria" value={car.body_style} />
              <SpecItem label="Farba" value={car.color || "-"} />
            </div>

            <section className="market-panel p-5 sm:p-6">
              <h2 className="mb-2 text-lg font-semibold text-text-primary">
                Popis vozidla
              </h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {car.description}
              </p>
            </section>

            {car.equipment_json?.length > 0 && (
              <section className="market-panel p-5 sm:p-6">
                <h2 className="mb-2 text-lg font-semibold text-text-primary">
                  Výbava
                </h2>
                <div className="flex flex-wrap gap-2">
                  {toUniqueKeyedStrings(car.equipment_json, "equipment").map((entry) => (
                    <span
                      key={entry.key}
                      className="market-chip"
                    >
                      {entry.value}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {cityCoords && (
              <section className="market-panel p-5 sm:p-6">
                <h2 className="mb-2 text-lg font-semibold text-text-primary">
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

          <aside className="space-y-3 lg:sticky lg:top-24">
            <ContactSellerCard
              car={car}
              status={{
                canReport: userId !== car.seller.id,
                isSendingMessage: state.isSendingMessage,
                messageSent: state.messageSent,
                showContactForm: state.showContactForm,
                showPhone: state.showPhone,
              }}
              contactMessage={state.contactMessage}
              onTogglePhone={handleTogglePhone}
              onToggleContactForm={handleToggleContactForm}
              onSubmit={handleSendMessage}
              onMessageChange={(value) =>
                dispatch({ type: "set_contact_message", contactMessage: value })
              }
              onMessageKeyDown={handleMessageKeyDown}
              onMessagePaste={handleMessagePaste}
              contactCaptchaToken={contactCaptchaToken}
              captchaInstanceKey={contactCaptchaKey}
              onContactCaptchaTokenChange={setContactCaptchaToken}
              onOpenReport={() =>
                setInteractionState((current) => ({
                  ...current,
                  isReportModalOpen: true,
                }))
              }
            />

            <SellerInfoCard car={car} />

            <div className="flex items-center justify-between px-2 text-xs text-text-muted">
              <span>{car.views_count} zobrazení</span>
              <span>{formatDate(car.created_at)}</span>
            </div>
          </aside>
        </div>

        <SimilarCarsSection similarCars={state.similarCars} />
        <ReportListingModal
          open={isReportModalOpen}
          category={reportCategory}
          details={reportDetails}
          isPending={isReporting}
          captchaInstanceKey={reportCaptchaKey}
          captchaToken={reportCaptchaToken}
          onCategoryChange={(reportCategory) =>
            setInteractionState((current) => ({ ...current, reportCategory }))
          }
          onDetailsChange={(reportDetails) =>
            setInteractionState((current) => ({ ...current, reportDetails }))
          }
          onClose={() =>
            setInteractionState((current) => ({
              ...current,
              isReportModalOpen: false,
            }))
          }
          onSubmit={() => {
            void submitReport();
          }}
          onCaptchaTokenChange={setReportCaptchaToken}
        />
      </div>
    </main>
  );
}

function CarBreadcrumb({ car }: { car: CarData }) {
  const items = buildCarDetailBreadcrumbItems(car);

  return (
    <nav aria-label="Navigácia v omrvinkách" className="mb-3">
      <ol className="flex min-w-0 items-center gap-2.5 overflow-x-auto pb-1 text-sm text-text-tertiary no-scrollbar">
        <li className="shrink-0 text-text-muted">Ste tu:</li>
        {items.map((item, index) => (
          <li
            key={item.href ?? item.label}
            className="flex min-w-0 shrink-0 items-center gap-2.5"
          >
            {index > 0 ? (
              <ChevronRightIcon
                aria-hidden="true"
                className="size-3 shrink-0 text-text-muted"
              />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="whitespace-nowrap transition-colors hover:text-text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="max-w-[70vw] truncate font-medium text-text-primary sm:max-w-none"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function CarGallery({
  car,
  selectedImageIndex,
  enableViewTransitions,
  onSelectImage,
}: {
  car: CarData;
  selectedImageIndex: number;
  enableViewTransitions: boolean;
  onSelectImage: (index: number) => void;
}) {
  const photos = car.photos_json?.length
    ? car.photos_json
    : getListingFallbackGallery(car.id);
  const safeImageIndex = Math.min(selectedImageIndex, photos.length - 1);
  const selectedPhoto = optimizeCloudflareImage(photos[safeImageIndex], {
    width: 1600,
    height: 900,
    fit: "cover",
    quality: 85,
    format: "auto",
  });
  const selectImage = (index: number) => {
    if (index === safeImageIndex) {
      return;
    }

    startViewTransition(
      () => {
        onSelectImage(index);
      },
      { enabled: enableViewTransitions },
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
      <div className="view-transition-gallery-image market-panel relative aspect-video overflow-hidden bg-background-secondary">
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
                selectImage(
                  safeImageIndex > 0 ? safeImageIndex - 1 : photos.length - 1,
                )
              }
              className="market-icon-button absolute left-4 top-1/2 size-11 -translate-y-1/2 rounded-xl bg-background-secondary/90 motion-interruptible"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Ďalšia fotografia"
              onClick={() =>
                selectImage(
                  safeImageIndex < photos.length - 1 ? safeImageIndex + 1 : 0,
                )
              }
              className="market-icon-button absolute right-4 top-1/2 size-11 -translate-y-1/2 rounded-xl bg-background-secondary/90 motion-interruptible"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 rounded-md border border-white/10 bg-background-dark/70 px-3 py-1 text-xs font-medium text-white">
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
              onClick={() => selectImage(index)}
              className={cn(
                "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors lg:h-20 lg:w-full",
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
    <div className="market-panel flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
      <div>
        <p className="market-kicker">Detail vozidla</p>
        <h1 className="mt-1 text-3xl font-display font-semibold text-text-primary sm:text-4xl">
          {car.brand} {car.model}
        </h1>
        <p className="mt-2 text-text-secondary">
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
                  "market-icon-button size-11 rounded-xl bg-background-secondary/90 motion-interruptible",
                  isSaved
                    ? "border-error/20 bg-error/10 text-error"
                    : "hover:border-border-strong",
                )}
              >
                <HeartIcon className={cn("size-5", isSaved && "fill-current text-error")} />
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
                className="market-icon-button size-11 rounded-xl bg-background-secondary/90 motion-interruptible"
              >
                <ShareIcon className="size-5" />
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
                className="market-icon-button size-11 rounded-xl bg-background-secondary/90 motion-interruptible"
              >
                <ExternalLinkIcon className="size-5" />
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
  status,
  contactMessage,
  onTogglePhone,
  onToggleContactForm,
  onSubmit,
  onMessageChange,
  onMessageKeyDown,
  onMessagePaste,
  contactCaptchaToken,
  captchaInstanceKey,
  onContactCaptchaTokenChange,
  onOpenReport,
}: {
  car: CarData;
  status: {
    canReport: boolean;
    isSendingMessage: boolean;
    messageSent: boolean;
    showContactForm: boolean;
    showPhone: boolean;
  };
  contactMessage: string;
  contactCaptchaToken: string | null;
  captchaInstanceKey: number;
  onTogglePhone: () => void;
  onToggleContactForm: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMessageChange: (value: string) => void;
  onMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onMessagePaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  onContactCaptchaTokenChange: (token: string | null) => void;
  onOpenReport: () => void;
}) {
  const {
    canReport,
    isSendingMessage,
    messageSent,
    showContactForm,
    showPhone,
  } = status;
  return (
    <div className="market-panel p-5">
      <p className="market-kicker mb-2">
        Cena vozidla
      </p>
      <p className="text-3xl font-display font-semibold text-text-primary tabular-nums">
        {formatCurrency(car.price_eur)}
      </p>
      {car.is_vat_deductible && (
        <p className="mt-2 text-xs text-text-tertiary">Možný odpočet DPH</p>
      )}

      <div className="mt-3 rounded-xl border border-primary/12 bg-primary/5 p-3">
        <p className="text-xs leading-relaxed text-text-secondary">
          Najrýchlejšie je napísať správu. Predajca ju vidí okamžite a odpoveď príde
          priamo do vašej schránky.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={onToggleContactForm}
          className="market-action-primary w-full py-3.5 text-sm font-semibold"
        >
          {showContactForm ? "Skryť formulár správy" : "Napísať správu predajcovi"}
        </button>
        <button
          type="button"
          onClick={onTogglePhone}
          className="market-action-secondary w-full py-3"
        >
          {showPhone ? (car.seller.phone || "Telefón nie je uvedený") : "Zobraziť telefón"}
        </button>
        {canReport ? (
          <button
            type="button"
            onClick={onOpenReport}
            className="market-action-secondary w-full py-3"
          >
            Nahlásiť inzerát
          </button>
        ) : null}
      </div>

      {!showContactForm ? (
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
          Tip: krátka vecná správa zvyšuje šancu na rýchlu odpoveď.
        </p>
      ) : null}

      <ul className="mt-3 space-y-1 text-xs font-medium text-text-tertiary">
        <li>Odpoveď nájdete v Môj účet - Správy.</li>
        <li>Anti-spam ochrana: max 3 správy na toto vozidlo za 10 minút.</li>
      </ul>

      {showContactForm && (
        <div className="mt-6 border-t border-border pt-6">
          {messageSent ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success-subtle">
                <CheckIcon className="size-6 text-success" />
              </div>
              <p className="mb-1 font-medium text-text-primary">Správa odoslaná</p>
              <p className="text-sm text-text-secondary">Predajca vám čoskoro odpovie.</p>
              <Link
                href="/moj-ucet?tab=messages"
                className="market-action-secondary mt-3 inline-flex items-center justify-center px-4 py-2 text-sm"
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
                placeholder="Mám záujem o toto auto..."
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
                className="market-action-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
              >
                {isSendingMessage && <SpinnerIcon className="size-4 animate-spin" />}
                {isSendingMessage ? "Odosielanie..." : "Odoslať dopyt"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function ReportListingModal({
  open,
  category,
  details,
  isPending,
  captchaInstanceKey,
  captchaToken,
  onCategoryChange,
  onDetailsChange,
  onClose,
  onSubmit,
  onCaptchaTokenChange,
}: {
  open: boolean;
  category: "fraud" | "duplicate" | "incorrect_info" | "prohibited" | "abuse" | "other";
  details: string;
  isPending: boolean;
  captchaInstanceKey: number;
  captchaToken: string | null;
  onCategoryChange: (
    value: "fraud" | "duplicate" | "incorrect_info" | "prohibited" | "abuse" | "other",
  ) => void;
  onDetailsChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onCaptchaTokenChange: (token: string | null) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nahlásiť inzerát"
      description="Hlásenie pošleme na kontrolu moderácii."
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="report-category" className="mb-1 block text-sm font-medium text-primary">
            Dôvod
          </label>
          <select
            id="report-category"
            value={category}
            onChange={(event) =>
              onCategoryChange(
                event.target.value as
                  | "fraud"
                  | "duplicate"
                  | "incorrect_info"
                  | "prohibited"
                  | "abuse"
                  | "other",
              )
            }
            className="input"
          >
            <option value="fraud">Podvod / scam</option>
            <option value="duplicate">Duplicitný inzerát</option>
            <option value="incorrect_info">Nesprávne údaje</option>
            <option value="prohibited">Zakázaný obsah</option>
            <option value="abuse">Zneužitie</option>
            <option value="other">Iné</option>
          </select>
        </div>

        <div>
          <label htmlFor="report-details" className="mb-1 block text-sm font-medium text-primary">
            Popis problému
          </label>
          <textarea
            id="report-details"
            rows={5}
            value={details}
            onChange={(event) => onDetailsChange(event.target.value)}
            placeholder="Napíšte, čo je na inzeráte podozrivé alebo nesprávne."
            className="input resize-none"
          />
        </div>

        <TurnstileCaptcha
          key={`report-listing-${captchaInstanceKey}`}
          onTokenChange={onCaptchaTokenChange}
          action="listing_report_submit"
        />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">
            Zrušiť
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || details.trim().length < 10 || !captchaToken}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            {isPending ? "Odosielanie..." : "Odoslať hlásenie"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
function SellerInfoCard({ car }: { car: CarData }) {
  const sellerInitial = car.seller.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="market-panel p-5">
      <p className="market-kicker mb-4">
        Predajca
      </p>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-12 items-center justify-center rounded-xl border border-primary/12 bg-primary/5 text-lg font-bold text-primary">
          {sellerInitial}
        </div>
        <div>
          <p className="font-medium text-text-primary flex items-center gap-1.5 min-w-0">
            <span className="text-cutoff">{car.seller.name}</span>
            {car.seller.is_verified && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-success-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-success"
                title="Overený predajca"
              >
                ✓
              </span>
            )}
          </p>
          <p className="text-xs text-text-tertiary">
            Člen od {formatSkYear(car.seller.member_since)}
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
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="text-2xl font-display font-semibold text-text-primary mb-6">
        Podobné vozidlá
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarCars.map((similar, index) => {
          const isPriorityImage = index < 3;

          return (
            <Link
              key={similar.id}
              href={buildAdPath({
                id: similar.id,
                brand: similar.brand,
                model: similar.model,
                year: similar.year,
              })}
              className="group market-card overflow-hidden"
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
                  priority={isPriorityImage}
                  loading={isPriorityImage ? "eager" : "lazy"}
                  fetchPriority={isPriorityImage ? "high" : "auto"}
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
          );
        })}
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
    <div className="market-card bg-white p-3">
      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
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
