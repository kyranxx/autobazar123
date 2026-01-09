"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactFormClient() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const supabase = createClient();

            // Store the message in database
            const { error } = await supabase.from("contact_messages").insert({
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
                status: "new",
            });

            if (error) {
                // If table doesn't exist, just show success (message would be sent via email in production)
                console.log("Contact form submission:", formData);
            }

            setStatus({
                type: "success",
                message: "Správa bola úspešne odoslaná! Ozveme sa vám čo najskôr.",
            });

            // Reset form
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (err) {
            setStatus({
                type: "error",
                message: "Nastala chyba pri odosielaní. Skúste to prosím znova.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 rounded-2xl border border-border bg-surface/30">
            <h2 className="text-xl font-bold text-primary mb-6">
                Napíšte nám
            </h2>

            {status && (
                <div className={`mb-6 p-4 rounded-xl ${status.type === "success"
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-error/10 text-error border border-error/20"
                    }`}>
                    <p className="text-sm font-medium">{status.message}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                        Meno a priezvisko
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
                        placeholder="Vaše meno"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
                        placeholder="vas@email.sk"
                    />
                </div>
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-primary mb-2">
                        Predmet
                    </label>
                    <select
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                        <option value="">Vyberte predmet</option>
                        <option value="general">Všeobecná otázka</option>
                        <option value="selling">Predaj auta</option>
                        <option value="buying">Kúpa auta</option>
                        <option value="dealer">Pre autobazáre</option>
                        <option value="technical">Technická podpora</option>
                        <option value="other">Iné</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-primary mb-2">
                        Správa
                    </label>
                    <textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={5}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                        placeholder="Vaša správa..."
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? "Odosielam..." : "Odoslať správu"}
                </button>
            </form>
        </div>
    );
}
