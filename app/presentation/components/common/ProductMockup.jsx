"use client";

const MOCKUP_WIDTH = 648;
const MOCKUP_HEIGHT = 400;

function BrowserFrame({ children }) {
  return (
    <svg
      viewBox={`0 0 ${MOCKUP_WIDTH} ${MOCKUP_HEIGHT}`}
      className="h-auto w-full"
      fill="none"
      role="img"
      aria-label="Product screenshot mockup"
    >
      {/* Shadow */}
      <rect x={4} y={4} width={MOCKUP_WIDTH} height={MOCKUP_HEIGHT} rx={12} fill="#000" fillOpacity={0.08} />
      {/* Browser window */}
      <rect x={0} y={0} width={MOCKUP_WIDTH} height={MOCKUP_HEIGHT} rx={12} fill="#fff" stroke="#e4e4e7" strokeWidth={1} />
      {/* Title bar */}
      <rect x={0} y={0} width={MOCKUP_WIDTH} height={40} rx={12} fill="#fafafa" />
      <rect x={0} y={24} width={MOCKUP_WIDTH} height={16} fill="#fafafa" />
      {/* Window dots */}
      <circle cx={20} cy={20} r={5} fill="#ef4444" />
      <circle cx={38} cy={20} r={5} fill="#f59e0b" />
      <circle cx={56} cy={20} r={5} fill="#10b981" />
      {/* URL bar */}
      <rect x={88} y={13} width={320} height={16} rx={8} fill="#f4f4f5" />
      <text x={104} y={24} fontSize={9} fill="#a1a1aa" fontFamily="ui-monospace, monospace">
        https://pesisir.id/cek-lartas
      </text>
      {children}
    </svg>
  );
}

export function CekLartasMockup() {
  return (
    <BrowserFrame>
      {/* Header */}
      <text x={24} y={68} fontSize={10} fontWeight="700" fill="#0e7490" fontFamily="system-ui" letterSpacing="1.8">HASIL CEK LARTAS</text>
      <text x={24} y={84} fontSize={11} fill="#52525b" fontFamily="system-ui">
        <tspan fontWeight="700" fill="#18181b">3</tspan>
        <tspan fill="#71717a"> dari </tspan>
        <tspan fontWeight="700" fill="#18181b">12</tspan>
        <tspan fill="#71717a"> HS code terkena LARTAS.</tspan>
      </text>

      {/* Filter toggle pills */}
      <rect x={24} y={96} width={108} height={22} rx={999} fill="#0f172a" />
      <text x={34} y={111} fontSize={9} fontWeight="600" fill="#fff" fontFamily="system-ui">Hanya yang LARTAS</text>
      <rect x={140} y={96} width={100} height={22} rx={999} fill="none" stroke="#d4d4d8" strokeWidth={1} />
      <text x={150} y={111} fontSize={9} fontWeight="600" fill="#52525b" fontFamily="system-ui">Semua HS Code</text>

      {/* Table */}
      <rect x={24} y={130} width={600} height={2} rx={1} fill="#e4e4e7" />
      {/* Table header */}
      <text x={34} y={148} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">NO</text>
      <text x={74} y={148} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">HS CODE</text>
      <text x={164} y={148} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">DOK 20</text>
      <text x={244} y={148} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">DOK 30</text>
      <text x={324} y={148} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">DOK 40</text>
      <text x={404} y={148} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">DOK 50</text>

      {/* Row 1 */}
      <rect x={24} y={158} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={177} fontSize={11} fill="#52525b" fontFamily="system-ui">1</text>
      <text x={74} y={177} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="ui-monospace, monospace">3824.99.99</text>
      {/* Ada badge */}
      <rect x={160} y={164} width={52} height={18} rx={999} fill="url(#grad1)" />
      <text x={166} y={176} fontSize={9} fontWeight="600" fill="#fff" fontFamily="system-ui">Ada (2) ↗</text>
      <text x={244} y={177} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>
      <rect x={320} y={164} width={52} height={18} rx={999} fill="url(#grad1)" />
      <text x={326} y={176} fontSize={9} fontWeight="600" fill="#fff" fontFamily="system-ui">Ada (1) ↗</text>
      <text x={404} y={177} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>

      {/* Row 2 */}
      <rect x={24} y={186} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={205} fontSize={11} fill="#52525b" fontFamily="system-ui">2</text>
      <text x={74} y={205} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="ui-monospace, monospace">8471.70.20</text>
      <text x={160} y={205} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>
      <text x={244} y={205} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>
      <rect x={320} y={192} width={52} height={18} rx={999} fill="url(#grad1)" />
      <text x={326} y={204} fontSize={9} fontWeight="600" fill="#fff" fontFamily="system-ui">Ada (1) ↗</text>
      <text x={404} y={205} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>

      {/* Row 3 */}
      <rect x={24} y={214} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={233} fontSize={11} fill="#52525b" fontFamily="system-ui">3</text>
      <text x={74} y={233} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="ui-monospace, monospace">6204.62.00</text>
      <text x={160} y={233} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>
      <text x={244} y={233} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>
      <text x={320} y={233} fontSize={11} fill="#d4d4d8" fontFamily="system-ui">—</text>
      <rect x={400} y={220} width={52} height={18} rx={999} fill="url(#grad1)" />
      <text x={406} y={232} fontSize={9} fontWeight="600" fill="#fff" fontFamily="system-ui">Ada (3) ↗</text>

      {/* Row 4 */}
      <rect x={24} y={242} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={261} fontSize={11} fill="#52525b" fontFamily="system-ui">4</text>
      <text x={74} y={261} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="ui-monospace, monospace">8473.30.90</text>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="grad1" x1={0} y1={0} x2={1} y2={1}>
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
      </defs>
    </BrowserFrame>
  );
}

