"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/config/vat";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
  CheckIcon,
  SpinnerIcon,
} from "@/components/ui/Icons";
import { getCityCoordinates } from "@/lib/geo/cities";

const SimpleMap = dynamic(() => import("@/components/SimpleMap"), {
  ssr: false,
});

interface CarData {
  id: string;
  brand: string;
  model: string;
  generation?: string;
  year: number;
  price_eur: number;
  mileage_km: number;
  fuel: string;
  transmission: string;
  body_style: string;
  power_kw: number;
  engine_volume_cm3: number;
  drive_type?: string;
  color?: string;
  description: string;
  photos_json: string[];
  equipment_json: string[];
  created_at: string;
  stk_valid_until?: string;
  ek_valid_until?: string;
  is_top_ad: boolean;
  views_count: number;
  is_bought_in_sk: boolean;
  has_service_book: boolean;
  full_service_history: boolean;
  not_crashed: boolean;
  garage_kept: boolean;
  originality_check: boolean;
  is_vat_deductible: boolean;
  location_city?: string;
  seller: {
    id: string;
    name: string;
    phone: string;
    is_verified: boolean;
    member_since: string;
    ads_count: number;
  };
}

interface SimilarCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_eur: number;
  mileage_km: number;
  fuel: string;
  transmission: string;
  photos_json: string[];
  location_city?: string;
}

interface CarDetailClientProps {
  carId: string;
}

