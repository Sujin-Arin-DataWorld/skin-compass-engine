import { SymptomDef, ContextKey, SkinType, AxisKey, RiskPattern, MetaQuestion, Product } from "./types";

// Centralized image server for placeholder product images (Unsplash featured skincare)
export const IMAGE_SERVER_URL = "https://source.unsplash.com/featured/?skincare";

export const SYMPTOMS: Record<string, SymptomDef> = {
  // ─── Category 1 — Breakouts & Acne ───────────────────────────────────
  // Signal lanes: Location Pattern · Cycle Triggers · Lesion Type · Post-Breakout Marks · Sebum Connection

  // Location Pattern
  C1_01: { id: "C1_01", text_en: "Your breakouts tend to appear in the same spots every time", category: 1, weights: { acne: 0.9, seb: 0.5 } },
  C1_02: { id: "C1_02", text_en: "You notice most breakouts along your jawline, chin, or lower cheeks", category: 1, weights: { acne: 1.2, sen: 0.4 } },
  C1_03: { id: "C1_03", text_en: "Your skin gets noticeably worse around your period or during hormonal changes", category: 1, weights: { acne: 1.0, sen: 0.4, seb: 0.3 } },

  // Cycle Triggers
  C1_04: { id: "C1_04", text_en: "Breakouts appear where your mask, phone, or glasses touch your face", category: 1, weights: { acne: 0.6, bar: 0.4, sen: 0.3 } },
  C1_05: { id: "C1_05", text_en: "You tend to break out more after working out or sweating heavily", category: 1, weights: { acne: 0.5, seb: 0.5 } },
  C1_06: { id: "C1_06", text_en: "Trying a new product almost always leads to a breakout within a few days", category: 1, weights: { sen: 0.7, acne: 0.4, bar: 0.3 } },

  // Lesion Type
  C1_07: { id: "C1_07", text_en: "You can feel hard, painful lumps deep under your skin that never come to a head", category: 1, weights: { acne: 0.9, sen: 0.2 } },
  C1_08: { id: "C1_08", text_en: "Your breakouts often look red and inflamed, sometimes with visible pus", category: 1, weights: { acne: 1.0, sen: 0.3 } },
  C1_09: { id: "C1_09", text_en: "You have lots of tiny bumps under the skin that you can feel but barely see", category: 1, weights: { acne: 0.5, seb: 0.4, texture: 0.3 } },

  // Post-Breakout Marks
  C1_10: { id: "C1_10", text_en: "Dark or red marks from old breakouts are still visible months after they cleared", category: 1, weights: { acne: 0.4, sen: 0.3, bar: 0.2 } },
  C1_11: { id: "C1_11", text_en: "After you extract or pop a spot, the same area fills back up within hours", category: 1, weights: { seb: 0.9, acne: 0.2 } },
  C1_12: { id: "C1_12", text_en: "Your face has become notably oilier in recent months compared to before", category: 1, weights: { seb: 0.8, acne: 0.3 } },

  // Sebum Connection
  C1_13: { id: "C1_13", text_en: "A stressful week almost always shows up on your skin within days", category: 1, weights: { acne: 0.5, sen: 0.5 } },
  C1_14: { id: "C1_14", text_en: "Spending time in the sun makes your skin more congested or breakout-prone afterward", category: 1, weights: { acne: 0.4, ox: 0.6, sen: 0.4 } },
  C1_15: { id: "C1_15", text_en: "You also get breakouts on your back, chest, or shoulders — not just your face", category: 1, weights: { acne: 0.7, seb: 0.5 } },

  // ─── Category 2 — Oiliness & Makeup Wear ─────────────────────────────
  // Signal lanes: Timing of Shine · Zone Distribution · Makeup Breakdown · Oil-Dry Paradox · Seasonal Variance

  // Timing of Shine
  C2_01: { id: "C2_01", text_en: "By lunchtime your face already looks shiny, even if you washed it this morning", category: 2, weights: { seb: 0.8, makeup_stability: 0.6 } },
  C2_02: { id: "C2_02", text_en: "Your forehead and nose get oily much faster than your cheeks", category: 2, weights: { seb: 0.8, makeup_stability: 0.5 } },
  C2_03: { id: "C2_03", text_en: "Your skin feels oily again within 2 hours of washing your face", category: 2, weights: { seb: 0.9, acne: 0.2 } },

  // Makeup Breakdown
  C2_04: { id: "C2_04", text_en: "Your foundation starts breaking apart or sliding off within 3–4 hours of applying it", category: 2, weights: { makeup_stability: 0.9, seb: 0.6 } },
  C2_05: { id: "C2_05", text_en: "You can see tiny dots of foundation stuck inside your pores after application", category: 2, weights: { texture: 0.7, seb: 0.5, makeup_stability: 0.5 } },
  C2_06: { id: "C2_06", text_en: "Your cushion or liquid base pills up or slides around on your skin", category: 2, weights: { makeup_stability: 0.8, seb: 0.5 } },

  // Oil-Dry Paradox
  C2_07: { id: "C2_07", text_en: "Your skin looks oily on the surface, but underneath it feels tight and dry", category: 2, weights: { seb: 0.6, hyd: 0.6, bar: 0.4 } },
  C2_08: { id: "C2_08", text_en: "Your skin tone looks dull and flat when oily, like it has lost its glow", category: 2, weights: { seb: 0.6, pigment: 0.3, ox: 0.3 } },
  C2_09: { id: "C2_09", text_en: "Blotting paper or powder only keeps shine away for 30 minutes or less", category: 2, weights: { seb: 0.9, makeup_stability: 0.7 } },

  // Seasonal Variance
  C2_10: { id: "C2_10", text_en: "Your makeup oxidizes and turns a shade darker by the end of the day", category: 2, weights: { makeup_stability: 0.7, ox: 0.4, seb: 0.4 } },
  C2_11: { id: "C2_11", text_en: "The area around your nose and cheeks is always the first place makeup disappears", category: 2, weights: { seb: 0.7, makeup_stability: 0.6, texture: 0.3 } },
  C2_12: { id: "C2_12", text_en: "Primers and pore-blurring products stop working within a couple of hours", category: 2, weights: { makeup_stability: 0.8, seb: 0.5 } },
  C2_13: { id: "C2_13", text_en: "Your skin is dramatically more oily in summer than in winter", category: 2, weights: { seb: 0.7, makeup_stability: 0.5, ox: 0.3 } },
  C2_14: { id: "C2_14", text_en: "Your forehead is visibly shiny while your cheeks still feel dry or tight", category: 2, weights: { seb: 0.6, hyd: 0.4, makeup_stability: 0.4 } },
  C2_15: { id: "C2_15", text_en: "Your under-eye concealer creases, fades, or migrates into fine lines by evening", category: 2, weights: { makeup_stability: 0.7, seb: 0.4 } },

  // ─── Category 3 — Dryness & Dehydration ──────────────────────────────
  // Signal lanes: Post-Cleanse Feel · Moisture Duration · Visual Flaking · Lip/Eye Zones · Environmental Triggers

  // Post-Cleanse Feel
  C3_01: { id: "C3_01", text_en: "Your skin feels tight and uncomfortable within seconds of washing your face", category: 3, weights: { hyd: 0.9, bar: 0.5 } },
  C3_02: { id: "C3_02", text_en: "Your moisturizer seems to vanish within 1–2 hours and your skin feels dry again", category: 3, weights: { hyd: 0.8, bar: 0.7 } },
  C3_03: { id: "C3_03", text_en: "You can see actual flakes of dry skin lifting off your face", category: 3, weights: { hyd: 0.7, texture: 0.5, bar: 0.4 } },

  // Moisture Duration
  C3_04: { id: "C3_04", text_en: "Your foundation cracks, flakes, or separates on dry patches throughout the day", category: 3, weights: { hyd: 0.7, makeup_stability: 0.6, bar: 0.3 } },
  C3_05: { id: "C3_05", text_en: "Your skin looks flat and tired — it has lost its natural glow", category: 3, weights: { hyd: 0.8, aging: 0.3 } },
  C3_06: { id: "C3_06", text_en: "Fine lines around your eyes or mouth become much deeper when your skin is dry", category: 3, weights: { hyd: 0.6, aging: 0.5 } },

  // Lip/Eye Zones
  C3_07: { id: "C3_07", text_en: "The skin around your eyes and lips is always the driest area on your face", category: 3, weights: { hyd: 0.7, aging: 0.4, bar: 0.3 } },
  C3_08: { id: "C3_08", text_en: "Your lip line frequently cracks, especially in the corners", category: 3, weights: { hyd: 0.8, bar: 0.4 } },
  C3_09: { id: "C3_09", text_en: "Your skin gets much drier in winter, air-conditioned rooms, or heated spaces", category: 3, weights: { hyd: 0.7, bar: 0.4, sen: 0.2 } },

  // Environmental Triggers
  C3_10: { id: "C3_10", text_en: "Sheet masks feel great during use, but the hydration disappears within an hour", category: 3, weights: { hyd: 0.7, bar: 0.6 } },
  C3_11: { id: "C3_11", text_en: "Your face feels stiff and tight first thing in the morning, before any products", category: 3, weights: { hyd: 0.8, bar: 0.4 } },
  C3_12: { id: "C3_12", text_en: "You need 3 or more layers of hydrating products before your skin feels normal", category: 3, weights: { hyd: 0.6, bar: 0.6 } },

  // Visual Flaking
  C3_13: { id: "C3_13", text_en: "Your skin drinks up moisture immediately but feels dry again very quickly", category: 3, weights: { hyd: 0.7, bar: 0.6 } },
  C3_14: { id: "C3_14", text_en: "Your skin looks thin and you can see tiny blood vessels near the surface", category: 3, weights: { bar: 0.6, hyd: 0.5, sen: 0.4 } },
  C3_15: { id: "C3_15", text_en: "On long flights or in dry environments, your skin becomes noticeably tight within 30 minutes", category: 3, weights: { hyd: 0.7, bar: 0.3 } },

  // ─── Category 4 — Sensitivity & Redness ──────────────────────────────
  // Signal lanes: Flush Triggers · Active Reactions · Temperature Response · Product Anxiety · Visible Capillaries

  // Flush Triggers
  C4_01: { id: "C4_01", text_en: "Your face turns red easily — from embarrassment, spicy food, or a warm room", category: 4, weights: { sen: 0.8, bar: 0.5 } },
  C4_02: { id: "C4_02", text_en: "Your face visibly flushes red right after washing or cleansing it", category: 4, weights: { sen: 0.8, bar: 0.6 } },
  C4_03: { id: "C4_03", text_en: "Your skin stings or burns when you apply certain products", category: 4, weights: { sen: 0.9, bar: 0.5 } },

  // Active Reactions
  C4_04: { id: "C4_04", text_en: "After exfoliating, your skin stays irritated or sensitive for several days", category: 4, weights: { sen: 0.7, bar: 0.7 } },
  C4_05: { id: "C4_05", text_en: "Acids like AHA, BHA, or Vitamin C serums make your skin sting or tingle", category: 4, weights: { sen: 0.8, bar: 0.5 } },
  C4_06: { id: "C4_06", text_en: "Retinol or retinoid products cause noticeable peeling or burning", category: 4, weights: { sen: 0.7, bar: 0.6 } },

  // Temperature Response
  C4_07: { id: "C4_07", text_en: "Your skin reacts visibly when you go from cold to warm or vice versa", category: 4, weights: { sen: 0.7, bar: 0.4 } },
  C4_08: { id: "C4_08", text_en: "Cold, windy weather immediately turns your cheeks or nose red", category: 4, weights: { sen: 0.7, bar: 0.4 } },
  C4_09: { id: "C4_09", text_en: "After exercising or being in heat, the redness on your face lasts more than 30 minutes", category: 4, weights: { sen: 0.7, ox: 0.3 } },

  // Product Anxiety
  C4_10: { id: "C4_10", text_en: "Stress or anxiety makes your skin visibly red or flushed", category: 4, weights: { sen: 0.7, bar: 0.3 } },
  C4_11: { id: "C4_11", text_en: "You feel nervous about trying new skincare products because your skin often reacts", category: 4, weights: { sen: 0.6, bar: 0.5 } },
  C4_12: { id: "C4_12", text_en: "Products with fragrance or alcohol immediately make your skin red or itchy", category: 4, weights: { sen: 0.8, bar: 0.5 } },

  // Visible Capillaries
  C4_13: { id: "C4_13", text_en: "Your skin itches frequently, even without an obvious cause", category: 4, weights: { sen: 0.7, bar: 0.6 } },
  C4_14: { id: "C4_14", text_en: "Your skin is both red and dry at the same time — they seem to come together", category: 4, weights: { sen: 0.6, bar: 0.7, hyd: 0.5 } },
  C4_15: { id: "C4_15", text_en: "You can see thin, spider-like red veins on your cheeks or around your nose", category: 4, weights: { sen: 0.7, aging: 0.3, bar: 0.4 } },

  // ─── Category 5 — Pigmentation & Skintone ────────────────────────────
  // Signal lanes: Spot Darkening · Sun Response · Post-Inflammation · Tone Evenness · Radiance Loss

  // Spot Darkening
  C5_01: { id: "C5_01", text_en: "Dark spots on your face seem to be getting deeper or more noticeable over time", category: 5, weights: { pigment: 0.9, ox: 0.4 } },
  C5_02: { id: "C5_02", text_en: "You have brown patches on your cheeks or forehead that won't fade with regular skincare", category: 5, weights: { pigment: 0.9, ox: 0.5 } },
  C5_03: { id: "C5_03", text_en: "Dark marks from old breakouts are still visible many months after the blemish healed", category: 5, weights: { pigment: 0.8, acne: 0.2 } },

  // Sun Response
  C5_04: { id: "C5_04", text_en: "Your skin tone looks patchy — some areas are darker than others", category: 5, weights: { pigment: 0.8, texture: 0.3 } },
  C5_05: { id: "C5_05", text_en: "Your face looks dull and flat, like it has lost its natural brightness", category: 5, weights: { pigment: 0.7, ox: 0.6 } },
  C5_06: { id: "C5_06", text_en: "Even brief sun exposure makes your skin visibly darker or more uneven", category: 5, weights: { pigment: 0.8, ox: 0.7 } },

  // Post-Inflammation
  C5_07: { id: "C5_07", text_en: "The area beside your nose or around your mouth looks darker than the rest of your face", category: 5, weights: { pigment: 0.6, texture: 0.3 } },
  C5_08: { id: "C5_08", text_en: "Your under-eye dark circles have a brownish tone, not just purple shadows", category: 5, weights: { pigment: 0.6, aging: 0.2 } },
  C5_09: { id: "C5_09", text_en: "Your skin has a greyish or yellowish cast that makes it look tired", category: 5, weights: { pigment: 0.4, ox: 0.7, hyd: 0.3 } },

  // Tone Evenness
  C5_10: { id: "C5_10", text_en: "Even with makeup on, your skin still looks flat and lacks a healthy glow", category: 5, weights: { pigment: 0.5, ox: 0.5, hyd: 0.4 } },
  C5_11: { id: "C5_11", text_en: "There is a noticeable color difference between your face and your neck", category: 5, weights: { pigment: 0.7, ox: 0.4 } },
  C5_12: { id: "C5_12", text_en: "The center of your face (nose and cheeks) looks redder or darker than the edges", category: 5, weights: { pigment: 0.6, sen: 0.3 } },

  // Radiance Loss
  C5_13: { id: "C5_13", text_en: "The number of dark spots on your face is visibly increasing over time", category: 5, weights: { pigment: 0.8, ox: 0.5, aging: 0.3 } },
  C5_14: { id: "C5_14", text_en: "Pigmentation appeared or worsened during pregnancy or while on hormonal medication", category: 5, weights: { pigment: 0.8, ox: 0.3 } },
  C5_15: { id: "C5_15", text_en: "Your skin tans or darkens much faster than the people around you in the same sun", category: 5, weights: { pigment: 0.7, ox: 0.5 } },

  // ─── Category 6 — Pores & Texture ────────────────────────────────────
  // Signal lanes: Pore Visibility · Roughness Feel · Dead Cell Buildup · Photo Appearance · Progressive Worsening

  // Pore Visibility
  C6_01: { id: "C6_01", text_en: "When you look in the mirror, you can clearly see your pores without zooming in", category: 6, weights: { texture: 0.8, seb: 0.5 } },
  C6_02: { id: "C6_02", text_en: "The pores on your nose are especially large and easy to see", category: 6, weights: { texture: 0.8, seb: 0.6 } },
  C6_03: { id: "C6_03", text_en: "The pores on your cheeks look stretched or elongated, like vertical ovals", category: 6, weights: { texture: 0.7, aging: 0.5 } },

  // Roughness Feel
  C6_04: { id: "C6_04", text_en: "Your pores look dark or congested, like they have tiny black or grey dots inside", category: 6, weights: { seb: 0.7, texture: 0.7, acne: 0.2 } },
  C6_05: { id: "C6_05", text_en: "When you apply foundation, it sinks into your pores making them look even bigger", category: 6, weights: { texture: 0.7, seb: 0.5, makeup_stability: 0.5 } },
  C6_06: { id: "C6_06", text_en: "When you run your finger across your cheek, it feels rough rather than smooth", category: 6, weights: { texture: 0.9, hyd: 0.3 } },

  // Dead Cell Buildup
  C6_07: { id: "C6_07", text_en: "Your skin surface has small bumps that you can see from a side angle", category: 6, weights: { texture: 0.9, acne: 0.3 } },
  C6_08: { id: "C6_08", text_en: "Other people can notice the unevenness of your skin when looking at your profile", category: 6, weights: { texture: 0.8 } },
  C6_09: { id: "C6_09", text_en: "Your skin feels like it has a layer of something sitting on top that cleansing doesn't remove", category: 6, weights: { texture: 0.7, hyd: 0.4, bar: 0.3 } },

  // Photo Appearance
  C6_10: { id: "C6_10", text_en: "In photos, your skin texture is very visible — especially in natural light", category: 6, weights: { texture: 0.8 } },
  C6_11: { id: "C6_11", text_en: "Even right after cleansing, your pores still look dirty or clogged", category: 6, weights: { texture: 0.6, seb: 0.5, acne: 0.3 } },
  C6_12: { id: "C6_12", text_en: "You can feel hard, solid plugs lodged inside your pores when you touch your nose", category: 6, weights: { seb: 0.7, texture: 0.6 } },

  // Progressive Worsening
  C6_13: { id: "C6_13", text_en: "Certain lighting angles make your skin texture look dramatically worse", category: 6, weights: { texture: 0.8 } },
  C6_14: { id: "C6_14", text_en: "Your pores become much more visible after you put makeup on, not less", category: 6, weights: { texture: 0.7, seb: 0.4, makeup_stability: 0.4 } },
  C6_15: { id: "C6_15", text_en: "Your skin used to be smoother — the texture has clearly worsened over the past year or two", category: 6, weights: { texture: 0.7, bar: 0.4, aging: 0.3 } },

  // ─── Category 7 — Wrinkles & Firmness ────────────────────────────────
  // Signal lanes: Fine Lines · Deep Folds · Contour Softening · Skin Thinning · Collagen Loss Signs

  // Fine Lines
  C7_01: { id: "C7_01", text_en: "Fine lines around your eyes have become more noticeable in the past year", category: 7, weights: { aging: 1.0, hyd: 0.3 } },
  C7_02: { id: "C7_02", text_en: "When you smile, the lines that form stay visible for a moment even after you stop smiling", category: 7, weights: { aging: 0.8 } },
  C7_03: { id: "C7_03", text_en: "The lines from your nose to mouth (smile lines) or around your lips are getting deeper", category: 7, weights: { aging: 1.0 } },

  // Deep Folds
  C7_04: { id: "C7_04", text_en: "You are starting to notice horizontal lines forming on your neck", category: 7, weights: { aging: 0.7 } },
  C7_05: { id: "C7_05", text_en: "Your jawline looks less sharp than it used to — the edges are softening", category: 7, weights: { aging: 1.0 } },
  C7_06: { id: "C7_06", text_en: "When you gently press your cheek, the skin doesn't spring back as quickly as before", category: 7, weights: { aging: 1.1, hyd: 0.3 } },

  // Contour Softening
  C7_07: { id: "C7_07", text_en: "Your face looks like it is sliding downward — things feel lower than they used to", category: 7, weights: { aging: 1.1 } },
  C7_08: { id: "C7_08", text_en: "Your skin is getting thinner — it feels more delicate and fragile than before", category: 7, weights: { aging: 0.7, bar: 0.4 } },
  C7_09: { id: "C7_09", text_en: "Your pores seem to be getting larger as your skin loses its firmness", category: 7, weights: { aging: 0.6, texture: 0.5 } },

  // Skin Thinning
  C7_10: { id: "C7_10", text_en: "Your makeup settles into fine lines and wrinkles by the end of the day", category: 7, weights: { aging: 0.6, hyd: 0.4, makeup_stability: 0.4 } },
  C7_11: { id: "C7_11", text_en: "Your face looks less plump and full than it did a couple of years ago", category: 7, weights: { aging: 1.1, ox: 0.3 } },
  C7_12: { id: "C7_12", text_en: "When you look at yourself from the side, your facial contours look lower", category: 7, weights: { aging: 0.8 } },

  // Collagen Loss Signs
  C7_13: { id: "C7_13", text_en: "When you gently pinch the skin on your cheek, it feels loose or doesn't resist", category: 7, weights: { aging: 0.8, bar: 0.2 } },
  C7_14: { id: "C7_14", text_en: "A noticeable double chin appears when you look downward at your phone", category: 7, weights: { aging: 0.7 } },
  C7_15: { id: "C7_15", text_en: "The horizontal lines on your forehead are becoming permanent, not just when you raise your eyebrows", category: 7, weights: { aging: 0.7 } },
  C7_16: { id: "C7_16", text_en: "Comparing photos from 1–2 years ago, your facial contours look noticeably different", category: 7, weights: { aging: 0.8, texture: 0.2 } },

  // ─── Category 8 — Barrier & Recovery ─────────────────────────────────
  // Signal lanes: Product Intolerance · Recovery Speed · Simultaneous Symptoms · Over-Exfoliation · Moisture Retention

  // Product Intolerance
  C8_01: { id: "C8_01", text_en: "Products that used to work fine now suddenly sting, burn, or irritate your skin", category: 8, weights: { bar: 0.9, sen: 0.7 } },
  C8_02: { id: "C8_02", text_en: "Your skin has become more reactive overall — it gets upset by things it never reacted to before", category: 8, weights: { bar: 0.7, sen: 0.8 } },
  C8_03: { id: "C8_03", text_en: "You are experiencing redness, dryness, and breakouts all at the same time", category: 8, weights: { bar: 0.9, sen: 0.6, hyd: 0.5, acne: 0.4 } },

  // Recovery Speed
  C8_04: { id: "C8_04", text_en: "Switching to a different product caused your skin to freak out for days or weeks", category: 8, weights: { bar: 0.8, sen: 0.7 } },
  C8_05: { id: "C8_05", text_en: "Your skin never seems to fully settle — it's constantly unstable or fluctuating", category: 8, weights: { bar: 0.8, sen: 0.6 } },
  C8_06: { id: "C8_06", text_en: "After exfoliating, your skin takes several days to feel normal again", category: 8, weights: { bar: 0.8, sen: 0.4 } },

  // Simultaneous Symptoms
  C8_07: { id: "C8_07", text_en: "Your skin became very reactive after a professional peel, laser, or facial treatment", category: 8, weights: { bar: 0.7, sen: 0.6 } },
  C8_08: { id: "C8_08", text_en: "You feel like your skin's protective layer is damaged — it's raw and vulnerable", category: 8, weights: { bar: 0.9 } },
  C8_09: { id: "C8_09", text_en: "Even water, wind, or a clean towel can trigger tingling or stinging on your face", category: 8, weights: { sen: 0.8, bar: 0.7 } },

  // Over-Exfoliation
  C8_10: { id: "C8_10", text_en: "Your skin can't seem to hold onto moisture — it evaporates almost immediately", category: 8, weights: { bar: 0.7, hyd: 0.6 } },
  C8_11: { id: "C8_11", text_en: "Your face heats up or flushes from very minor things like a warm drink", category: 8, weights: { sen: 0.7, bar: 0.5 } },
  C8_12: { id: "C8_12", text_en: "You have been scrubbing, peeling, or exfoliating your skin very frequently", category: 8, weights: { bar: 0.8, sen: 0.4 } },

  // Moisture Retention
  C8_13: { id: "C8_13", text_en: "You need 4 or more moisturizing steps before your skin stops feeling uncomfortable", category: 8, weights: { bar: 0.6, hyd: 0.5 } },
  C8_14: { id: "C8_14", text_en: "Serums and creams seem to sit on top of your skin rather than absorbing in", category: 8, weights: { bar: 0.7, texture: 0.4 } },
  C8_15: { id: "C8_15", text_en: "Your face feels tight and dry within 30 seconds of washing, before you apply anything", category: 8, weights: { bar: 1.0, hyd: 0.7 } },
};

