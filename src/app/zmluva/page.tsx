"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface ContractData {
    brand: string;
    model: string;
    year: number;
    price: number;
    vin: string;
    seller: string;
}

function ContractContent() {
    const searchParams = useSearchParams();
    const [contractData, setContractData] = useState<ContractData | null>(null);

    useEffect(() => {
        const dataParam = searchParams.get("data");
        if (dataParam) {
            try {
                const parsed = JSON.parse(decodeURIComponent(dataParam));
                setContractData(parsed);
            } catch (e) {
                console.error("Invalid contract data");
            }
        }
    }, [searchParams]);

    const handlePrint = () => {
        window.print();
    };

    const today = new Date().toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
            <div className="max-w-3xl mx-auto px-4">
                {/* Print Button - hidden when printing */}
                <div className="mb-4 flex justify-end print:hidden">
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                    >
                        🖨️ Vytlačiť zmluvu
                    </button>
                </div>

                {/* Contract Document */}
                <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            KÚPNO-PREDAJNÁ ZMLUVA
                        </h1>
                        <p className="text-gray-600">
                            uzatvorená podľa § 588 a nasl. Občianskeho zákonníka
                        </p>
                    </div>

                    <div className="space-y-8 text-gray-700">
                        {/* Seller */}
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">
                                Článok I. - Predávajúci
                            </h2>
                            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                                <p><strong>Meno a priezvisko:</strong> {contractData?.seller || "..................................."}</p>
                                <p><strong>Trvalé bydlisko:</strong> ...................................</p>
                                <p><strong>Dátum narodenia:</strong> ...................................</p>
                                <p><strong>Číslo OP:</strong> ...................................</p>
                            </div>
                        </section>

                        {/* Buyer */}
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">
                                Článok II. - Kupujúci
                            </h2>
                            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                                <p><strong>Meno a priezvisko:</strong> ...................................</p>
                                <p><strong>Trvalé bydlisko:</strong> ...................................</p>
                                <p><strong>Dátum narodenia:</strong> ...................................</p>
                                <p><strong>Číslo OP:</strong> ...................................</p>
                            </div>
                        </section>

                        {/* Vehicle */}
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">
                                Článok III. - Predmet zmluvy
                            </h2>
                            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                                <p><strong>Značka a model:</strong> {contractData ? `${contractData.brand} ${contractData.model}` : "..................................."}</p>
                                <p><strong>Rok výroby:</strong> {contractData?.year || "..................................."}</p>
                                <p><strong>VIN:</strong> {contractData?.vin || "..................................."}</p>
                                <p><strong>ŠPZ:</strong> ...................................</p>
                                <p><strong>Stav tachometra:</strong> ...........................km</p>
                                <p><strong>Farba:</strong> ...................................</p>
                            </div>
                        </section>

                        {/* Price */}
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">
                                Článok IV. - Kúpna cena
                            </h2>
                            <div className="border border-gray-200 rounded-lg p-4">
                                <p className="mb-2">
                                    Zmluvné strany sa dohodli na kúpnej cene vo výške:
                                </p>
                                <p className="text-xl font-bold text-gray-900">
                                    {contractData?.price ? `${contractData.price.toLocaleString("sk-SK")} EUR` : "............................. EUR"}
                                </p>
                                <p className="mt-2 text-sm text-gray-500">
                                    (slovom: ...................................)
                                </p>
                            </div>
                        </section>

                        {/* Declarations */}
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">
                                Článok V. - Vyhlásenia zmluvných strán
                            </h2>
                            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                                <p>1. Predávajúci vyhlasuje, že je výlučným vlastníkom vozidla a že vozidlo nie je zaťažené žiadnymi právami tretích osôb.</p>
                                <p>2. Predávajúci prehlasuje, že mu nie sú známe žiadne skryté vady vozidla.</p>
                                <p>3. Kupujúci prehlasuje, že si vozidlo prezrel a jeho stav mu je známy.</p>
                                <p>4. Kupujúci preberá vozidlo v stave, v akom sa nachádza.</p>
                            </div>
                        </section>

                        {/* Signatures */}
                        <section className="pt-8">
                            <p className="mb-8">V ............................., dňa {today}</p>

                            <div className="grid grid-cols-2 gap-8 pt-8">
                                <div className="text-center">
                                    <div className="border-t border-gray-400 pt-2">
                                        <p className="font-medium">Predávajúci</p>
                                        <p className="text-sm text-gray-500">(podpis)</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-gray-400 pt-2">
                                        <p className="font-medium">Kupujúci</p>
                                        <p className="text-sm text-gray-500">(podpis)</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                        <p>Vygenerované na Autobazar123.sk</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContractPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Načítavam zmluvu...</p>
                </div>
            </div>
        }>
            <ContractContent />
        </Suspense>
    );
}