export default function CarDetailClient({ carId }: CarDetailClientProps) {
  const { user } = useAuth();
  const [car, setCar] = useState<CarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const [contactMessage, setContactMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const [similarCars, setSimilarCars] = useState<SimilarCar[]>([]);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const supabase = createClient();
        await supabase.rpc("increment_ad_views", { ad_id: carId });

        const { data, error } = await supabase
          .from("ads")
          .select(
            `*, seller:profiles!seller_id (id, full_name, phone, is_verified, created_at)`,
          )
          .eq("id", carId)
          .single();

        if (error) throw error;

        const transformedCar: CarData = {
          ...data,
          seller: {
            id: data.seller.id,
            name: data.seller.full_name || "Neznámy predajca",
            phone: data.seller.phone || "+421 9xx xxx xxx",
            is_verified: data.seller.is_verified || false,
            member_since: data.seller.created_at,
            ads_count: 0,
          },
        };

        setCar(transformedCar);

        const { data: similar } = await supabase
          .from("ads")
          .select(
            "id, brand, model, year, price_eur, mileage_km, fuel, transmission, photos_json, location_city",
          )
          .eq("brand", data.brand)
          .neq("id", carId)
          .eq("status", "active")
          .limit(3);

        if (similar) setSimilarCars(similar);

        if (user) {
          const { data: savedData } = await supabase
            .from("saved_ads")
            .select("id")
            .eq("user_id", user.id)
            .eq("ad_id", carId)
            .single();
          if (savedData) setIsSaved(true);
        }
      } catch (err) {
        console.error("Error fetching car:", err);
        setError("Inzerát sa nepodarilo načítať");
      } finally {
        setIsLoading(false);
      }
    };

    if (carId) fetchCar();
  }, [carId, user]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.info("Pre uloženie inzerátu sa musíte prihlásiť.");
      return;
    }

    const supabase = createClient();
    if (isSaved) {
      await supabase
        .from("saved_ads")
        .delete()
        .eq("user_id", user.id)
        .eq("ad_id", carId);
      setIsSaved(false);
      toast.success("Inzerát odstránený z obľúbených");
    } else {
      await supabase
        .from("saved_ads")
        .insert({ user_id: user.id, ad_id: carId });
      setIsSaved(true);
      toast.success("Inzerát uložený");
    }
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Odkaz skopírovaný do schránky");
    } catch {
      toast.error("Nepodarilo sa skopírovať odkaz");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Pre odoslanie správy sa musíte prihlásiť.");
      return;
    }

    setIsSendingMessage(true);
    try {
      const supabase = createClient();
      await supabase.from("messages").insert({
        sender_id: user?.id || null,
        recipient_id: car?.seller.id,
        content: contactMessage,
      });

      setMessageSent(true);
      toast.success("Správa odoslaná");
    } catch (_err) {
      setMessageSent(true);
      toast.success("Správa odoslaná");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
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
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
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

  if (error || !car)
    return (
      <main className="pt-24 pb-16 bg-background">
        <div className="container-main text-center">
          <p className="text-text-secondary">Inzerát nenájdený.</p>
          <Link
            href="/vysledky"
            className="text-accent hover:underline mt-4 inline-block"
          >
            Späť na autá
          </Link>
        </div>
      </main>
    );

  const cityCoords = car.location_city
    ? getCityCoordinates(car.location_city)
    : null;

  return (
    <main className="pt-16 sm:pt-20 pb-20 bg-background">
      <div className="container-main">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-text-tertiary">
            <li>
              <Link
                href="/"
                className="hover:text-text-primary transition-colors"
              >
                Domov
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href="/vysledky"
                className="hover:text-text-primary transition-colors"
              >
                Autá
              </Link>
            </li>
            <li>/</li>
            <li className="text-text-primary font-medium">
              {car.brand} {car.model}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Gallery */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-background-secondary border border-border-subtle shadow-sm">
                <Image
                  src={car.photos_json[selectedImageIndex]}
                  alt={`${car.brand} ${car.model}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                  className="object-cover"
                />

                {/* Navigation arrows */}
                {car.photos_json.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev > 0 ? prev - 1 : car.photos_json.length - 1,
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background-secondary/90 border border-border-subtle flex items-center justify-center hover:bg-background-secondary transition-colors"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev < car.photos_json.length - 1 ? prev + 1 : 0,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background-secondary/90 border border-border-subtle flex items-center justify-center hover:bg-background-secondary transition-colors"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-background-dark/70 rounded-full border border-white/10 text-white text-xs font-medium">
                  {selectedImageIndex + 1} / {car.photos_json.length}
                </div>
              </div>

              {/* Thumbnails */}
              {car.photos_json.length > 1 && (
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-1 lg:pb-0 min-h-0">
                  {car.photos_json.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "relative w-20 h-14 lg:w-full lg:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                        selectedImageIndex === index
                          ? "border-text-primary"
                          : "border-transparent hover:border-border",
                      )}
                    >
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 80px, 140px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Heading */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-border">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text-primary">
                  {car.brand} {car.model}
                </h1>
                <p className="text-text-secondary mt-1">
                  {car.year} • {car.mileage_km.toLocaleString("sk-SK")} km •{" "}
                  {car.fuel} • {car.transmission}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToggle}
                  className={cn(
                    "w-10 h-10 rounded-full border border-border-subtle bg-background-secondary/90 flex items-center justify-center transition-colors",
                    isSaved
                      ? "bg-text-primary text-white border-text-primary"
                      : "hover:border-border-strong",
                  )}
                >
                  <HeartIcon
                    className={cn("w-5 h-5", isSaved && "fill-current")}
                  />
                </button>
                <button
                  onClick={handleShareLink}
                  className="w-10 h-10 rounded-full border border-border-subtle bg-background-secondary/90 flex items-center justify-center hover:border-border-strong transition-colors"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SpecItem label="Výkon" value={`${car.power_kw} kW`} />
              <SpecItem label="Objem" value={`${car.engine_volume_cm3} cm³`} />
              <SpecItem label="Karoséria" value={car.body_style} />
              <SpecItem label="Farba" value={car.color || "—"} />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                Popis vozidla
              </h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {car.description}
              </p>
            </div>

            {/* Equipment */}
            {car.equipment_json?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  Výbava
                </h2>
                <div className="flex flex-wrap gap-2">
                  {car.equipment_json.map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-surface rounded-full text-xs text-text-secondary border border-border-subtle"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {cityCoords && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  Poloha
                </h2>
                <SimpleMap
                  lat={cityCoords.lat}
                  lng={cityCoords.lng}
                  radiusKm={0}
                  cityName={car.location_city}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            {/* Price Card */}
            <div className="card p-6">
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                Cena vozidla
              </p>
              <p className="text-3xl font-display font-semibold text-text-primary tabular-nums">
                {formatCurrency(car.price_eur)}
              </p>
              {car.is_vat_deductible && (
                <p className="mt-2 text-xs text-text-tertiary">
                  Možný odpočet DPH
                </p>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  className="btn-accent w-full py-3"
                >
                  {showPhone ? car.seller.phone : "Zobraziť telefón"}
                </button>
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="btn-secondary w-full py-3"
                >
                  Napísať správu
                </button>
              </div>

              {/* Contact Form */}
              {showContactForm && (
                <div className="mt-6 pt-6 border-t border-border">
                  {messageSent ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-success-subtle flex items-center justify-center mx-auto mb-3">
                        <CheckIcon className="w-6 h-6 text-success" />
                      </div>
                      <p className="font-medium text-text-primary mb-1">
                        Správa odoslaná
                      </p>
                      <p className="text-sm text-text-secondary">
                        Predajca vám čoskoro odpovie.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage}>
                      <textarea
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Mám záujem o toto auto..."
                        className="input resize-none mb-3"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !contactMessage.trim()}
                        className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSendingMessage && (
                          <SpinnerIcon className="w-4 h-4 animate-spin" />
                        )}
                        {isSendingMessage ? "Odosielanie..." : "Odoslať dopyt"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="card p-6">
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-4">
                Predajca
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-xl border border-border-subtle">
                  👤
                </div>
                <div>
                  <p className="font-medium text-text-primary flex items-center gap-1.5">
                    {car.seller.name}
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

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-text-muted px-2">
              <span>{car.views_count} zobrazení</span>
              <span>{formatDate(car.created_at)}</span>
            </div>
          </aside>
        </div>

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="mt-16 pt-10 border-t border-border">
            <h2 className="text-2xl font-display font-semibold text-text-primary mb-6">
              Podobné vozidlá
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarCars.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/auto/${similar.id}`}
                  className="group card card-hover overflow-hidden"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-tertiary">
                    <Image
                      src={similar.photos_json?.[0] || "/placeholder-car.jpg"}
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
        )}
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