export const CATEGORY_INFO: Record<number, { emoji: string; name: string; clinical: string }> = {
  1: { emoji: "🔴", name: "Breakouts & Acne", clinical: "Indicators of sebum dysregulation and follicular inflammation" },
  2: { emoji: "🟡", name: "Oiliness & Makeup Wear", clinical: "Sebum overproduction and its effect on cosmetic stability" },
  3: { emoji: "🔵", name: "Dryness & Dehydration", clinical: "Transepidermal water loss and NMF depletion patterns" },
  4: { emoji: "🟠", name: "Sensitivity & Redness", clinical: "Neurogenic inflammation, vascular hyperreactivity, and impaired tolerance" },
  5: { emoji: "🟤", name: "Pigmentation & Skintone", clinical: "Melanocyte hyperactivation, oxidative stress, and photodamage patterns" },
  6: { emoji: "⚪", name: "Pores & Texture", clinical: "Follicular dilation, keratinisation disorder, and surface irregularity" },
  7: { emoji: "🔷", name: "Wrinkles & Firmness", clinical: "Collagen loss, ECM degradation, and gravitational tissue changes" },
  8: { emoji: "⚠️", name: "Barrier & Recovery", clinical: "Stratum corneum integrity, recovery capacity, and sensitisation state" },
};

