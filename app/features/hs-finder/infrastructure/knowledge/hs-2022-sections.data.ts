export interface HsSubsection {
  id: string;
  number: string;
  text: string;
  source: HsSectionSource | null;
  status: "validated";
}

interface HsSectionSource {
  authority: string;
  regulation: string;
  attachment: string;
  documentUrl: string;
  effectiveFrom: string;
  pdfPage: number;
  reference: string;
}

export interface HsSection {
  id: string;
  number: string;
  ordinal: number;
  title: string;
  chapters: readonly string[];
  reservedChapters?: readonly string[];
  legalNotes: readonly HsSubsection[];
  navigation: {
    keywords: readonly string[];
    redirects: readonly string[];
  };
  status: "validated" | "draft";
  noteCoverage: "complete" | "not_started";
  source: HsSectionSource | null;
}

interface ReviewedSection {
  pdfPage: number;
  legalNotes: readonly Omit<HsSubsection, "source" | "status">[];
  keywords: readonly string[];
}
const sectionSource = Object.freeze({
  authority: "Kementerian Keuangan Republik Indonesia",
  regulation: "26/PMK.010/2022",
  attachment: "II",
  documentUrl: "https://jdih.kemenkeu.go.id/dok/26-pmk-010-2022/files",
  effectiveFrom: "2022-04-01",
});

const reviewedSections: Readonly<Record<string, ReviewedSection>> = {
  I: {
    pdfPage: 10,
    legalNotes: [
      {
        id: "HS2022-SECTION-I-NOTE-1",
        number: "1",
        text: "Setiap referensi mengenai genus atau spesies binatang tertentu dalam Bagian ini, kecuali apabila konteksnya menentukan lain, juga meliputi anak binatang dari genus atau spesies tersebut.",
      },
      {
        id: "HS2022-SECTION-I-NOTE-2",
        number: "2",
        text: "Kecuali apabila konteksnya menentukan lain, setiap referensi untuk produk \"dikeringkan\" dalam Nomenklatur ini, juga meliputi produk yang telah didehidrasi, dievaporasi atau dibeku-keringkan.",
      },
    ],
    keywords: ["binatang", "hewan", "ikan", "daging", "susu", "telur", "madu", "genus", "spesies", "dikeringkan", "didehidrasi", "dievaporasi", "dibeku-keringkan"],
  },
  II: {
    pdfPage: 16,
    legalNotes: [
      {
        id: "HS2022-SECTION-II-NOTE-1",
        number: "1",
        text: "Dalam Bagian ini istilah \"pelet\" berarti produk yang telah diaglomerasi secara langsung dengan pengompresian atau dengan penambahan pengikat dalam proporsi yang tidak melebihi 3 % menurut beratnya.",
      },
    ],
    keywords: ["nabati", "tanaman", "sayuran", "buah", "kopi", "teh", "serealia", "biji", "getah", "pelet", "aglomerasi", "pengompresian", "pengikat"],
  },
  III: { pdfPage: 27, legalNotes: [], keywords: ["lemak", "minyak", "hewani", "nabati", "mikroba", "malam", "wax"] },
  IV: {
    pdfPage: 29,
    legalNotes: [
      {
        id: "HS2022-SECTION-IV-NOTE-1",
        number: "1",
        text: "Dalam Bagian ini istilah \"pelet\" berarti produk yang telah diaglomerasi secara langsung dengan pengompresian atau dengan penambahan pengikat dalam perbandingan tidak melebihi 3 % menurut beratnya.",
      },
    ],
    keywords: ["olahan", "makanan", "minuman", "alkohol", "cuka", "tembakau", "nikotin", "gula", "kakao", "roti", "saus", "pelet", "aglomerasi"],
  },
  V: { pdfPage: 40, legalNotes: [], keywords: ["produk mineral", "garam", "belerang", "tanah", "batu", "bijih", "bahan bakar mineral"] },
};

