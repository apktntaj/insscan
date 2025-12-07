# INSScan

**INSScan** is an AI-powered invoice scanner that provides instant HS code lookup and retrieves real-time tax and restriction information for goods from the Indonesia National Single Window (INSW) site.

## Features

- 📄 **Excel File Processing**: Upload Excel files (.xls, .xlsx) containing HS codes
- 🔍 **HS Code Detection**: Automatically extracts and validates HS codes from uploaded files
- 💰 **Tax Information Lookup**: Retrieves comprehensive tax data including:
  - BM (Bea Masuk / Import Duty)
  - PPN (Pajak Pertambahan Nilai / Value Added Tax)
  - PPH (Pajak Penghasilan / Income Tax)
  - PPH NON API (Non-API Income Tax)
- 🚦 **Restriction Information**: Provides LARTAS (Barang Larangan dan Pembatasan) data:
  - LARTAS Import
  - LARTAS Border
  - LARTAS Post Border
  - LARTAS Export
- 📊 **Excel Export**: Download results as an Excel file for easy integration with existing workflows
- ⚡ **Real-time Data**: Fetches up-to-date information from Indonesia National Single Window (INSW)

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [DaisyUI](https://daisyui.com/)
- **Database**: [Prisma](https://www.prisma.io/) ORM
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Excel Processing**: [xlsx (SheetJS)](https://sheetjs.com/)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)
- **API Client**: [Axios](https://axios-http.com/)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/apktntaj/insscan.git
cd insscan
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Configure the required environment variables in the `.env` file.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. **Navigate to INSScan**: Visit the `/inscann` route for the main scanner interface
2. **Upload Excel File**: Click the file input button and select an Excel file containing HS codes
3. **Process Data**: Click the submit button to process the HS codes
4. **View Results**: The application will display tax and restriction information for each HS code
5. **Download Results**: Export the results as an Excel file for further use

### Excel File Format

Your Excel file should contain HS codes in a format that the scanner can detect. The application will:
- Extract valid HS codes from the file
- Remove duplicates
- Process each unique HS code
- Return comprehensive tax and restriction data

## Project Structure

```
insscan/
├── app/
│   ├── api/          # API routes for data processing
│   ├── inscann/      # Main INSScan feature page
│   ├── rayactivity/  # Additional utility page
│   ├── ui/           # Reusable UI components
│   ├── utils/        # Utility functions and helpers
│   └── layout.jsx    # Root layout with navigation
├── public/           # Static assets
└── package.json      # Project dependencies
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Feedback and contributions are welcome! For questions or suggestions, please contact:
- Email: alamasyarie@outlook.com

## License

Copyright © 2024 Semesta Raya Software

## Acknowledgments

Built with [Next.js](https://nextjs.org/) and deployed on [Vercel](https://vercel.com/)