export const META_QUESTIONS: MetaQuestion[] = [
  {
    id: "flush_30min",
    text_en: "Does flushing persist for more than 30 minutes?",
    type: "boolean",
    trigger_after_category: 4,
    trigger_condition: (s) => (s["C4_09"] ?? 0) >= 2 || (s["C4_15"] ?? 0) >= 2,
  },
  {
    id: "central_face",
    text_en: "Is redness concentrated on the central face (nose, cheeks)?",
    type: "boolean",
    trigger_after_category: 4,
    trigger_condition: (s) => (s["C4_09"] ?? 0) >= 2 || (s["C4_15"] ?? 0) >= 2,
  },
  {
    id: "exfoliation_2w",
    text_en: "How frequently have you exfoliated in the past 2 weeks?",
    type: "severity",
    trigger_after_category: 8,
    trigger_condition: (s) => (s["C8_12"] ?? 0) >= 2 || (s["C8_06"] ?? 0) >= 2 || (s["C8_15"] ?? 0) >= 2,
  },
  {
    id: "new_actives",
    text_en: "Have you introduced new active ingredients recently?",
    type: "boolean",
    trigger_after_category: 8,
    trigger_condition: (s) => (s["C8_12"] ?? 0) >= 2 || (s["C8_06"] ?? 0) >= 2 || (s["C8_15"] ?? 0) >= 2,
  },
  {
    id: "premenstrual_7_10d",
    text_en: "Do breakouts appear 7–10 days before menstruation?",
    type: "severity",
    trigger_after_category: 1,
    trigger_condition: (s) => (s["C1_02"] ?? 0) >= 2 || (s["C1_03"] ?? 0) >= 2,
  },
  {
    id: "jaw_focus",
    text_en: "Are breakouts specifically concentrated along the jawline?",
    type: "severity",
    trigger_after_category: 1,
    trigger_condition: (s) => (s["C1_02"] ?? 0) >= 2 || (s["C1_03"] ?? 0) >= 2,
  },
];

