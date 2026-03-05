import { Product } from "@/engine/types";

export const CLINICAL_PRODUCTS: Product[] = [
    {
        id: "formula-1",
        brand: "DERMATICA",
        phase: "Phase 1",
        type: "Cleanser",

        // Commerce
        price: 34.00,
        price_eur: 34.00,
        volume: "150ml",
        unitPrice: "€22.67 / 100ml",
        shelfLife: "12M",
        stockStatus: "available",

        // Content
        name: {
            en: "Barrier Balance Gel Cleanser",
            de: "Barrier Balance Reinigungsgel"
        },
        benefitSummary: {
            en: "Gently removes impurities without compromising the lipid barrier.",
            de: "Entfernt sanft Unreinheiten, ohne die Lipidbarriere zu beeinträchtigen."
        },
        description: {
            en: "Formulated with a precision pH to match healthy skin, this non-foaming gel cleanser purifies pores while delivering essential ceramides. It prevents the post-wash tightness associated with barrier disruption.",
            de: "Dieses nicht schäumende Reinigungsgel wurde mit einem präzisen pH-Wert für gesunde Haut formuliert. Es reinigt die Poren und liefert gleichzeitig essenzielle Ceramide. Es verhindert das Spannungsgefühl nach der Reinigung, das mit einer Störung der Hautbarriere einhergeht."
        },
        howToUse: {
            en: "Massage 1-2 pumps onto damp skin for 60 seconds. Rinse thoroughly with lukewarm water. Use morning and night.",
            de: "1-2 Pumpstöße auf die feuchte Haut geben und 60 Sekunden lang einmassieren. Mit lauwarmem Wasser gründlich abspülen. Morgens und abends anwenden."
        },
        ingredients: [
            "Aqua (Water)", "Glycerin", "Sodium Cocoyl Isethionate", "Cetearyl Alcohol",
            "Ceramide NP", "Ceramide AP", "Ceramide EOP", "Phytosphingosine",
            "Cholesterol", "Sodium Lauroyl Lactylate", "Carbomer", "Xanthan Gum",
            "Phenoxyethanol", "Ethylhexylglycerin"
        ],

        // Scientific Metadata
        phLevel: 5.5,
        targetVector: "bar",
        vectorImpact: {
            bar: +25,
            sen: +15,
            hyd: +10
        },

        // Legacy
        tier: ["Entry", "Full", "Premium"],
        shopify_handle: "barrier-balance-cleanser",
        key_ingredients: ["Ceramide NP", "Glycerin", "Phytosphingosine"],
        target_axes: ["bar", "sen", "hyd"],
        for_skin: ["sensitive", "dry", "combination"],
        texture_feel: "Gel-to-milk",
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "formula-2",
        brand: "SKINCEUTICALS",
        phase: "Phase 2",
        type: "Serum",

        price: 68.00,
        price_eur: 68.00,
        volume: "30ml",
        unitPrice: "€226.67 / 100ml",
        shelfLife: "12M",
        stockStatus: "available",

        name: {
            en: "Hydration Multiplier B5",
            de: "Hydratations-Multiplikator B5"
        },
        benefitSummary: {
            en: "Floods the stratum corneum with multi-molecular weight hydration.",
            de: "Versorgt das Stratum corneum mit tiefenwirksamer Feuchtigkeit durch unterschiedliche Molekulargewichte."
        },
        description: {
            en: "An unadulterated hydration engine. Combines three molecular weights of Hyaluronic Acid with Vitamin B5 to bind water not just on the surface, but deep within the epidermal layers, physically plumping skin cells.",
            de: "Ein reiner Feuchtigkeitsbooster. Kombiniert drei Molekulargewichte von Hyaluronsäure mit Vitamin B5, um Wasser nicht nur an der Oberfläche, sondern tief in den epidermalen Schichten zu binden und die Hautzellen physisch aufzupolstern."
        },
        howToUse: {
            en: "Apply 3-4 drops to cleansed, slightly damp face, neck, and chest. Pat gently until absorbed.",
            de: "3-4 Tropfen auf das gereinigte, leicht feuchte Gesicht, Hals und Dekolleté auftragen. Sanft einklopfen, bis es eingezogen ist."
        },
        ingredients: [
            "Aqua/Water", "Sodium Hyaluronate", "Panthenol", "Phenoxyethanol",
            "Calcium Pantothenate", "Madecassoside"
        ],

        phLevel: 5.8,
        targetVector: "hyd",
        vectorImpact: {
            hyd: +30,
            bar: +10,
            texture: +15
        },

        tier: ["Full", "Premium"],
        shopify_handle: "hydration-multiplier-b5",
        key_ingredients: ["Hyaluronic Acid", "Vitamin B5", "Madecassoside"],
        target_axes: ["hyd", "bar", "texture"],
        for_skin: ["all"],
        texture_feel: "Weightless serum",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "formula-3",
        brand: "PAULA'S CHOICE",
        phase: "Phase 3",
        type: "Treatment",

        price: 42.00,
        price_eur: 42.00,
        volume: "30ml",
        unitPrice: "€140.00 / 100ml",
        shelfLife: "6M",
        stockStatus: "available",

        name: {
            en: "Clarifying BHA 2% Liquid",
            de: "Klärendes BHA 2% Liquid"
        },
        benefitSummary: {
            en: "Unclogs pores and normalizes sebum production from within the follicle.",
            de: "Befreit die Poren und normalisiert die Talgproduktion tief im Follikel."
        },
        description: {
            en: "This lipid-soluble liquid exfoliant penetrates deep into the sebaceous glands to dissolve congested follicular debris. It actively halts the acne cascade by reducing inflammation and regulating sebum discharge.",
            de: "Dieses fettlösliche flüssige Peeling dringt tief in die Talgdrüsen ein, um verstopfte Abfallstoffe in den Follikeln aufzulösen. Es stoppt aktiv die Akne-Kaskade, indem es Entzündungen reduziert und die Talgabsonderung reguliert."
        },
        howToUse: {
            en: "Lightly soak a cotton pad and apply over the entire face, focusing on congested areas. Do not rinse. Start with PM use every other day.",
            de: "Ein Wattepad leicht tränken und über das gesamte Gesicht streichen, dabei auf verstopfte Bereiche konzentrieren. Nicht abspülen. Anfangs jeden zweiten Tag abends anwenden."
        },
        ingredients: [
            "Aqua", "Methylpropanediol", "Butylene Glycol", "Salicylic Acid",
            "Polysorbate 20", "Camellia Oleifera (Green Tea) Leaf Extract",
            "Sodium Hydroxide", "Tetrasodium EDTA"
        ],

        phLevel: 3.5,
        targetVector: "seb",
        vectorImpact: {
            seb: -25,
            acne: -30,
            texture: +20
        },

        tier: ["Full", "Premium"],
        shopify_handle: "clarifying-bha-2",
        key_ingredients: ["Salicylic Acid 2%", "Green Tea Extract"],
        target_axes: ["seb", "acne", "texture"],
        for_skin: ["oily", "combination", "acne-prone"],
        texture_feel: "Water-light liquid",
        image: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "formula-4",
        brand: "LA ROCHE-POSAY",
        phase: "Phase 4",
        type: "Moisturiser",

        price: 29.50,
        price_eur: 29.50,
        volume: "40ml",
        unitPrice: "€73.75 / 100ml",
        shelfLife: "12M",
        stockStatus: "available",

        name: {
            en: "Toleriane Lipid Recovery Cream",
            de: "Toleriane Lipid Recovery Creme"
        },
        benefitSummary: {
            en: "Seals the skin barrier and instantly calms neurogenic inflammation.",
            de: "Versiegelt die Hautbarriere und beruhigt sofort neurogene Entzündungen."
        },
        description: {
            en: "An ultra-minimalist cocoon for compromised skin. Infused with Neurosensine to interrupt inflammatory signaling, and thermal spring water to remineralize the surface. Locks in moisture while shutting down sensitivity pathways.",
            de: "Ein ultra-minimalistischer Kokon für angegriffene Haut. Angereichert mit Neurosensine zur Unterbrechung entzündlicher Signale und Thermalwasser zur Remineralisierung der Oberfläche. Schließt Feuchtigkeit ein und dämpft gleichzeitig Empfindlichkeitsreaktionen."
        },
        howToUse: {
            en: "Apply deeply into face and neck every morning and evening after treatments.",
            de: "Jeden Morgen und Abend nach der Behandlung tief in Gesicht und Hals einmassieren."
        },
        ingredients: [
            "Aqua/Water", "Isocetyl Stearate", "Squalane", "Butyrospermum Parkii Butter/Shea Butter",
            "Dimethicone", "Glycerin", "Aluminum Starch Octenylsuccinate", "Pentylene Glycol",
            "PEG-100 Stearate", "Glyceryl Stearate", "Cetyl Alcohol", "Sodium Hydroxide",
            "Acetyl Dipeptide-1 Cetyl Ester", "Acrylates/C10-30 Alkyl Acrylate Crosspolymer"
        ],

        phLevel: 5.5,
        targetVector: "sen",
        vectorImpact: {
            sen: -20,
            bar: +20,
            hyd: +15
        },

        tier: ["Entry", "Full", "Premium"],
        shopify_handle: "toleriane-recovery",
        key_ingredients: ["Neurosensine", "Shea Butter", "Squalane"],
        target_axes: ["sen", "bar", "hyd"],
        for_skin: ["all", "sensitive"],
        texture_feel: "Comforting cream",
        image: "https://images.unsplash.com/photo-1608248593842-8eb4793282eb?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "formula-5",
        brand: "HELIOCARE",
        phase: "Phase 5",
        type: "Sunscreen",

        price: 36.00,
        price_eur: 36.00,
        volume: "50ml",
        unitPrice: "€72.00 / 100ml",
        shelfLife: "12M",
        stockStatus: "available",

        name: {
            en: "360° Advanced Shield SPF 50+",
            de: "360° Advanced Shield LSF 50+"
        },
        benefitSummary: {
            en: "Complete spectrum defense against UVA, UVB, visible light, and IR-A.",
            de: "Umfassender Schutz vor UVA-, UVB-Strahlung, sichtbarem Licht und Infrarot-A."
        },
        description: {
            en: "Beyond UV protection. This advanced formula neutralizes free radicals caused by multi-spectrum radiation utilizing Fernblock technology. It prevents structural collagen degradation and tyrosinase activation.",
            de: "Mehr als nur UV-Schutz. Diese fortschrittliche Formel neutralisiert mit der Fernblock-Technologie freie Radikale, die durch Multispektralstrahlung entstehen. Sie verhindert den strukturellen Kollagenabbau und die Tyrosinase-Aktivierung."
        },
        howToUse: {
            en: "Shake well. Apply a generous, even layer (approx. 2 finger lengths) as the final step of your AM routine. Reapply every 2 hours if exposed to direct sunlight.",
            de: "Gut schütteln. Eine großzügige, gleichmäßige Schicht (ca. 2 Fingerlängen) als letzten Schritt der Morgenroutine auftragen. Bei direkter Sonneneinstrahlung alle 2 Stunden erneuern."
        },
        ingredients: [
            "Aqua", "Titanium Dioxide", "Zinc Oxide", "Polypodium Leucotomos Leaf Extract",
            "Ethylhexyl Methoxycinnamate", "Diethylamino Hydroxybenzoyl Hexyl Benzoate",
            "Octocrylene", "Glycerin", "Tocopheryl Acetate", "Ascorbic Acid"
        ],

        phLevel: 6.0,
        targetVector: "pigment",
        vectorImpact: {
            ox: -25,
            pigment: -15,
            aging: +20
        },

        tier: ["Entry", "Full", "Premium"],
        shopify_handle: "360-advanced-shield",
        key_ingredients: ["Fernblock", "Titanium Dioxide", "Zinc Oxide"],
        target_axes: ["pigment", "ox", "aging"],
        for_skin: ["all"],
        texture_feel: "Invisible fluid",
        image: "https://images.unsplash.com/photo-1556228720-1c2a46220a2e?auto=format&fit=crop&q=80&w=400"
    }
];
