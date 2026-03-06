const fs = require('fs');
const path = require('path');

const weightsPath = '/Users/sujinpark/Desktop/skin-compass-engine/src/engine/weights.ts';
let code = fs.readFileSync(weightsPath, 'utf8');

const translationDict = {
    // Cat 1
    C1_01: "Ihre Unreinheiten treten meist an denselben Stellen auf",
    C1_02: "Sie bemerken die meisten Unreinheiten entlang der Kieferpartie, am Kinn oder an den unteren Wangen",
    C1_03: "Ihre Haut verschlechtert sich merklich während Ihrer Periode oder bei hormonellen Schwankungen",
    C1_04: "Unreinheiten treten dort auf, wo Ihre Maske, das Telefon oder die Brille das Gesicht berühren",
    C1_05: "Nach dem Training oder starkem Schwitzen neigen Sie eher zu Unreinheiten",
    C1_06: "Das Ausprobieren eines neuen Produkts führt innerhalb weniger Tage fast immer zu Ausbrüchen",
    C1_07: "Sie spüren harte, schmerzhafte Knoten tief unter der Haut, die nie an die Oberfläche kommen",
    C1_08: "Ihre Unreinheiten sehen oft rot und entzündet aus, manchmal mit sichtbarem Eiter",
    C1_09: "Sie haben viele winzige Unebenheiten unter der Haut, die spürbar, aber kaum sichtbar sind",
    C1_10: "Dunkle oder rote Flecken von alten Unreinheiten sind noch Monate nach dem Abheilen sichtbar",
    C1_11: "Nachdem Sie einen Pickel ausgedrückt haben, füllt sich derselbe Bereich innerhalb von Stunden wieder",
    C1_12: "Ihr Gesicht ist in den letzten Monaten im Vergleich zu früher deutlich öliger geworden",
    C1_13: "Eine stressige Woche macht sich fast immer innerhalb weniger Tage auf Ihrer Haut bemerkbar",
    C1_14: "Aufenthalte in der Sonne machen Ihre Haut im Nachhinein anfälliger für Unreinheiten",
    C1_15: "Sie bekommen auch am Rücken, auf der Brust oder den Schultern Unreinheiten — nicht nur im Gesicht",

    // Cat 2
    C2_01: "Bereits zur Mittagszeit glänzt Ihr Gesicht, selbst wenn Sie es am Morgen gewaschen haben",
    C2_02: "Ihre Stirn und Nase fetten viel schneller nach als Ihre Wangen",
    C2_03: "Ihre Haut fühlt sich innerhalb von 2 Stunden nach dem Waschen wieder ölig an",
    C2_04: "Ihre Foundation beginnt 3–4 Stunden nach dem Auftragen zu bröckeln oder zu verrutschen",
    C2_05: "Nach dem Auftragen sehen Sie winzige Foundation-Pünktchen in Ihren Poren stecken",
    C2_06: "Ihr Cushion oder flüssiges Make-up pillt (krümelt) oder rutscht auf der Haut herum",
    C2_07: "Ihre Haut sieht an der Oberfläche ölig aus, spannt sich darunter aber trocken an",
    C2_08: "Ihr Hautton wirkt fahl, wenn er ölig ist, als hätte er sein natürliches Strahlen verloren",
    C2_09: "Löschpapier (Blotting Paper) oder Puder halten den Glanz für nur 30 Minuten oder weniger ab",
    C2_10: "Ihr Make-up oxidiert und wird bis zum Abend eine Nuance dunkler",
    C2_11: "Der Bereich um Nase und Wangen ist stets der Ort, an dem Make-up zuerst verschwindet",
    C2_12: "Primer und porenverfeinernde Produkte verlieren innerhalb weniger Stunden ihre Wirkung",
    C2_13: "Ihre Haut ist im Sommer dramatisch öliger als im Winter",
    C2_14: "Ihre Stirn glänzt sichtbar, während Ihre Wangen sich noch trocken oder angespannt anfühlen",
    C2_15: "Ihr Unteraugen-Concealer rutscht bis zum Abend in feine Linien oder verblasst",

    // Cat 3
    C3_01: "Ihre Haut spannt sich innerhalb von Sekunden nach dem Waschen unangenehm",
    C3_02: "Ihre Feuchtigkeitspflege scheint innerhalb von 1–2 Stunden zu verschwinden und die Haut fühlt sich wieder trocken an",
    C3_03: "Sie können förmlich trockene Hautschüppchen auf Ihrem Gesicht abstehen sehen",
    C3_04: "Ihre Foundation bricht, flockt ab oder setzt sich im Laufe des Tages an trockenen Stellen ab",
    C3_05: "Ihre Haut sieht flach und müde aus — sie hat ihr natürliches Strahlen verloren",
    C3_06: "Feine Linien um Augen oder Mund werden deutlich tiefer, wenn Ihre Haut trocken ist",
    C3_07: "Die Haut um Ihre Augen und Lippen ist immer die trockenste Stelle im gesamten Gesicht",
    C3_08: "Ihre Lippenkontur reißt häufig ein, besonders in den Mundwinkeln",
    C3_09: "Ihre Haut wird im Winter, in klimatisierten Räumen oder beheizten Bereichen merklich trockener",
    C3_10: "Tuchmasken fühlen sich während der Anwendung toll an, aber die Feuchtigkeit verfliegt innerhalb einer Stunde",
    C3_11: "Ihr Gesicht fühlt sich morgens gleich nach dem Aufwachen starr und gespannt an, bevor Sie Produkte auftragen",
    C3_12: "Sie benötigen 3 oder mehr Schichten an Feuchtigkeitsprodukten, bevor sich Ihre Haut normal anfühlt",
    C3_13: "Ihre Haut saugt Feuchtigkeit sofort auf, fühlt sich aber sehr schnell wieder trocken an",
    C3_14: "Ihre Haut sieht dünn aus und Sie können winzige Blutgefäße nahe der Oberfläche erkennen",
    C3_15: "Auf Langstreckenflügen oder in trockener Umgebung spannt Ihre Haut bereits nach 30 Minuten spürbar",

    // Cat 4
    C4_01: "Ihr Gesicht rötet sich schnell — bei Verlegenheit, scharfem Essen oder in warmen Räumen",
    C4_02: "Ihr Gesicht ist direkt nach dem Waschen oder Reinigen sichtbar gerötet",
    C4_03: "Ihre Haut brennt oder sticht beim Auftragen bestimmter Produkte",
    C4_04: "Nach einem Peeling bleibt Ihre Haut tagelang gereizt oder empfindlich",
    C4_05: "Säuren wie AHA, BHA oder Vitamin-C-Seren hinterlassen ein Kribbeln oder Brennen",
    C4_06: "Retinol- oder Retinoidprodukte verursachen merkliches Schälen oder Brennen",
    C4_07: "Ihre Haut reagiert sichtbar beim Wechsel von Kalt zu Warm oder umgekehrt",
    C4_08: "Kaltes, windiges Wetter rötet Ihre Wangen oder Nase augenblicklich",
    C4_09: "Nach dem Sport oder bei großer Hitze hält die Gesichtsrötung länger als 30 Minuten an",
    C4_10: "Stress oder innere Unruhe zeigen sich durch ein sichtbar rotes oder erhitztes Gesicht",
    C4_11: "Sie sind nervös beim Ausprobieren neuer Produkte, da Ihre Haut oft abstoßend reagiert",
    C4_12: "Produkte mit Duftstoffen oder Alkohol machen Ihre Haut sofort rot oder juckend",
    C4_13: "Ihre Haut juckt häufig, auch ohne ersichtlichen Grund",
    C4_14: "Ihre Haut ist gleichzeitig rot und trocken — beides scheint parallel aufzutreten",
    C4_15: "Sie bemerken feine, spinnenartige rote Äderchen auf den Wangen oder an der Nase",

    // Cat 5
    C5_01: "Dunkle Flecken in Ihrem Gesicht scheinen mit der Zeit tiefer oder auffälliger zu werden",
    C5_02: "Sie haben braune Flecken auf Wangen oder Stirn, die selbst bei regelmäßiger Pflege nicht verblassen",
    C5_03: "Dunkle Markierungen alter Unreinheiten sind noch Monate nach der Heilung sichtbar",
    C5_04: "Ihr Hautbild wirkt unregelmäßig — manche Stellen sind dunkler als andere",
    C5_05: "Ihr Gesicht sieht fahl und flach aus, als fehle die natürliche Leuchtkraft",
    C5_06: "Schon kurze Sonneneinstrahlung macht Ihre Haut sichtbar dunkler oder ungleichmäßiger",
    C5_07: "Der Bereich neben der Nase oder um den Mund ist dunkler als der Rest des Gesichts",
    C5_08: "Ihre dunklen Augenringe haben eher einen bräunlichen Ton statt purpurroten Schatten",
    C5_09: "Ihre Haut weist einen grauen oder gelblichen Schleier auf, der sie müde erscheinen lässt",
    C5_10: "Selbst mit Make-up wirkt Ihre Haut oft matt und lässt ein gesundes Strahlen vermissen",
    C5_11: "Es besteht ein merklicher Farbunterschied zwischen Ihrem Gesicht und dem Hals",
    C5_12: "Die Gesichtsmitte (Nase und Wangen) sieht rötlicher oder dunkler aus als die Ränder",
    C5_13: "Die Anzahl an dunklen Flecken in Ihrem Gesicht nimmt mit der Zeit sichtbar zu",
    C5_14: "Pigmentierungen entstanden oder verschlimmerten sich während einer Schwangerschaft oder unter hormoneller Medikation",
    C5_15: "Ihre Haut bräunt oder dunkelt wesentlich schneller als bei Personen in derselben Sonne",

    // Cat 6
    C6_01: "Wenn Sie in den Spiegel schauen, sehen Sie Ihre Poren klar und deutlich ohne heranzuzoomen",
    C6_02: "Die Poren auf der Nase sind besonders groß und leicht erkennbar",
    C6_03: "Die Poren auf den Wangen wirken gedehnt oder langgezogen, wie vertikale Ovale",
    C6_04: "Ihre Poren sehen dunkel oder verstopft aus, als befänden sich winzige graue/schwarze Punkte darin",
    C6_05: "Wenn Sie Foundation auftragen, sinkt sie in Poren ein und lässt diese noch größer erscheinen",
    C6_06: "Wenn Sie mit dem Finger über die Wange streichen, fühlt sie sich eher rau als glatt an",
    C6_07: "Ihre Hautoberfläche hat kleine Unebenheiten, die in der Profilansicht sichtbar sind",
    C6_08: "Andere Menschen können die Unregelmäßigkeiten Ihrer Haut von der Seite aus wahrnehmen",
    C6_09: "Ihre Haut fühlt sich an, als läge eine Schicht obenauf, die das Reinigen nicht entfernt",
    C6_10: "Auf Fotos ist Ihre Hautstruktur stark sichtbar — insbesondere bei Tageslicht",
    C6_11: "Selbst kurz nach dem Waschen sehen Ihre Poren noch unrein oder verstopft aus",
    C6_12: "Wenn Sie die Nase berühren, spüren Sie harte Zäpfchen (Mitesser) in den Poren",
    C6_13: "Unter bestimmten Lichtwinkeln wirkt Ihre Hautstruktur deutlich schlechter",
    C6_14: "Ihre Poren werden viel auffälliger, sobald Sie Make-up tragen, nicht weniger",
    C6_15: "Ihre Haut war früher weicher — die Textur hat sich in den letzten 1–2 Jahren sichtbar verschlechtert",

    // Cat 7
    C7_01: "Feine Linien um die Augen sind im letzten Jahr deutlicher geworden",
    C7_02: "Lachfalten bleiben beim Entspannen des Gesichts noch einen Moment sichtbar",
    C7_03: "Die Linien von Nasenflügeln zu Mundwinkeln (Nasolabialfalten) werden tiefer",
    C7_04: "Sie bemerken zunehmend horizontale Linienbildungen am Hals",
    C7_05: "Ihre Kieferkontur wirkt weicher als früher — die scharfe Linie verblasst",
    C7_06: "Wenn Sie sanft auf die Wange drücken, federt die Haut nicht mehr so schnell zurück",
    C7_07: "Ihr Gesicht wirkt absteigend — es scheint alles tiefer zu sitzen als früher",
    C7_08: "Ihre Haut wird dünner und fühlt sich zarter und fragiler an als zuvor",
    C7_09: "Ihre Poren scheinen größer zu werden, während die Haut an Festigkeit verliert",
    C7_10: "Ihr Make-up setzt sich am Ende des Tages intensiv in feinen Linien und Falten ab",
    C7_11: "Ihr Gesicht wirkt weniger prall und jugendlich als noch vor einigen Jahren",
    C7_12: "Im Seitenprofil wirken Ihre Gesichtskonturen tieferliegend (gefallen)",
    C7_13: "Wenn Sie sanft in die Wangenhaut kneifen, fühlt sie sich lose an und bietet keinen Widerstand",
    C7_14: "Betrachten Sie das Telefon von oben herab, zeigt sich mittlerweile ein deutliches Doppelkinn",
    C7_15: "Horizontale Stirnfalten sind auch ohne Hochziehen der Augenbrauen dauerhaft zu sehen",
    C7_16: "Im Vergleich zu Fotos von vor 1–2 Jahren sehen Ihre Konturen auffällig anders aus",

    // Cat 8
    C8_01: "Produkte, die bisher gut funktionierten, brennen, stechen oder irritieren plötzlich",
    C8_02: "Ihre Haut ist insgesamt reaktiver und wird von Dingen gereizt, die sie früher tolerierte",
    C8_03: "Sie haben gleichzeitig Rötungen, extreme Trockenheit und Unreinheiten",
    C8_04: "Ein Produktwechsel brachte Ihre Haut für Tage oder gar Wochen komplett aus dem Gleichgewicht",
    C8_05: "Ihre Haut kommt nie völlig zur Ruhe — sie schwankt ständig und ist instabil",
    C8_06: "Nach einem Peeling benötigt Ihre Haut mehrere Tage, um sich wieder normal anzufühlen",
    C8_07: "Eine professionelle Behandlung (Fruchtsäure, Laser) hinterließ Ihre Haut extrem reaktiv",
    C8_08: "Sie haben das Gefühl, die Schutzfunktion der Haut ist beschädigt — sie wirkt offen und ungeschützt",
    C8_09: "Schon Wasser, Wind oder ein sauberes Handtuch können ein Stechen/Brennen auslösen",
    C8_10: "Ihre Haut speichert scheinbar keine Feuchtigkeit mehr — alles verdunstet sofort",
    C8_11: "Ihre Wangen erhitzen sich rasch wegen Kleinigkeiten, z.B. bei einem warmen Getränk",
    C8_12: "Sie haben Ihre Haut in letzter Zeit häufig gepeelt oder stark gerubbelt",
    C8_13: "Sie benötigen mindestens 4 Schichten Pflege, ehe sich das Gesicht nicht mehr unangenehm anfühlt",
    C8_14: "Seren und Cremes scheinen lediglich aufzuliegen, statt tief einzuziehen",
    C8_15: "Innerhalb von 30 Sekunden nach der Reinigung, noch bevor Sie Produkte auftragen, spannt sie extrem",
};