export const CONTEXT_MODIFIERS: Record<ContextKey, Partial<Record<AxisKey, number>>> = {
  shaving: { sen: 0.15, bar: 0.10, acne: 0.10 },
  makeup: { makeup_stability: 0.20, seb: 0.10 },
  hormonal: { acne: 0.40, seb: 0.15, sen: 0.10 },
  outdoor_work: { ox: 0.25, pigment: 0.15 },
  skincare_beginner: { bar: 0.10, sen: 0.05 },
  recent_procedure: { bar: 0.20, sen: 0.20 },
  low_water_intake: { hyd: 0.15 },
  reactive_skin: { sen: 0.15, bar: 0.10 },
  high_stress: { sen: 0.15, bar: 0.15 },
};

export const SKIN_TYPE_BASELINES: Record<SkinType, Partial<Record<AxisKey, number>>> = {
  dry: { hyd: 15, bar: 10, sen: 5 },
  oily: { seb: 20, acne: 10, texture: 10, makeup_stability: 10 },
  combination: { seb: 10, hyd: 8, texture: 8, makeup_stability: 8 },
  sensitive: { sen: 20, bar: 15 }, // baseline kept for scoring but option hidden in UI
  normal: {},
};

export const HIGH_RISK_PATTERNS: RiskPattern[] = [
  {
    id: "PATTERN_BARRIER_TRIAD",
    name_en: "Compromised Barrier Triad",
    required: ["C8_03", "C8_01"],
    optional: ["C4_14", "C3_02", "C8_08", "C8_15"],
    min_optional: 2,
    axis_gates: { bar: 50 },
    clinical_en: "Simultaneous redness, dryness and breakouts signal Sensitized Skin Syndrome — ceramide depletion combined with neurogenic inflammation. Barrier-first protocol essential.",
    flag: "BARRIER_EMERGENCY",
    urgency: "CRITICAL",
    threshold: 65,
  },
  {
    id: "PATTERN_HORMONAL_ACNE",
    name_en: "Hormonal Acne Cascade",
    required: ["C1_03", "C1_02"],
    optional: ["C1_07", "C1_08", "C1_12", "C1_15"],
    min_optional: 2,
    axis_gates: { acne: 40 },
    clinical_en: "Cyclical acne on jaw, cheeks and forehead with nodular/cystic lesions indicates androgen receptor hyperactivation. Niacinamide + sebum-control protocol recommended.",
    flag: "HORMONAL_ACNE_PROTOCOL",
    urgency: "HIGH",
    threshold: 70,
  },
  {
    id: "PATTERN_DEHYDRATED_OILY",
    name_en: "Dehydrated Oily Skin Pattern",
    required: ["C2_07", "C2_01"],
    optional: ["C3_01", "C2_14", "C6_04", "C1_11"],
    min_optional: 2,
    axis_gates: {},
    clinical_en: "Oily surface with dry underneath indicates concurrent sebum hypersecretion and stratum corneum dehydration. Hydration-first, then sebum regulation protocol.",
    flag: "HYDRATION_FIRST",
    urgency: "MEDIUM",
    threshold: 75,
  },
  {
    id: "PATTERN_PHOTOAGING",
    name_en: "Photo-Oxidative Aging Pattern",
    required: ["C5_06", "C5_13"],
    optional: ["C7_11", "C7_03", "C5_02", "C5_15"],
    min_optional: 2,
    axis_gates: { ox: 40 },
    clinical_en: "Rapid post-UV pigmentation with increasing melasma indicates accelerated photoaging. Vitamin C + Retinal + Physical SPF50+ essential.",
    flag: "ANTIOXIDANT_PRIORITY",
    urgency: "HIGH",
    threshold: 70,
  },
  {
    id: "PATTERN_COUPEROSE",
    name_en: "Couperose / Vascular Hyperreactivity",
    required: ["C4_15", "C4_09"],
    optional: ["C4_01", "C4_08", "C4_07", "C4_02"],
    min_optional: 2,
    axis_gates: { sen: 45 },
    clinical_en: "Visible capillaries with persistent flushing signal Couperose or early Rosacea Type I. Avoid thermal triggers, alcohol, fragrance. Niacinamide + Azelaic acid protocol recommended.",
    flag: "ANTI_REDNESS_PROTOCOL",
    urgency: "HIGH",
    threshold: 70,
  },
  {
    id: "PATTERN_SEVERE_ACNE",
    name_en: "Severe Inflammatory Acne",
    required: ["C1_07", "C1_08"],
    optional: ["C1_01", "C1_03", "C1_15", "C1_12"],
    min_optional: 2,
    axis_gates: { acne: 50 },
    clinical_en: "Concurrent nodular and pustular acne = IGA Grade 3+. Dermatologist consultation strongly advised. BHA + Niacinamide routine as adjunct therapy.",
    flag: "DERMATOLOGIST_REFERRAL",
    urgency: "CRITICAL",
    threshold: 65,
  },
  {
    id: "PATTERN_AGING_TRIAD",
    name_en: "Accelerated Aging Triad",
    required: ["C7_06", "C7_11"],
    optional: ["C7_03", "C7_07", "C7_12", "C7_14", "C5_13"],
    min_optional: 3,
    axis_gates: { aging: 45 },
    clinical_en: "Combined elasticity loss, deep wrinkles and sagging signal accelerated collagen decline and ECM degradation. 4-step anti-aging: Retinal + Peptide + Collagen booster + Vitamin C.",
    flag: "DEVICE_RECOMMENDED",
    urgency: "HIGH",
    threshold: 70,
  },
  {
    id: "PATTERN_OVER_EXFOLIATION",
    name_en: "Over-Exfoliation Syndrome",
    required: ["C8_12", "C8_06"],
    optional: ["C8_01", "C8_04", "C4_04", "C4_05"],
    min_optional: 2,
    axis_gates: { bar: 50 },
    clinical_en: "Repeated physical exfoliation with impaired recovery indicates stratum corneum over-damage. Stop all active ingredients. Ceramide + Panthenol barrier-rebuild protocol. Minimum 4 weeks stabilization required.",
    flag: "ACTIVE_INGREDIENT_PAUSE",
    urgency: "CRITICAL",
    threshold: 65,
  },
];