export const sections: readonly HsSection[] = [
  {id:"HS2022-SECTION-I",number:"I",ordinal:1,title:"Live animals; animal products",chapters:["01","02","03","04","05"]},
  {id:"HS2022-SECTION-II",number:"II",ordinal:2,title:"Vegetable products",chapters:["06","07","08","09","10","11","12","13","14"]},
  {id:"HS2022-SECTION-III",number:"III",ordinal:3,title:"Animal, vegetable or microbial fats and oils and their cleavage products; prepared edible fats; animal or vegetable waxes",chapters:["15"]},
  {id:"HS2022-SECTION-IV",number:"IV",ordinal:4,title:"Prepared foodstuffs; beverages, spirits and vinegar; tobacco and manufactured tobacco substitutes; products containing nicotine",chapters:["16","17","18","19","20","21","22","23","24"]},
  {id:"HS2022-SECTION-V",number:"V",ordinal:5,title:"Mineral products",chapters:["25","26","27"]},
  {id:"HS2022-SECTION-VI",number:"VI",ordinal:6,title:"Products of the chemical or allied industries",chapters:["28","29","30","31","32","33","34","35","36","37","38"]},
  {id:"HS2022-SECTION-VII",number:"VII",ordinal:7,title:"Plastics and articles thereof; rubber and articles thereof",chapters:["39","40"]},
  {id:"HS2022-SECTION-VIII",number:"VIII",ordinal:8,title:"Raw hides and skins, leather, furskins and articles thereof; saddlery and harness; travel goods and similar containers; articles of animal gut",chapters:["41","42","43"]},
  {id:"HS2022-SECTION-IX",number:"IX",ordinal:9,title:"Wood and articles of wood; wood charcoal; cork and articles of cork; manufactures of straw and other plaiting materials; basketware and wickerwork",chapters:["44","45","46"]},
  {id:"HS2022-SECTION-X",number:"X",ordinal:10,title:"Pulp of wood or other fibrous cellulosic material; recovered paper or paperboard; paper and paperboard and articles thereof",chapters:["47","48","49"]},
  {id:"HS2022-SECTION-XI",number:"XI",ordinal:11,title:"Textiles and textile articles",chapters:["50","51","52","53","54","55","56","57","58","59","60","61","62","63"]},
  {id:"HS2022-SECTION-XII",number:"XII",ordinal:12,title:"Footwear, headgear, umbrellas, walking-sticks, whips and parts thereof; prepared feathers; artificial flowers; articles of human hair",chapters:["64","65","66","67"]},
  {id:"HS2022-SECTION-XIII",number:"XIII",ordinal:13,title:"Articles of stone, plaster, cement, asbestos, mica or similar materials; ceramic products; glass and glassware",chapters:["68","69","70"]},
  {id:"HS2022-SECTION-XIV",number:"XIV",ordinal:14,title:"Natural or cultured pearls, precious or semi-precious stones, precious metals and articles thereof; imitation jewellery; coin",chapters:["71"]},
  {id:"HS2022-SECTION-XV",number:"XV",ordinal:15,title:"Base metals and articles of base metal",chapters:["72","73","74","75","76","78","79","80","81","82","83"],reservedChapters:["77"]},
  {id:"HS2022-SECTION-XVI",number:"XVI",ordinal:16,title:"Machinery and mechanical appliances; electrical equipment; parts thereof; sound and television recording and reproducing equipment",chapters:["84","85"]},
  {id:"HS2022-SECTION-XVII",number:"XVII",ordinal:17,title:"Vehicles, aircraft, vessels and associated transport equipment",chapters:["86","87","88","89"]},
  {id:"HS2022-SECTION-XVIII",number:"XVIII",ordinal:18,title:"Optical, photographic, measuring, medical or surgical instruments; clocks and watches; musical instruments; parts and accessories thereof",chapters:["90","91","92"]},
  {id:"HS2022-SECTION-XIX",number:"XIX",ordinal:19,title:"Arms and ammunition; parts and accessories thereof",chapters:["93"]},
  {id:"HS2022-SECTION-XX",number:"XX",ordinal:20,title:"Miscellaneous manufactured articles",chapters:["94","95","96"]},
  {id:"HS2022-SECTION-XXI",number:"XXI",ordinal:21,title:"Works of art, collectors' pieces and antiques",chapters:["97"]},
].map((section): HsSection => {
  const reviewed: ReviewedSection | undefined = reviewedSections[section.number];
  const source = reviewed
    ? { ...sectionSource, pdfPage: reviewed.pdfPage, reference: `Bagian ${section.number}` }
    : null;

  return {
    legalNotes: (reviewed?.legalNotes ?? []).map((note): HsSubsection => ({
      ...note,
      source,
      status: "validated",
    })),
    navigation: { keywords: reviewed?.keywords ?? [], redirects: [] },
    status: reviewed ? "validated" : "draft",
    noteCoverage: reviewed ? "complete" : "not_started",
    source,
    ...section,
  };
});

export default sections;