// META QUESTIONS
const metaDict = {
    "flush_30min": "Bleibt die Rötung länger als 30 Minuten bestehen?",
    "central_face": "Konzentriert sich die Rötung auf die Gesichtsmitte (Nase, Wangen)?",
    "exfoliation_2w": "Wie häufig haben Sie in den letzten 2 Wochen ein Peeling angewendet?",
    "new_actives": "Haben Sie kürzlich neue Wirkstoffe in Ihre Routine eingeführt?",
    "premenstrual_7_10d": "Treten Unreinheiten vorwiegend 7–10 Tage vor der Menstruation auf?",
    "jaw_focus": "Sind Ausbrüche spezifisch entlang der Kieferpartie konzentriert?"
};

const patternDict = {
    "PATTERN_BARRIER_TRIAD": { name: "Geschädigte Hautbarriere-Triade", clinical: "Gleichzeitige Rötung, Trockenheit und Unreinheiten weisen auf eine Sensibilisierung und einen Ceramid-Untergang hin. Ein Aufbau der Barriere hat oberste Priorität." },
    "PATTERN_HORMONAL_ACNE": { name: "Hormonelle Akne-Kaskade", clinical: "Zyklische Akne an Kiefer, Wangen und Stirn weist auf hormonelle Dysbalancen hin. Niacinamid + Talg-regulierende Protokolle empfohlen." },
    "PATTERN_DEHYDRATED_OILY": { name: "Ölig-Dehydriertes Muster", clinical: "Ölige Oberfläche bei gleichzeitig trockener Unterhaut. Zeigt eine verstärkte Talgproduktion durch Feuchtigkeitsverlust im Stratum Corneum. Ein Feuchtigkeitsprotokoll ist zwingend, gefolgt von der Talgkontrolle." },
    "PATTERN_PHOTOAGING": { name: "Photooxidatives Alterungsmuster", clinical: "Starke post-UV Pigmentierung im Komplex mit zunehmendem Melasma zeigt eine beschleunigte Photoalterung. Vitamin C + Retinal + chemischer/physischer LSF 50+ zwingend." },
    "PATTERN_COUPEROSE": { name: "Vaskuläre Hyperreaktivität (Couperose)", clinical: "Sichtbare Kapillaren bei persistierendem Flush signalisieren Couperose oder Rosazea Typ I (Erythematös). Thermische Trigger meiden. Azelainsäure + Niacinamide lindern." },
    "PATTERN_SEVERE_ACNE": { name: "Schwere inflammatorische Akne", clinical: "Gleichzeitiges Auftreten von Knoten und Zysten der Akne (IGA Grad 3+). Eine dermatologische Abklärung wird stark empfohlen. Sanftes BHA sowie barriereschützende Begleitstoffe nutzen." },
    "PATTERN_AGING_TRIAD": { name: "Beschleunigte Alterungstriade", clinical: "Kombinierter Verlust von Elastizität und Tiefe der Falten sowie allgemeiner Volumenverlust deuten auf ECM-Abbau hin. Anti-Aging 4-stufig: Retinal + Peptide + Kollagen-Booster + Antioxidantien." },
    "PATTERN_OVER_EXFOLIATION": { name: "Über-Exfoliations-Syndrom", clinical: "Wiederkehrende physische/chemische Reizung mit mangelnder Recovery signalisiert schweren Stratum Corneum-Verlust. Alle aktiven Wirkstoffe aussetzen! Nur Panthenol und Ceramide nutzen." }
};

