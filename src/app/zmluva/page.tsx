"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import type { MarketCode } from "@/config/markets";

interface ContractData {
  brand: string;
  model: string;
  year: number;
  price: number;
  vin: string;
  seller: string;
}

const CONTRACT_COPY: Record<
  MarketCode,
  {
    localeTag: "sk-SK" | "ro-RO";
    print: string;
    title: string;
    subtitle: string;
    sellerTitle: string;
    buyerTitle: string;
    vehicleTitle: string;
    priceTitle: string;
    declarationsTitle: string;
    fullName: string;
    address: string;
    birthDate: string;
    idCard: string;
    brandModel: string;
    productionYear: string;
    licensePlate: string;
    mileage: string;
    color: string;
    agreedPrice: string;
    priceInWords: string;
    declarations: string[];
    placeAndDate: (date: string) => string;
    sellerSignature: string;
    buyerSignature: string;
    signature: string;
    footer: string;
  }
> = {
  SK: {
    localeTag: "sk-SK",
    print: "Vytlačiť zmluvu",
    title: "KÚPNO-PREDAJNÁ ZMLUVA",
    subtitle: "uzatvorená podľa § 588 a nasl. Občianskeho zákonníka",
    sellerTitle: "Článok I. - Predávajúci",
    buyerTitle: "Článok II. - Kupujúci",
    vehicleTitle: "Článok III. - Predmet zmluvy",
    priceTitle: "Článok IV. - Kúpna cena",
    declarationsTitle: "Článok V. - Vyhlásenia zmluvných strán",
    fullName: "Meno a priezvisko:",
    address: "Trvalé bydlisko:",
    birthDate: "Dátum narodenia:",
    idCard: "Číslo OP:",
    brandModel: "Značka a model:",
    productionYear: "Rok výroby:",
    licensePlate: "ŠPZ:",
    mileage: "Stav tachometra:",
    color: "Farba:",
    agreedPrice: "Zmluvné strany sa dohodli na kúpnej cene vo výške:",
    priceInWords: "(slovom: ...................................)",
    declarations: [
      "Predávajúci vyhlasuje, že je výlučným vlastníkom vozidla a že vozidlo nie je zaťažené žiadnymi právami tretích osôb.",
      "Predávajúci prehlasuje, že mu nie sú známe žiadne skryté vady vozidla.",
      "Kupujúci prehlasuje, že si vozidlo prezrel a jeho stav mu je známy.",
      "Kupujúci preberá vozidlo v stave, v akom sa nachádza.",
    ],
    placeAndDate: (date) => `V ............................., dňa ${date}`,
    sellerSignature: "Predávajúci",
    buyerSignature: "Kupujúci",
    signature: "(podpis)",
    footer: "Vygenerované na Autobazar123.sk",
  },
  RO: {
    localeTag: "ro-RO",
    print: "Tipărește contractul",
    title: "CONTRACT DE VÂNZARE-CUMPĂRARE",
    subtitle: "încheiat conform prevederilor Codului civil",
    sellerTitle: "Articolul I. - Vânzătorul",
    buyerTitle: "Articolul II. - Cumpărătorul",
    vehicleTitle: "Articolul III. - Obiectul contractului",
    priceTitle: "Articolul IV. - Prețul de vânzare",
    declarationsTitle: "Articolul V. - Declarațiile părților",
    fullName: "Nume și prenume:",
    address: "Domiciliu:",
    birthDate: "Data nașterii:",
    idCard: "Seria și numărul actului de identitate:",
    brandModel: "Marcă și model:",
    productionYear: "An fabricație:",
    licensePlate: "Număr de înmatriculare:",
    mileage: "Kilometraj:",
    color: "Culoare:",
    agreedPrice:
      "Părțile au convenit asupra prețului de vânzare în valoare de:",
    priceInWords: "(în litere: ...................................)",
    declarations: [
      "Vânzătorul declară că este proprietarul exclusiv al vehiculului și că vehiculul nu este grevat de drepturi ale terților.",
      "Vânzătorul declară că nu cunoaște defecte ascunse ale vehiculului.",
      "Cumpărătorul declară că a verificat vehiculul și cunoaște starea acestuia.",
      "Cumpărătorul preia vehiculul în starea în care se află.",
    ],
    placeAndDate: (date) => `În ............................., la data de ${date}`,
    sellerSignature: "Vânzător",
    buyerSignature: "Cumpărător",
    signature: "(semnătură)",
    footer: "Generat pe AutoNinja.ro",
  },
};