export function ShipmentMockup() {
  return (
    <BrowserFrame>
      {/* Dashboard widgets */}
      <rect x={24} y={56} width={120} height={56} rx={12} fill="#fafafa" stroke="#e4e4e7" strokeWidth={1} />
      <text x={34} y={77} fontSize={9} fontWeight="600" fill="#52525b" fontFamily="system-ui" letterSpacing="0.5">TOTAL SHIPMENTS</text>
      <text x={34} y={100} fontSize={20} fontWeight="700" fill="#18181b" fontFamily="system-ui">24</text>

      <rect x={158} y={56} width={120} height={56} rx={12} fill="#fef2f2" stroke="#fecaca" strokeWidth={1} />
      <text x={168} y={77} fontSize={9} fontWeight="600" fill="#ef4444" fontFamily="system-ui" letterSpacing="0.5">NEEDS ACTION</text>
      <text x={168} y={100} fontSize={20} fontWeight="700" fill="#dc2626" fontFamily="system-ui">7</text>

      <rect x={292} y={56} width={120} height={56} rx={12} fill="#f0f9ff" stroke="#bae6fd" strokeWidth={1} />
      <text x={302} y={77} fontSize={9} fontWeight="600" fill="#0284c7" fontFamily="system-ui" letterSpacing="0.5">ARRIVING THIS WEEK</text>
      <text x={302} y={100} fontSize={20} fontWeight="700" fill="#0369a1" fontFamily="system-ui">5</text>

      {/* Search bar */}
      <rect x={24} y={128} width={240} height={28} rx={10} fill="#fafafa" stroke="#e4e4e7" strokeWidth={1} />
      <text x={42} y={146} fontSize={10} fill="#a1a1aa" fontFamily="system-ui">🔍 Search by B/L, shipper...</text>

      {/* Table */}
      <rect x={24} y={172} width={600} height={2} rx={1} fill="#e4e4e7" />
      <text x={34} y={190} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">SHIPMENT #</text>
      <text x={120} y={190} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">B/L NUMBER</text>
      <text x={230} y={190} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">SHIPPER</text>
      <text x={350} y={190} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">ETA</text>
      <text x={440} y={190} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui" letterSpacing="0.5">STATUS</text>

      {/* Row 1 */}
      <rect x={24} y={200} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={219} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="system-ui">SHP-001</text>
      <text x={120} y={219} fontSize={11} fill="#52525b" fontFamily="system-ui">HDMUKIA1234567</text>
      <text x={230} y={219} fontSize={11} fill="#52525b" fontFamily="system-ui">PT Maju Jaya Abadi</text>
      <text x={350} y={219} fontSize={11} fill="#52525b" fontFamily="system-ui">12 Jun 2026</text>
      {/* Status badge - warning */}
      <rect x={436} y={208} width={72} height={20} rx={6} fill="#fffbeb" stroke="#fde68a" strokeWidth={1} />
      <text x={448} y={222} fontSize={9} fontWeight="600" fill="#d97706" fontFamily="system-ui">DOC PENDING</text>

      {/* Row 2 */}
      <rect x={24} y={228} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={247} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="system-ui">SHP-002</text>
      <text x={120} y={247} fontSize={11} fill="#52525b" fontFamily="system-ui">MSCUEA9876543</text>
      <text x={230} y={247} fontSize={11} fill="#52525b" fontFamily="system-ui">PT Bumi Sukses</text>
      <text x={350} y={247} fontSize={11} fill="#52525b" fontFamily="system-ui">15 Jun 2026</text>
      {/* Status badge - success */}
      <rect x={436} y={236} width={72} height={20} rx={6} fill="#f0fdf4" stroke="#bbf7d0" strokeWidth={1} />
      <text x={448} y={250} fontSize={9} fontWeight="600" fill="#16a34a" fontFamily="system-ui">ON TRACK</text>

      {/* Row 3 */}
      <rect x={24} y={256} width={600} height={1} fill="#f4f4f5" />
      <text x={34} y={275} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="system-ui">SHP-003</text>
      <text x={120} y={275} fontSize={11} fill="#52525b" fontFamily="system-ui">COSU5432167890</text>
      <text x={230} y={275} fontSize={11} fill="#52525b" fontFamily="system-ui">PT Indah Karya</text>
      <text x={350} y={275} fontSize={11} fill="#52525b" fontFamily="system-ui">10 Jun 2026</text>
      {/* Status badge - danger */}
      <rect x={436} y={264} width={72} height={20} rx={6} fill="#fef2f2" stroke="#fecaca" strokeWidth={1} />
      <text x={448} y={278} fontSize={9} fontWeight="600" fill="#dc2626" fontFamily="system-ui">OVERDUE</text>
    </BrowserFrame>
  );
}