const categoryInfoDict = {
    1: { name: "Unreinheiten & Akne", clinical: "Indikatoren für Talgdysregulationen und follikuläre Entzündungen" },
    2: { name: "Öligkeit & Make-up Stabilität", clinical: "Talgüberproduktion und deren Effekt auf die kosmetische Stabilität" },
    3: { name: "Trockenheit & Dehydration", clinical: "Transepidermaler Wasserverlust (TEWL) und NMF-Verarmungsmuster" },
    4: { name: "Sensibilität & Rötungen", clinical: "Neurogene Entzündung, vaskuläre Blutreaktivität und Schwächung der Toleranz" },
    5: { name: "Pigmentierung & Hautton", clinical: "Melanozyten-Hyperaktivität, toxischer Stress und Photodamage-Muster" },
    6: { name: "Poren & Textur", clinical: "Follikuläre Dilatation (Vergrößerung), Verhornungsstörungen und raue Oberfläche" },
    7: { name: "Falten & Elastizität", clinical: "Kollagenverfall, Elastizitätsabbau und gravitative Veranderungen des Gewebes" },
    8: { name: "Barriere & Regeneration", clinical: "Integrität des Stratum Corneum, Erholungskapazität und Sensibilisierungsgrad" },
};

// Replace Category Info names and clinical descriptions
for (const [key, val] of Object.entries(categoryInfoDict)) {
    const regName = new RegExp(`(${key}: { emoji: ".*", name: ".*)", clinical: "(.*)" }`, 'g');
    code = code.replace(regName, `$1", name_de: "${val.name}", clinical: "$2", clinical_de: "${val.clinical}" }`);
}

