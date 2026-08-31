export interface CraftsmanshipVideo {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration?: string;
}

const CATEGORIES = [
  'MELTING & CASTING UNIT',
  'SILVER IDOLS & MANDIR ITEMS',
  'DINING & POOJA TABLEWARE',
  'SPECTROMETER & QUALITY TESTING',
  'SILVER WIRE & SHEET ROLLING',
  'HAND ENGRAVING & FILIGREE',
  'BUFFING & POLISHING ATELIER',
  'SILVER COIN & BULLION MINTING',
];

const THUMBNAILS = [
  'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Floral%20Engraved%20Silver%20Pooja%20Thali%20Set.webp',
  'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Royal%20Floral%20Crest%20Silver%20Serving%20Tray.webp',
  'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Elegant%20Silver%20Lakshmi%20Devi%20Idol%20with%20Ornate%20Arch.webp',
  'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Shree%20Divya%20Silver%20Masala%20Box%20Set.webp',
  'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Ornate%20Silver%20Diya%20Lamp%20Pair.webp',
];

const SAMPLE_MP4_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnTheSpot.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

const SPECIFIC_VIDEOS: CraftsmanshipVideo[] = [
  {
    id: 'vid-1',
    code: '#6Z1A1790',
    title: 'Induction Furnace Silver Melting & Casting',
    category: 'MELTING & CASTING UNIT',
    description: 'Unscripted footage of induction furnace silver melting at our Tenali silver manufacturing plant.',
    thumbnail: THUMBNAILS[0],
    videoUrl: SAMPLE_MP4_URLS[0],
    duration: '0:48',
  },
  {
    id: 'vid-2',
    code: '#6Z1A1823',
    title: 'Silver Kalash & Diya Polishing Process',
    category: 'SILVER IDOLS & MANDIR ITEMS',
    description: 'Unscripted footage of silver kalash & diya polishing at our Tenali silver manufacturing plant.',
    thumbnail: THUMBNAILS[1],
    videoUrl: SAMPLE_MP4_URLS[1],
    duration: '1:12',
  },
  {
    id: 'vid-3',
    code: '#6Z1A1842',
    title: 'High Precision Laser Engraving & Stamping',
    category: 'DINING & POOJA TABLEWARE',
    description: 'Unscripted footage of high precision laser engraving at our Tenali silver manufacturing plant.',
    thumbnail: THUMBNAILS[2],
    videoUrl: SAMPLE_MP4_URLS[2],
    duration: '0:55',
  },
  {
    id: 'vid-4',
    code: '#6Z1A1878',
    title: 'Spectrometer Silver Purity Testing',
    category: 'SPECTROMETER & QUALITY TESTING',
    description: 'Unscripted footage of XRF spectrometer silver purity testing at our Tenali silver manufacturing plant.',
    thumbnail: THUMBNAILS[3],
    videoUrl: SAMPLE_MP4_URLS[3],
    duration: '1:05',
  },
];