export function BlScannerMockup() {
  return (
    <BrowserFrame>
      {/* Left panel: PDF viewer */}
      <rect x={16} y={52} width={296} height={330} rx={10} fill="#fafafa" stroke="#e4e4e7" strokeWidth={1} />
      <rect x={16} y={52} width={296} height={32} rx={10} fill="#f4f4f5" />
      <rect x={16} y={74} width={296} height={10} fill="#f4f4f5" />
      <text x={28} y={73} fontSize={9} fontWeight="600" fill="#52525b" fontFamily="system-ui">📄 BILL OF LADING — HDMUKIA1234567</text>
      {/* Fake PDF lines */}
      <rect x={28} y={96} width={272} height={2} rx={1} fill="#e4e4e7" />
      <rect x={28} y={108} width={160} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={122} width={200} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={136} width={80} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={152} width={240} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={166} width={180} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={182} width={100} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={198} width={220} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={214} width={140} height={6} rx={2} fill="#d4d4d8" />
      <rect x={28} y={230} width={260} height={6} rx={2} fill="#d4d4d8" />
      {/* Highlighted text (selected/copied) */}
      <rect x={28} y={250} width={180} height={16} rx={3} fill="#cffafe" />
      <text x={36} y={262} fontSize={9} fontWeight="600" fill="#0e7490" fontFamily="ui-monospace, monospace">HDMUKIA1234567</text>

      {/* Right panel: extracted form */}
      <rect x={328} y={52} width={304} height={330} rx={10} fill="#fff" stroke="#e4e4e7" strokeWidth={1} />
      <text x={342} y={76} fontSize={11} fontWeight="700" fill="#18181b" fontFamily="system-ui">Extracted Data</text>

      {/* Status indicator */}
      <rect x={342} y={88} width={276} height={24} rx={6} fill="#f0fdf4" stroke="#bbf7d0" strokeWidth={1} />
      <text x={352} y={104} fontSize={9} fill="#16a34a" fontFamily="system-ui">✓ Auto-filled from PDF</text>

      {/* Form fields */}
      <text x={342} y={134} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui">B/L NUMBER</text>
      <rect x={342} y={140} width={276} height={28} rx={6} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={1} />
      <text x={352} y={159} fontSize={11} fontWeight="600" fill="#18181b" fontFamily="ui-monospace, monospace">HDMUKIA1234567</text>
      {/* Checkmark */}
      <circle cx={596} cy={154} r={8} fill="#dcfce7" />
      <text x={594} y={157} fontSize={8} fill="#16a34a">✓</text>

      <text x={342} y={182} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui">SHIPPER</text>
      <rect x={342} y={188} width={276} height={28} rx={6} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={1} />
      <text x={352} y={207} fontSize={11} fill="#52525b" fontFamily="system-ui">PT Maju Jaya Abadi</text>
      <circle cx={596} cy={202} r={8} fill="#dcfce7" />
      <text x={594} y={205} fontSize={8} fill="#16a34a">✓</text>

      <text x={342} y={230} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui">CONSIGNEE</text>
      <rect x={342} y={236} width={276} height={28} rx={6} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={1} />
      <text x={352} y={255} fontSize={11} fill="#52525b" fontFamily="system-ui">PT Bumi Sukses Sejahtera</text>
      <circle cx={596} cy={250} r={8} fill="#dcfce7" />
      <text x={594} y={253} fontSize={8} fill="#16a34a">✓</text>

      <text x={342} y={278} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui">VESSEL / VOYAGE</text>
      <rect x={342} y={284} width={276} height={28} rx={6} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={1} />
      <text x={352} y={303} fontSize={11} fill="#52525b" fontFamily="system-ui">MSC ARIES / V.246N</text>
      <circle cx={596} cy={298} r={8} fill="#dcfce7" />
      <text x={594} y={301} fontSize={8} fill="#16a34a">✓</text>

      <text x={342} y={326} fontSize={9} fontWeight="600" fill="#71717a" fontFamily="system-ui">ETA</text>
      <rect x={342} y={332} width={276} height={28} rx={6} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={1} />
      <text x={352} y={351} fontSize={11} fill="#52525b" fontFamily="system-ui">12 Jun 2026</text>
      <circle cx={596} cy={346} r={8} fill="#dcfce7" />
      <text x={594} y={349} fontSize={8} fill="#16a34a">✓</text>
    </BrowserFrame>
  );
}