export const PRODUCT_CATALOG: Record<string, Product> = {
  biplain_cleanser: { id: "biplain_cleanser", name: "B'Plain Green Bean Foam Cleanser", brand: "B'Plain", phase: "Phase1", type: "Sensitive Cleanser", price_eur: 18, tier: ["Entry", "Full", "Premium"], shopify_handle: "biplain-greenbean-foam-cleanser", key_ingredients: ["Green Bean Extract", "Amino Acid Surfactant", "pH5.5"], target_axes: ["sen", "bar"], for_skin: ["sensitive", "dry", "normal"] },
  drg_cleanser_oily: { id: "drg_cleanser_oily", name: "Dr.G pH Balancing Cleanser", brand: "Dr.G", phase: "Phase1", type: "Oily Skin Cleanser", price_eur: 16, tier: ["Entry", "Full", "Premium"], shopify_handle: "drg-ph-balancing-cleanser", key_ingredients: ["Salicylic Acid", "5-Biome", "8x Hyaluronic Acid", "pH5.5"], target_axes: ["seb", "acne", "texture"], for_skin: ["oily", "combination"], image: `${IMAGE_SERVER_URL}&sig=drg_cleanser_oily` },
  torriden_serum: { id: "torriden_serum", name: "Torriden DIVE-IN Hyaluronic Acid Serum", brand: "Torriden", phase: "Phase2A", type: "Hydration Serum", price_eur: 22, tier: ["Full", "Premium"], shopify_handle: "torriden-dive-in-low-molecular-hyaluronic-acid-serum", key_ingredients: ["5 Types Hyaluronic Acid", "Panthenol", "Alcohol-Free"], target_axes: ["hyd", "bar"], for_skin: ["dry", "combination", "sensitive", "normal"], image: `${IMAGE_SERVER_URL}&sig=torriden_serum` },
  snature_toner: { id: "snature_toner", name: "S.NATURE Aqua Oasis Toner", brand: "S.NATURE", phase: "Phase2A", type: "Hydration Toner", price_eur: 14, tier: ["Entry"], shopify_handle: "snature-aqua-oasis-toner", key_ingredients: ["Hyaluronic Acid", "Panthenol", "Alcohol-Free"], target_axes: ["hyd"], for_skin: ["all"], image: `${IMAGE_SERVER_URL}&sig=snature_toner` },
  aestura_cream: { id: "aestura_cream", name: "Aestura AtoBarrier365 Cream", brand: "Aestura", phase: "Phase2B", type: "Barrier Cream", price_eur: 38, tier: ["Full", "Premium"], shopify_handle: "aestura-atobarrier365-cream", key_ingredients: ["Ceramide NP", "Squalane", "Cholesterol", "Panthenol"], target_axes: ["bar", "hyd", "sen"], for_skin: ["sensitive", "dry", "combination"], image: `${IMAGE_SERVER_URL}&sig=aestura_cream` },
  snature_squalane: { id: "snature_squalane", name: "S.NATURE Aqua Squalane Serum", brand: "S.NATURE", phase: "Phase2B", type: "Squalane Serum", price_eur: 20, tier: ["Entry", "Full"], shopify_handle: "snature-aqua-squalane-serum", key_ingredients: ["Squalane", "Panthenol", "Allantoin"], target_axes: ["bar", "hyd"], for_skin: ["all"], image: `${IMAGE_SERVER_URL}&sig=snature_squalane` },
  manyo_bifida: { id: "manyo_bifida", name: "Manyo Bifida Biome Complex Ampoule", brand: "Manyo Factory", phase: "Phase2C", type: "Microbiome Ampoule", price_eur: 32, tier: ["Full", "Premium"], shopify_handle: "manyo-bifida-biome-complex-ampoule", key_ingredients: ["Bifida Ferment Lysate", "10x Hyaluronic Acid", "Madecassoside"], target_axes: ["bar", "sen", "hyd"], for_skin: ["sensitive", "dry", "combination"] },
  bioheal_probioderm: { id: "bioheal_probioderm", name: "Bioheal BOH Probioderm Serum", brand: "Bioheal BOH", phase: "Phase2C", type: "Premium Microbiome Serum", price_eur: 42, tier: ["Premium"], shopify_handle: "bioheal-boh-probioderm-collagen-remodeling-serum", key_ingredients: ["Patented Biome Complex", "12 Peptides", "Collagen"], target_axes: ["bar", "sen", "aging"], for_skin: ["all"] },
  cosrx_bha: { id: "cosrx_bha", name: "COSRX BHA Blackhead Power Liquid", brand: "COSRX", phase: "Phase3_Acne", type: "BHA Exfoliator", price_eur: 22, tier: ["Full", "Premium"], shopify_handle: "cosrx-bha-blackhead-power-liquid", key_ingredients: ["Salicylic Acid (BHA)", "Niacinamide"], target_axes: ["acne", "seb", "texture"], for_skin: ["oily", "combination"], image: `${IMAGE_SERVER_URL}&sig=cosrx_bha` },
  bringgreen_teatree: { id: "bringgreen_teatree", name: "Bring Green Tea Tree Cica Toner", brand: "Bring Green", phase: "Phase3_Acne", type: "Soothing Toner", price_eur: 15, tier: ["Entry", "Full"], shopify_handle: "bring-green-teatree-cica-soothing-toner", key_ingredients: ["3x Tea Tree 50%", "Centella", "AHA"], target_axes: ["acne", "sen"], for_skin: ["oily", "combination", "sensitive"] },
  missha_vitac: { id: "missha_vitac", name: "MISSHA Vita C Plus Ampoule", brand: "MISSHA", phase: "Phase3_Pigment", type: "Brightening Ampoule", price_eur: 35, tier: ["Full", "Premium"], shopify_handle: "missha-vita-c-plus-spot-correcting-and-firming-ampoule", key_ingredients: ["Vitamin C", "Tranexamic Acid", "Niacinamide"], target_axes: ["pigment", "ox", "aging"], for_skin: ["all"], image: `${IMAGE_SERVER_URL}&sig=missha_vitac` },
  cellfusionc_toning: { id: "cellfusionc_toning", name: "Cell Fusion C Toning C Serum", brand: "Cell Fusion C", phase: "Phase3_Pigment", type: "Vitamin C Serum", price_eur: 38, tier: ["Premium"], shopify_handle: "cell-fusion-c-toning-c-dark-spot-serum", key_ingredients: ["Pure Vitamin C", "Brightening Complex"], target_axes: ["pigment", "ox"], for_skin: ["all"] },
  iope_retinol: { id: "iope_retinol", name: "IOPE Retinol Super Bounce Serum", brand: "IOPE", phase: "Phase3_Aging", type: "Retinol Serum", price_eur: 52, tier: ["Full", "Premium"], shopify_handle: "iope-retinol-super-bounce-serum", key_ingredients: ["Retinal", "Peptides", "Hyaluronic Acid"], target_axes: ["aging", "texture"], for_skin: ["all"], image: `${IMAGE_SERVER_URL}&sig=iope_retinol` },
  bioheal_collagen: { id: "bioheal_collagen", name: "Bioheal BOH Collagen Intensive Serum", brand: "Bioheal BOH", phase: "Phase3_Aging", type: "Collagen Peptide Serum", price_eur: 45, tier: ["Premium"], shopify_handle: "bioheal-boh-probioderm-collagen-remodeling-intensive-serum", key_ingredients: ["Collagen T1&T3", "12 Peptides", "Biome Complex"], target_axes: ["aging", "bar", "texture"], for_skin: ["all"], image: `${IMAGE_SERVER_URL}&sig=bioheal_collagen` },
  drg_soothing_cream: { id: "drg_soothing_cream", name: "Dr.G Red Blemish Soothing Cream", brand: "Dr.G", phase: "Phase4", type: "Gel Cream (Oily)", price_eur: 20, tier: ["Entry", "Full", "Premium"], shopify_handle: "drg-red-blemish-clear-soothing-cream", key_ingredients: ["Madecassoside", "Panthenol", "Aloe"], target_axes: ["acne", "sen", "bar"], for_skin: ["oily", "combination"], image: `${IMAGE_SERVER_URL}&sig=drg_soothing_cream` },
  snature_moistcream: { id: "snature_moistcream", name: "S.NATURE Aqua Squalane Moisture Cream", brand: "S.NATURE", phase: "Phase4", type: "Moisture Cream", price_eur: 25, tier: ["Full", "Premium"], shopify_handle: "snature-aqua-squalane-moisture-cream", key_ingredients: ["Squalane", "Hyaluronic Acid", "Panthenol"], target_axes: ["hyd", "bar"], for_skin: ["dry", "combination", "normal"], image: `${IMAGE_SERVER_URL}&sig=snature_moistcream` },
  cellfusionc_sunscreen: { id: "cellfusionc_sunscreen", name: "Cell Fusion C Laser Sunscreen 100", brand: "Cell Fusion C", phase: "Phase5", type: "Hybrid Sunscreen", price_eur: 32, tier: ["Full", "Premium"], shopify_handle: "cell-fusion-c-laser-sunscreen-100-spf50", key_ingredients: ["SPF50+/PA++++", "PDRN", "Hybrid UV Filter"], target_axes: ["ox", "pigment", "sen"], for_skin: ["all"] },
  drg_sunscreen: { id: "drg_sunscreen", name: "Dr.G Green Mild Up Sun Plus", brand: "Dr.G", phase: "Phase5", type: "Mineral Sunscreen", price_eur: 20, tier: ["Entry"], shopify_handle: "drg-green-mild-up-sun-plus-spf50", key_ingredients: ["SPF50+/PA++++", "Mineral Filter", "Green Tea"], target_axes: ["ox", "sen"], for_skin: ["all"] },
  medicube_booster: { id: "medicube_booster", name: "Medicube AGE-R Booster Pro", brand: "Medicube", phase: "Device", type: "EMS+LED Device", price_eur: 380, tier: ["Premium"], shopify_handle: "medicube-age-r-booster-pro-ems-device", key_ingredients: ["EMS", "Microcurrent", "LED Phototherapy"], target_axes: ["aging", "texture", "bar"], for_skin: ["all"] },
  mamicare_device: { id: "mamicare_device", name: "Mamicare Home LED Device", brand: "Mamicare", phase: "Device", type: "LED Device", price_eur: 89, tier: ["Full"], shopify_handle: "mamicare-homecare-led-device", key_ingredients: ["Blue LED (Acne)", "Red LED (Regeneration)"], target_axes: ["acne", "aging", "bar"], for_skin: ["all"] },
};