// Replace SYMPTOMS text_en -> text_en + text_de
for (const [symptomId, germanTranslation] of Object.entries(translationDict)) {
    const regex = new RegExp(`(id: "${symptomId}", text_en: "[^"]*")`);
    code = code.replace(regex, `$1, text_de: "${germanTranslation}"`);
}

// Replace META QUESTIONS text_en -> text_en + text_de
for (const [metaId, germanTranslation] of Object.entries(metaDict)) {
    const regex = new RegExp(`(id: "${metaId}",\\s*text_en: "[^"]*")`);
    code = code.replace(regex, `$1, text_de: "${germanTranslation}"`);
}

// Replace HIGH RISK PATTERNS name_en, clinical_en -> + _de
for (const [patternId, dict] of Object.entries(patternDict)) {
    // Add name_de
    const regexName = new RegExp(`(id: "${patternId}",\\s*name_en: "[^"]*")`);
    code = code.replace(regexName, `$1, name_de: "${dict.name}"`);

    // Add clinical_de
    const startIdx = code.indexOf(`id: "${patternId}"`);
    if (startIdx !== -1) {
        // Find clinical_en in that block
        const blockEnd = code.indexOf(`},`, startIdx);
        const block = code.substring(startIdx, blockEnd);
        const modBlock = block.replace(/(clinical_en: "[^"]*")/, `$1,\n    clinical_de: "${dict.clinical}"`);
        code = code.substring(0, startIdx) + modBlock + code.substring(blockEnd);
    }
}

fs.writeFileSync(weightsPath, code, 'utf8');
console.log('Injected DE Translations successfully into weights.ts!');
