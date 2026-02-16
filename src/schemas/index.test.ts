import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  AdSearchFiltersSchema,
  CreditSpendSchema,
  DealerRegistrationSchema,
  InquiryCreateSchema,
  PhoneSchema,
  RegisterSchema,
  safeParse,
  formatZodErrors,
  AdLocationSchema,
} from "./index";

describe("PhoneSchema", () => {
  it("accepts valid +421 format", () => {
    expect(PhoneSchema.safeParse("+421912345678").success).toBe(true);
  });

  it("accepts empty string", () => {
    expect(PhoneSchema.safeParse("").success).toBe(true);
  });

  it("rejects invalid phone", () => {
    expect(PhoneSchema.safeParse("12345").success).toBe(false);
  });
});

describe("DealerRegistrationSchema", () => {
  it("accepts valid dealer payload", () => {
    const result = DealerRegistrationSchema.safeParse({
      name: "Auto House",
      slug: "auto-house",
      description: "Trusted dealer",
      website_url: "https://example.com",
      address: "Main Street 1",
      city: "Bratislava",
      phone: "+421912345678",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid slug characters", () => {
    const result = DealerRegistrationSchema.safeParse({
      name: "Auto House",
      slug: "Auto House!",
      website_url: "https://example.com",
      phone: "+421912345678",
    });

    expect(result.success).toBe(false);
  });
});

describe("Ad schema sanitization", () => {
  it("strips HTML tags from description", () => {
    const result = AdLocationSchema.parse({
      location_city: "Kosice",
      description: "  <script>alert(1)</script>Great car  ",
    });

    expect(result.description).toBe("alert(1)Great car");
  });

  it("strips HTML tags from inquiry message", () => {
    const result = InquiryCreateSchema.parse({
      ad_id: "123e4567-e89b-12d3-a456-426614174000",
      message: "  <b>Dobry den</b>, mam zaujem o vozidlo  ",
      phone: "+421912345678",
    });

    expect(result.message).toBe("Dobry den, mam zaujem o vozidlo");
  });
});

describe("RegisterSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = RegisterSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
      confirmPassword: "secret456",
      full_name: "User Name",
      phone: "+421912345678",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("confirmPassword");
    }
  });
});

describe("safeParse", () => {
  it("returns typed data on success", () => {
    const schema = z.object({ name: z.string().min(2) });
    const result = safeParse(schema, { name: "Ada" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada");
    }
  });

  it("returns flattened messages on failure", () => {
    const schema = z.object({ name: z.string().min(2) });
    const result = safeParse(schema, { name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toMatch(/^name:/);
    }
  });
});

describe("formatZodErrors", () => {
  it("maps first message per path", () => {
    const schema = z.object({
      email: z.string().email("Invalid email"),
      age: z.number().min(18, "Must be adult"),
    });

    const parse = schema.safeParse({ email: "abc", age: 10 });
    expect(parse.success).toBe(false);

    if (!parse.success) {
      const formatted = formatZodErrors(parse.error);
      expect(formatted.email).toBe("Invalid email");
      expect(formatted.age).toBe("Must be adult");
    }
  });
});

describe("AdSearchFiltersSchema", () => {
  it("applies defaults for page and per_page", () => {
    const result = AdSearchFiltersSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.per_page).toBe(20);
  });
});

describe("CreditSpendSchema", () => {
  it("rejects negative credit spend", () => {
    const result = CreditSpendSchema.safeParse({
      ad_id: "123e4567-e89b-12d3-a456-426614174000",
      action: "top_ad",
      credits: -2,
    });

    expect(result.success).toBe(false);
  });
});