function getContractCopy(locale: string) {
  return CONTRACT_COPY[locale.toLowerCase().startsWith("ro") ? "RO" : "SK"];
}

function parseContractDataFromLocation(): ContractData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const dataParam = new URLSearchParams(window.location.search).get("data");
  if (!dataParam) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(dataParam)) as ContractData;
  } catch {
    console.error("Invalid contract data");
    return null;
  }
}

export default function ContractPage() {
  const locale = useLocale();
  const copy = getContractCopy(locale);
  const contractData = useMemo(() => parseContractDataFromLocation(), []);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString(copy.localeTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-background-muted py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4">
        {/* Print Button - hidden when printing */}
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
          >
            {copy.print}
          </button>
        </div>

        {/* Contract Document */}
        <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              {copy.title}
            </h1>
            <p className="text-text-secondary">{copy.subtitle}</p>
          </div>

          <div className="space-y-8 text-text-secondary">
            {/* Seller */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                {copy.sellerTitle}
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <p>
                  <strong>{copy.fullName}</strong>{" "}
                  {contractData?.seller ||
                    "..................................."}
                </p>
                <p>
                  <strong>{copy.address}</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>{copy.birthDate}</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>{copy.idCard}</strong> ...................................
                </p>
              </div>
            </section>

            {/* Buyer */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                {copy.buyerTitle}
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <p>
                  <strong>{copy.fullName}</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>{copy.address}</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>{copy.birthDate}</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>{copy.idCard}</strong> ...................................
                </p>
              </div>
            </section>

            {/* Vehicle */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                {copy.vehicleTitle}
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <p>
                  <strong>{copy.brandModel}</strong>{" "}
                  {contractData
                    ? `${contractData.brand} ${contractData.model}`
                    : "..................................."}
                </p>
                <p>
                  <strong>{copy.productionYear}</strong>{" "}
                  {contractData?.year || "..................................."}
                </p>
                <p>
                  <strong>VIN:</strong>{" "}
                  {contractData?.vin || "..................................."}
                </p>
                <p>
                  <strong>{copy.licensePlate}</strong> ...................................
                </p>
                <p>
                  <strong>{copy.mileage}</strong>{" "}
                  ...........................km
                </p>
                <p>
                  <strong>{copy.color}</strong> ...................................
                </p>
              </div>
            </section>

            {/* Price */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                {copy.priceTitle}
              </h2>
              <div className="border border-border rounded-lg p-4">
                <p className="mb-2">
                  {copy.agreedPrice}
                </p>
                <p className="text-xl font-bold text-text-primary">
                  {contractData?.price
                    ? `${contractData.price.toLocaleString(copy.localeTag)} EUR`
                    : "............................. EUR"}
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
                  {copy.priceInWords}
                </p>
              </div>
            </section>

            {/* Declarations */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                {copy.declarationsTitle}
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-3">
                {copy.declarations.map((declaration, index) => (
                  <p key={declaration}>
                    {index + 1}. {declaration}
                  </p>
                ))}
              </div>
            </section>

            {/* Signatures */}
            <section className="pt-8">
              <p className="mb-8">
                {copy.placeAndDate(today)}
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="text-center">
                  <div className="border-t border-border-strong pt-2">
                    <p className="font-medium">{copy.sellerSignature}</p>
                    <p className="text-sm text-text-tertiary">{copy.signature}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-border-strong pt-2">
                    <p className="font-medium">{copy.buyerSignature}</p>
                    <p className="text-sm text-text-tertiary">{copy.signature}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-border text-center text-xs text-text-muted">
            <p>{copy.footer}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
