<div align="center">

# 🛠️ PDF & Media Utility Studio (v3.0)

**A 100% Client-Side, Privacy-First Browser Studio for Documents, Images, Code, Audio & Video.**

[![Live Demo](https://img.shields.io/badge/Demo-pdf--browser--vert.vercel.app-blue?style=for-the-badge&logo=vercel)](https://pdf-browser-vert.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/Akhil-Binu/pdf-browser?style=for-the-badge&color=gold)](https://github.com/Akhil-Binu/pdf-browser/stargazers)
[![Version](https://img.shields.io/badge/Version-3.0.0-emerald?style=for-the-badge)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

<br/>

[![100% Local Processing](https://img.shields.io/badge/Privacy-100%25%20In--Browser-success?style=flat-square)](#-privacy-architecture)
[![Zero Network Uploads](https://img.shields.io/badge/Server%20Uploads-ZERO-red?style=flat-square)](#-privacy-architecture)
[![PWA Offline Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-blueviolet?style=flat-square)](#-progressive-web-app-offline)
[![Open Source](https://img.shields.io/badge/Open%20Source-GitHub-181717?style=flat-square&logo=github)](https://github.com/Akhil-Binu/pdf-browser)

<p align="center">
  <a href="#-quick-tour--features">Explore 23 Tools</a> •
  <a href="#-privacy-architecture">Privacy Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-technical-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

</div>

## 💡 Overview

Most modern online utility services (SmallPDF, iLovePDF, CloudConvert, TinyPNG) upload your sensitive files, contracts, receipts, and personal photos to remote cloud servers for remote execution. 

**PDF & Media Utility Studio** is designed from the ground up to eliminate servers entirely. Every single byte is processed **100% locally** on your device using WebAssembly, Web Workers, HTML5 Canvas, Web Audio API, and modern cryptographic engines.

### Why Choose This Studio?
- 🔒 **Zero Data Transmission:** Documents, signatures, and media never leave your browser window.
- ⚡ **Instant Execution:** No upload queues, bandwidth bottlenecks, or server wait times.
- ✈️ **Fully Offline (PWA):** Install as a standalone desktop or mobile application and work seamlessly on airplanes or offline environments.
- 💸 **100% Free & Open Source:** No subscriptions, no usage tiers, no file size paywalls, and no telemetry.

---

## 🧰 The 23 Client-Side Utilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PDF & MEDIA STUDIO                              │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 📄 PDF Suite (10) │ 🖼️ Images (8)     │ 🛠️ Dev, Media & Smart (5)     │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Merge PDF       │ • Compress Image  │ • Client-Side OCR (Wasm)       │
│ • Split PDF       │ • Image to PDF    │ • QR Code Suite (Gen & Scan)   │
│ • Rotate & Order  │ • Convert Format  │ • Code Poster Card Generator   │
│ • PDF to Images   │ • Crop & Resize   │ • Video Frame & Storyboard     │
│ • Watermark PDF   │ • Scanner Filter  │ • Audio Waveform Trimmer (WAV) │
│ • Protect PDF     │ • Favicon Gen     │                                │
│ • Sign PDF (v3)   │ • Color Palette   │                                │
│ • Redact PDF (v3) │ • SVG Optimizer   │                                │
│ • Resize PDF (v3) │                   │                                │
│ • PDF Diff (v3)   │                   │                                │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

### 📄 1. PDF Suite (10 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Merge PDF** | Combine multiple documents with drag-and-drop file reordering, live page count previews, and instant bundling. | `pdf-lib` + `@dnd-kit` |
| **Split & Extract PDF** | Extract custom page ranges (`1-4, 7, 9-12`) into a single PDF or separate all individual pages into a structured `.zip` archive. | `pdf-lib` + `jszip` |
| **Rotate & Organize** | Interactive visual thumbnail grid to rotate sheets (90°, 180°, 270°), discard unwanted pages, and reorder document structure. | `pdfjs-dist` + `pdf-lib` |
| **PDF to Images** | High-definition rasterization of PDF pages into PNG or JPEG at configurable DPI scales (150, 200, 300 DPI) with batch ZIP download. | `pdfjs-dist` + Canvas |
| **Watermark & Numbers** | Stamp customizable text stamps ("CONFIDENTIAL", "DRAFT") with adjustable opacity, rotation, and font sizes, plus automated pagination headers/footers. | `pdf-lib` Standard Fonts |
| **Protect PDF** | In-browser AES encryption with custom user and owner passwords, disallowing copying, printing, or form modification without permissions. | `pdf-lib` Security |
| **Digital Signer `v3.0`** | Draw a signature using smooth bezier canvas ink (Black, Blue, Red) or generate a legal cursive signature; place anywhere on target pages with date & title stamps. | HTML5 Canvas + `pdf-lib` |
| **PDF Redactor `v3.0`** | Irreversibly sanitize confidential text, bank accounts, and SSNs with permanent blackout or whiteout vector blocks that prevent text selection or extraction. | `pdf-lib` Vector Shapes |
| **PDF Resizer `v3.0`** | Scale uneven document sheets to standardized ISO A4 or US Letter with adjustable margins, or generate 2-Up side-by-side spreads for booklet printing. | `pdf-lib` Matrix Scaling |
| **PDF Visual Diff `v3.0`** | Compare two revisions side-by-side, swipe across drafts with a split-slider, or generate high-contrast pixel difference maps highlighting modifications. | Canvas Difference Blending |

---

### 🖼️ 2. Images & Design (8 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Compress Image** | Reduce file sizes of PNG, JPEG, and WebP images with a live Before vs. After comparison, savings percentage, and batch `.zip` download. | `browser-image-compression` |
| **Image to PDF** | Convert photo batches into multi-page PDFs with orientation selection (Portrait/Landscape) and page fit presets (Fit to Page / Original Margins). | `pdf-lib` Image Embedder |
| **Convert Format** | High-speed batch format switching between WebP, PNG, and JPEG with custom compression quality sliders. | HTML5 Canvas API |
| **Crop & Resize** | Precision cropping with preset aspect ratios (`1:1`, `16:9`, `4:3`, `9:16`, `Free`) and custom pixel dimension scaling. | Canvas 2D Cropper |
| **Document Scanner** | Transform photo receipts, invoices, and handwritten notes into crisp, high-contrast black-and-white documents while stripping private EXIF metadata. | Canvas Thresholding Filter |
| **Favicon Generator `v3.0`** | Upload a master icon to generate `favicon-16x16`, `favicon-32x32`, `apple-touch-icon`, `android-chrome-192`, `android-chrome-512`, `favicon.ico`, and `site.webmanifest`. | `jszip` + ICO Generator |
| **Color Palette `v3.0`** | Quantize dominant colors from photos, pick screen pixels via Eyedropper API, copy HEX/RGB swatches, and export ready-to-use CSS Variables or Tailwind configs. | Canvas Quantization Engine |
| **SVG Optimizer `v3.0`** | Strip Illustrator/Inkscape namespaces, metadata, XML declarations, comments, and empty groups with live preview and code inspection. | Client-side Regex Parser |

---

### 💻 3. Dev & Smart Utilities (3 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Client-Side OCR** | Extract text from scanned documents and screenshots locally using in-browser WebAssembly OCR. Supports multiple languages with accuracy scoring and text export. | `tesseract.js` (Wasm) |
| **QR Code Suite `v3.0`** | Generate customizable vector SVG and raster PNG QR codes (URL, WiFi credentials, plain text, vCards). Decode QR codes from uploaded images with `jsqr`. | `qrcode` + `jsqr` |
| **Code Poster `v3.0`** | Transform code snippets into polished social cards featuring macOS window chrome, syntax keyword coloring, radiant gradient backdrops, and PNG/PDF export. | Canvas 2D Retina + `pdf-lib` |

---

### 🎬 4. Audio & Video (2 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Video to Frames `v3.0`** | Play local MP4/WebM/MOV files, capture high-res frames at exact timestamps, or run automated interval extraction across video duration to ZIP or Storyboard PDF. | HTML5 `<video>` + Canvas |
| **Audio Trimmer `v3.0`** | Decodes audio in browser memory, renders waveform peaks, allows scrubbing start/end points with preview playback, and exports lossless 16-bit PCM WAV. | Web Audio API + RIFF Encoder |

---

## 🔒 Privacy Architecture

```
[ Your Device / Browser ]
┌────────────────────────────────────────────────────────┐
│  Selected File (Local Disk)                            │
│           │                                            │
│           ▼ (File API / ArrayBuffer)                   │
│  [ In-Memory WebAssembly & Canvas Pipeline ]           │
│           │                                            │
│           ▼ (saveAs / Blob Download)                   │
│  Result Saved (Local Disk)                             │
└────────────────────────────────────────────────────────┘
          ✖ NO NETWORK CALLS ✖ NO TRACKING ✖
```

1. **Strictly In-Memory Operations:** Files are read into transient `ArrayBuffer` objects in memory. No data is stored in LocalStorage, IndexedDB, or external caches.
2. **Deterministic Cleanup:** Every tool automatically calls `URL.revokeObjectURL()` during component unmounting or reset actions to prevent browser memory leaks.
3. **Compliance Ready:** Safe for strictly regulated data (HIPAA, GDPR, financial records, NDA contracts) because data never leaves the client host.

---

## 📱 Progressive Web App (Offline)

PDF & Media Utility Studio is fully configured as a Progressive Web App (PWA):
- **Offline Service Worker:** Powered by `vite-plugin-pwa` with precached app shells and worker bundles.
- **Desktop & Mobile Install:** Click the **Install App** icon in your browser URL bar (Chrome, Edge, Safari, Brave) to install it as a standalone desktop utility.
- **No Internet Required:** Launch and process files anywhere—even in airplane mode.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm`

### Installation

```bash
# Clone the repository
git clone https://github.com/Akhil-Binu/pdf-browser.git

# Navigate into directory
cd pdf-browser

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Type Check & Linting

```bash
# Type check TypeScript codebase
npm run build

# Ultra-fast linting with Oxlint
npm run lint
```

### Production Build & Preview

```bash
# Compile optimized bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Technical Stack

- **Framework:** React 19 (TypeScript)
- **Bundler:** Vite 8
- **Styling:** Tailwind CSS with comprehensive Light / Dark mode themes
- **Document Engines:** `pdf-lib`, `pdfjs-dist`
- **OCR Engine:** `tesseract.js` (WebAssembly)
- **Image Processing:** `browser-image-compression`, HTML5 Canvas API
- **QR Engine:** `qrcode`, `jsqr`
- **Archiving:** `jszip`, `file-saver`
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Icons:** `lucide-react`
- **Linter:** `oxlint`

---

## 📁 Repository Structure

```
pdf-browser/
├── public/                 # Static PWA manifests & icons
├── src/
│   ├── components/
│   │   ├── layout/         # Header, Footer, ToolSwitcher, ThemeToggle
│   │   ├── tools/          # 23 Modular Tool Component Suites
│   │   │   ├── AudioTrimmer/
│   │   │   ├── CodePoster/
│   │   │   ├── ColorPalette/
│   │   │   ├── CompressImage/
│   │   │   ├── ConvertImage/
│   │   │   ├── CropImage/
│   │   │   ├── FaviconGen/
│   │   │   ├── FilterScanner/
│   │   │   ├── ImageToPdf/
│   │   │   ├── MergePdf/
│   │   │   ├── OcrTool/
│   │   │   ├── PdfDiff/
│   │   │   ├── PdfRedactor/
│   │   │   ├── PdfResizer/
│   │   │   ├── PdfSigner/
│   │   │   ├── PdfToImages/
│   │   │   ├── ProtectPdf/
│   │   │   ├── QrSuite/
│   │   │   ├── RotatePdf/
│   │   │   ├── SplitPdf/
│   │   │   ├── SvgOptimizer/
│   │   │   ├── VideoFrames/
│   │   │   └── WatermarkPdf/
│   │   └── ui/             # Reusable Button, Dropzone, Spinner components
│   ├── types/              # Centralized TypeScript definitions & declarations
│   ├── utils/              # Client-side pdf-lib and canvas utility functions
│   ├── App.tsx             # Main routing & application shell
│   └── main.tsx            # Entry point & PWA registration
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are warmly welcomed!

1. Fork the Project (`https://github.com/Akhil-Binu/pdf-browser/fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <b>Built with ❤️ for privacy, speed, and open web standards.</b><br/>
  <sub>100% Client-Side • Files Never Leave Your Browser</sub>
</div>