const TITLES_BY_CATEGORY: Record<string, string[]> = {
  'MELTING & CASTING UNIT': [
    'Continuous Casting Silver Ingot Production',
    'Vacuum Pressure Casting for Fine Sculptures',
    'Crucible Silver Pouring & Molten Flow',
    'Thermal Gradient Annealing of Silver Bars',
    'Induction Furnace Temperature Control & Slag Removal',
    'Centrifugal Casting of Intricate Pooja Ornaments',
    'High Purity 999 Fine Silver Grain Melting',
    'Molten Silver Degassing & Homogenization',
  ],
  'SILVER IDOLS & MANDIR ITEMS': [
    'Hand Sculpting 999 Fine Silver Lakshmi Idol',
    'Silver Kalash Mirror Finishing & Electro-Buffing',
    'Intricate Nakshi Carving on Mandir Archways',
    'Silver Kamatchi Amman Diya Assembly',
    'Silver Puja Thali Edge Beading & Embossing',
    'Sacred Silver Simhasanam Crown Fitting',
    'Traditional South Indian Temple Bell Casting',
    'Hand Polishing Silver Ganesha Idol Details',
  ],
  'DINING & POOJA TABLEWARE': [
    'Precision Hydro-Forming Silver Tumbler Set',
    'Royal Silver Dinner Plate Mirror Polishing',
    'Traditional Silver Bowl Edge Filigree Moulding',
    'Sterling Silver Tea Set Handle Soldering',
    'Silver Panchapatram Chasing & Engraving',
    'Custom Embossed Silver Cutlery Finishing',
    'Silver Decorative Tray Border Stamping',
    'Micro-Lap Polishing for Luxury Silver Tableware',
  ],
  'SPECTROMETER & QUALITY TESTING': [
    'XRF Metallurgical Purity Analysis of 999 Bullion',
    'NABL Assay Office Fire Assay Verification',
    'Ultrasonic Density Inspection of Silver Ingots',
    'Surface Micro-Hardness Testing on Sterling Tableware',
    'Laser Spectrograph Assay Certification Run',
    'Chemical Wet Titration Purity Verification',
    'X-Ray Fluorescence Scan on Custom Pooja Items',
    'Quality Seal Stamping & Hallmark Verification',
  ],
  'SILVER WIRE & SHEET ROLLING': [
    'Heavy-Duty Rolling Mill Sheet Flattening',
    'Precision Wire Drawing for Filigree Craft',
    'Cold Rolling Silver Strip Gauge Calibration',
    'Seamless Silver Tube Extrusion Process',
    'Hydraulic Press Stamping of Silver Coins',
    'Annealing Silver Sheet in Inert Gas Furnace',
    'Micro Wire Spooling for Temple Adornments',
    'Automated Silver Foil Thickness Measuring',
  ],
  'HAND ENGRAVING & FILIGREE': [
    'Master Artisan Nakshi Chasing on Silver Vessel',
    'Hand Crafted Filigree Thread Weaving',
    'Traditional Chisel Stippling on Temple Doors',
    'Bespoke Floral Motif Engraving on Silver Tray',
    'Repoussé Technique Hand Hammering',
    'Precision Gem Setting in Pure Silver Idol',
    'Traditional South Indian Antique Oxidization Finish',
    'Hand Stamped Geometric Patterns on Pooja Articles',
  ],
  'BUFFING & POLISHING ATELIER': [
    'High-RPM Cotton Wheel Mirror Buffing',
    'Ultrasonic Bath Cleansing of Engraved Silverware',
    'Rotary Barrel Polishing of Small Silver Beads',
    'Anti-Tarnish Micro-Coating Application',
    'Electrolytic Degreasing & Final Shine Finish',
    'Satin Matt Finish Application on Contemporary Silver',
    'Hand Felt Wheel Finishing on Idol Curves',
    'Final Quality Inspection Under Polarized Light',
  ],
  'SILVER COIN & BULLION MINTING': [
    'Precision Hydraulic Minting of 999 Fine Silver Coins',
    'Laser Engraving Serial Numbers on Bullion Bars',
    'Tamper-Proof Blister Packaging of Silver Coins',
    'Custom Corporate Logo Stamping on 100g Bar',
    'High-Speed Coin Blank Rim Proofing',
    'Proof-Finish Mirror Polish Minting Die Preparation',
    'Automated Weight Inspection & Assayer Packing',
    '999 Pure Silver Bar Surface Grain Inspection',
  ],
};

// Generate exactly 171 craftsmanship videos
export const CRAFTSMANSHIP_VIDEOS: CraftsmanshipVideo[] = (() => {
  const list: CraftsmanshipVideo[] = [...SPECIFIC_VIDEOS];
  let codeNum = 1890;

  for (let i = SPECIFIC_VIDEOS.length; i < 171; i++) {
    const catIndex = i % CATEGORIES.length;
    const category = CATEGORIES[catIndex];
    const catTitles = TITLES_BY_CATEGORY[category];
    const titleIndex = Math.floor(i / CATEGORIES.length) % catTitles.length;
    const title = catTitles[titleIndex];
    const thumbnail = THUMBNAILS[i % THUMBNAILS.length];
    const videoUrl = SAMPLE_MP4_URLS[i % SAMPLE_MP4_URLS.length];
    const code = `#6Z1A${codeNum}`;
    codeNum += 15;

    list.push({
      id: `vid-${i + 1}`,
      code,
      title,
      category,
      description: `Unscripted footage of ${title.toLowerCase()} at our Tenali silver manufacturing plant.`,
      thumbnail,
      videoUrl,
      duration: `${Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 50) + 10).padStart(2, '0')}`,
    });
  }

  return list;
})();
