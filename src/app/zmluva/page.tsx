"use client";

import { useMemo } from "react";

interface ContractData {
  brand: string;
  model: string;
  year: number;
  price: number;
  vin: string;
  seller: string;
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
  const contractData = useMemo(() => parseContractDataFromLocation(), []);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString("sk-SK", {
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
            Vytlacit zmluvu
          </button>
        </div>

        {/* Contract Document */}
        <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              KÚPNO-PREDAJNÁ ZMLUVA
            </h1>
            <p className="text-text-secondary">
              uzatvorená podľa § 588 a nasl. Občianskeho zákonníka
            </p>
          </div>

          <div className="space-y-8 text-text-secondary">
            {/* Seller */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                Článok I. - Predávajúci
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <p>
                  <strong>Meno a priezvisko:</strong>{" "}
                  {contractData?.seller ||
                    "..................................."}
                </p>
                <p>
                  <strong>Trvalé bydlisko:</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>Dátum narodenia:</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>Číslo OP:</strong> ...................................
                </p>
              </div>
            </section>

            {/* Buyer */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                Článok II. - Kupujúci
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <p>
                  <strong>Meno a priezvisko:</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>Trvalé bydlisko:</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>Dátum narodenia:</strong>{" "}
                  ...................................
                </p>
                <p>
                  <strong>Číslo OP:</strong> ...................................
                </p>
              </div>
            </section>

            {/* Vehicle */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                Článok III. - Predmet zmluvy
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <p>
                  <strong>Značka a model:</strong>{" "}
                  {contractData
                    ? `${contractData.brand} ${contractData.model}`
                    : "..................................."}
                </p>
                <p>
                  <strong>Rok výroby:</strong>{" "}
                  {contractData?.year || "..................................."}
                </p>
                <p>
                  <strong>VIN:</strong>{" "}
                  {contractData?.vin || "..................................."}
                </p>
                <p>
                  <strong>ŠPZ:</strong> ...................................
                </p>
                <p>
                  <strong>Stav tachometra:</strong>{" "}
                  ...........................km
                </p>
                <p>
                  <strong>Farba:</strong> ...................................
                </p>
              </div>
            </section>

            {/* Price */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                Článok IV. - Kúpna cena
              </h2>
              <div className="border border-border rounded-lg p-4">
                <p className="mb-2">
                  Zmluvné strany sa dohodli na kúpnej cene vo výške:
                </p>
                <p className="text-xl font-bold text-text-primary">
                  {contractData?.price
                    ? `${contractData.price.toLocaleString("sk-SK")} EUR`
                    : "............................. EUR"}
                </p>
                <p className="mt-2 text-sm text-text-tertiary">
                  (slovom: ...................................)
                </p>
              </div>
            </section>

            {/* Declarations */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-primary">
                Článok V. - Vyhlásenia zmluvných strán
              </h2>
              <div className="border border-border rounded-lg p-4 space-y-3">
                <p>
                  1. Predávajúci vyhlasuje, že je výlučným vlastníkom vozidla a
                  že vozidlo nie je zaťažené žiadnymi právami tretích osôb.
                </p>
                <p>
                  2. Predávajúci prehlasuje, že mu nie sú známe žiadne skryté
                  vady vozidla.
                </p>
                <p>
                  3. Kupujúci prehlasuje, že si vozidlo prezrel a jeho stav mu
                  je známy.
                </p>
                <p>4. Kupujúci preberá vozidlo v stave, v akom sa nachádza.</p>
              </div>
            </section>

            {/* Signatures */}
            <section className="pt-8">
              <p className="mb-8">
                V ............................., dňa {today}
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="text-center">
                  <div className="border-t border-border-strong pt-2">
                    <p className="font-medium">Predávajúci</p>
                    <p className="text-sm text-text-tertiary">(podpis)</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-border-strong pt-2">
                    <p className="font-medium">Kupujúci</p>
                    <p className="text-sm text-text-tertiary">(podpis)</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-border text-center text-xs text-text-muted">
            <p>Vygenerované na Autobazar123.sk</p>
          </div>
        </div>
      </div>
    </main>
  );
}


