<div align="center">

# 🛠️ PDF, Media & Security Utility Studio (v4.0)

**A 100% Client-Side, Privacy-First Browser Studio for Documents, Images, Media, Security & Code.**

[![Live Demo](https://img.shields.io/badge/Demo-pdf--browser--vert.vercel.app-blue?style=for-the-badge&logo=vercel)](https://pdf-browser-vert.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/Akhil-Binu/pdf-browser?style=for-the-badge&color=gold)](https://github.com/Akhil-Binu/pdf-browser/stargazers)
[![Version](https://img.shields.io/badge/Version-4.0.1-emerald?style=for-the-badge)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

<br/>

[![100% Local Processing](https://img.shields.io/badge/Privacy-100%25%20In--Browser-success?style=flat-square)](#-privacy-architecture)
[![Zero Network Uploads](https://img.shields.io/badge/Server%20Uploads-ZERO-red?style=flat-square)](#-privacy-architecture)
[![PWA Offline Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-blueviolet?style=flat-square)](#-progressive-web-app-offline)
[![GitHub Package](https://img.shields.io/badge/GitHub%20Packages-@akhil--binu/pdf--browser-orange?style=flat-square&logo=github)](https://github.com/users/Akhil-Binu/packages/npm/package/pdf-browser)
[![GitHub Release](https://img.shields.io/github/v/release/Akhil-Binu/pdf-browser?style=flat-square&color=blue)](https://github.com/Akhil-Binu/pdf-browser/releases)
[![Open Source](https://img.shields.io/badge/Open%20Source-GitHub-181717?style=flat-square&logo=github)](https://github.com/Akhil-Binu/pdf-browser)

<p align="center">
  <a href="#-the-37-client-side-utilities">Explore 37 Tools</a> •
  <a href="#-privacy-architecture">Privacy Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-technical-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

</div>

## 💡 Overview

Most online file converters and document utilities (SmallPDF, iLovePDF, CloudConvert, TinyPNG) upload your sensitive contracts, financial statements, and confidential photos to remote cloud servers for processing.

**PDF, Media & Security Utility Studio** completely eliminates external servers. Every operation is executed **100% locally inside your browser** using WebAssembly, Web Crypto API, Web Workers, HTML5 Canvas, Web Audio API, and modern client-side standards.

### Why Choose This Studio?
- 🔒 **Zero Data Transmission:** Documents, encryption keys, media, and records never touch any remote server.
- ⚡ **Instant Performance:** Bypasses network upload latencies, queuing delays, and file size throttling.
- ✈️ **Fully Offline PWA:** Install as an offline desktop or mobile app that works anywhere, even in airplane mode.
- 💸 **100% Free & Open Source:** Zero subscriptions, zero paywalls, zero ads, and zero telemetry.

---

## 🧰 The 37 Client-Side Utilities

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        PDF, MEDIA & SECURITY STUDIO (v4.0)                        │
├───────────────────┬───────────────────┬───────────────────────┬───────────────────┤
│ 📄 PDF Suite (14) │ 🖼️ Images (10)    │ 🔐 Dev & Security (9) │ 🎬 Media (4)      │
├───────────────────┼───────────────────┼───────────────────────┼───────────────────┤
│ • Merge PDF       │ • Compress Image  │ • Client-Side OCR     │ • Video Frames    │
│ • Split & Extract │ • Image to PDF    │ • QR Code Suite       │ • Audio Trimmer   │
│ • Rotate & Order  │ • Convert Format  │ • Code Poster Card    │ • Screen Recorder │
│ • PDF to Images   │ • Crop & Resize   │ • File Vault Encrypt  │ • Audio Speed     │
│ • Watermark PDF   │ • Scanner Filter  │ • Hash Verifier       │                   │
│ • Protect PDF     │ • Favicon Gen     │ • Steganography (LSB) │                   │
│ • Sign PDF        │ • Color Palette   │ • Data Converter      │                   │
│ • Redact PDF      │ • SVG Optimizer   │ • Base64 Studio       │                   │
│ • Resize & 2-Up   │ • Batch Watermark │ • Regex Debugger      │                   │
│ • PDF Visual Diff │ • Meme Generator  │                       │                   │
│ • Form Filler     │                   │                       │                   │
│ • Metadata Tool   │                   │                       │                   │
│ • Text Stream     │                   │                       │                   │
│ • Markdown to PDF │                   │                       │                   │
└───────────────────┴───────────────────┴───────────────────────┴───────────────────┘
```

---

### 📄 1. PDF Suite (14 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Merge PDF** | Combine multiple documents with drag-and-drop file reordering, live page count previews, and instant bundling. | `pdf-lib` + `@dnd-kit` |
| **Split & Extract PDF** | Extract custom page ranges (`1-4, 7, 9-12`) into a single PDF or separate all individual pages into a structured `.zip` archive. | `pdf-lib` + `jszip` |
| **Rotate & Organize** | Interactive visual thumbnail grid to rotate sheets (90°, 180°, 270°), discard unwanted pages, and reorder document structure. | `pdfjs-dist` + `pdf-lib` |
| **PDF to Images** | High-definition rasterization of PDF pages into PNG or JPEG at configurable DPI scales (150, 200, 300 DPI) with batch ZIP download. | `pdfjs-dist` + Canvas |
| **Watermark & Numbers** | Stamp customizable text stamps ("CONFIDENTIAL", "DRAFT") with adjustable opacity, rotation, and font sizes, plus automated pagination headers/footers. | `pdf-lib` Standard Fonts |
| **Protect PDF** | In-browser AES encryption with custom user and owner passwords, disallowing copying, printing, or form modification without permissions. | `pdf-lib` Security |
| **Digital Signer** | Draw a signature using smooth bezier canvas ink or generate a legal cursive signature; place anywhere on target pages with date & title stamps. | HTML5 Canvas + `pdf-lib` |
| **PDF Redactor** | Irreversibly sanitize confidential text, bank accounts, and SSNs with permanent blackout or whiteout vector blocks that prevent text selection or extraction. | `pdf-lib` Vector Shapes |
| **PDF Resizer & 2-Up** | Scale uneven document sheets to standardized ISO A4 or US Letter with adjustable margins, or generate 2-Up side-by-side spreads for booklet printing. | `pdf-lib` Matrix Scaling |
| **PDF Visual Diff** | Compare two revisions side-by-side, swipe across drafts with a split-slider, or generate high-contrast pixel difference maps highlighting modifications. | Canvas Difference Blending |
| **Form Filler `v4.0`** | Detect and edit interactive AcroForm fields (text fields, checkboxes, dropdowns) with one-click flattening into permanent static forms. | `pdf-lib` AcroForms |
| **PDF Metadata & Sanitizer `v4.0`** | View, edit, or wipe Title, Author, Subject, Creator, and tracking metadata to safeguard identity prior to sharing. | `pdf-lib` Metadata Engine |
| **Extract Text Stream `v4.0`** | Stream raw textual content across all document pages, execute live searches with real-time match counters, and export to `.txt` or `.json`. | `pdfjs-dist` Text Extraction |
| **Markdown to PDF `v4.0`** | Live split-pane Markdown editor with rendered preview, compiled into formatted A4 PDFs with headers, blockquotes, code fences, and tables. | `marked` + `pdf-lib` |

---

### 🖼️ 2. Images & Design (10 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Compress Image** | Reduce file sizes of PNG, JPEG, and WebP images with a live Before vs. After comparison, savings percentage, and batch `.zip` download. | `browser-image-compression` |
| **Image to PDF** | Convert photo batches into multi-page PDFs with orientation selection (Portrait/Landscape) and page fit presets (Fit to Page / Original Margins). | `pdf-lib` Image Embedder |
| **Convert Format** | High-speed batch format switching between WebP, PNG, and JPEG with custom compression quality sliders. | HTML5 Canvas API |
| **Crop & Resize** | Precision cropping with preset aspect ratios (`1:1`, `16:9`, `4:3`, `9:16`, `Free`) and custom pixel dimension scaling. | Canvas 2D Cropper |
| **Document Scanner** | Transform photo receipts, invoices, and handwritten notes into crisp, high-contrast black-and-white documents while stripping private EXIF metadata. | Canvas Thresholding Filter |
| **Favicon Generator** | Upload a master icon to generate `favicon-16x16`, `favicon-32x32`, `apple-touch-icon`, `android-chrome-192`, `android-chrome-512`, `favicon.ico`, and `site.webmanifest`. | `jszip` + ICO Generator |
| **Color Palette** | Quantize dominant colors from photos, pick screen pixels via Eyedropper API, copy HEX/RGB swatches, and export ready-to-use CSS Variables or Tailwind configs. | Canvas Quantization Engine |
| **SVG Optimizer** | Strip Illustrator/Inkscape namespaces, metadata, XML declarations, comments, and empty groups with live preview and code inspection. | Client-side Regex Parser |
| **Batch Watermark `v4.0`** | Apply text stamps, copyright badges, or PNG logo watermarks across dozens of photos simultaneously with live preview and ZIP download. | Canvas Batch Compositor |
| **Meme Generator `v4.0`** | Create memes with classic Impact typography, custom stroke outlines, uppercase constraints, and instant PNG copy/export. | HTML5 Canvas Meme Engine |

---

### 🔐 3. Dev & Security Suite (9 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Client-Side OCR** | Extract printed text and tabular content from images locally using neural optical character recognition without external API calls. | `tesseract.js` (Wasm/SIMD) |
| **QR Code Suite** | Generate high-density vector QR codes (Wi-Fi, URLs, Contacts, Crypto) with error correction levels, or scan QR codes from files/camera. | `qrcode` + `jsqr` |
| **Code Poster** | Render code snippets into syntax-highlighted social showcase cards with gradient presets, macOS window chrome, and PNG/PDF export. | Canvas Social Card Engine |
| **File Vault Encryptor `v4.0`** | Bank-grade AES-256-GCM encryption with PBKDF2 100k iteration key derivation, random salts, and custom `.vault` binary serialization. | Web Crypto API (`SubtleCrypto`) |
| **Hash & Checksum Verifier `v4.0`** | Generate cryptographic hashes (SHA-256, SHA-512, SHA-384, SHA-1) in real time with integrated checksum comparison. | Web Crypto API |
| **Image Steganography `v4.0`** | Conceal secret plaintext messages into the Least Significant Bits (LSB) of PNG image pixels with zero visible pixel distortion. | Bitwise Canvas Pixel Stream |
| **Data Converter `v4.0`** | Instant bidirectional transformation between JSON structures and CSV spreadsheets with RFC 4180 parsing, quotes handling, and type inference. | Pure TypeScript RFC 4180 |
| **Base64 Studio `v4.0`** | Encode files to raw Base64, Data URIs, HTML `<img>`, and CSS snippets, or decode Base64 strings to reconstructed files with MIME sniffing. | Native Base64 / Binary Views |
| **Regex Debugger `v4.0`** | Test and debug regular expressions in real time with capture group breakdown, regex flags (`g`, `i`, `m`, `s`), live match counts, and replacement simulation. | Native RegExp Engine |

---

### 🎬 4. Media & Audio Suite (4 Tools)

| Tool | Capability | Engine / Standard |
| :--- | :--- | :--- |
| **Video to Frames** | Extract video stills at precise intervals (every 1s, 2s, 5s) or target frame counts, preview interactive storyboards, and export image sequences as `.zip`. | HTML5 Video & Canvas API |
| **Audio Trimmer** | Visualize audio waveforms, scrub timelines, set precision millisecond cut boundaries, and export lossless trimmed `.wav` audio. | Web Audio API + OfflineAudioContext |
| **Screen Recorder `v4.0`** | Capture full screen, application windows, or browser tabs with microphone audio mixing, pause/resume, and zero-server local encoding. | `MediaStream` + `MediaRecorder` |
| **Audio Speed & Reverse `v4.0`** | Change audio playback tempo from 0.25x up to 4.0x or invert playback backwards with direct 16-bit PCM WAV offline export. | `OfflineAudioContext` + WAV Encoder |

---

## 🔒 Privacy Architecture

Every utility in this application is engineered under a strict **Zero-Server Principle**:

```
[ Your Device / Browser ]
  ├── 1. PDF Documents       ──> Memory Buffer ──> In-Browser Assembly (pdf-lib, pdfjs)
  ├── 2. Photographs & SVGs  ──> HTML5 Canvas  ──> Local Pixel Canvas / Wasm
  ├── 3. Encrypted Vaults    ──> SubtleCrypto  ──> AES-256-GCM / PBKDF2 (In-Memory)
  ├── 4. Audio & Screen      ──> Web Audio API ──> Local MediaStream Buffer
  └── 5. Result File         <── Blob / saveAs ──< Instant Client-Side Download
```

> [!IMPORTANT]
> **No Remote Transmission**: No file data, metadata, text extracts, or generated media is ever sent to an external server. You can disconnect your network connection completely after the page loads and continue using all 37 utilities without interruption.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm

### Local Installation

```bash
# Clone the repository
git clone https://github.com/Akhil-Binu/pdf-browser.git
cd pdf-browser

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` to access the full 37-tool studio.

### Production Build

```bash
# Verify types and build production bundle
npm run build

# Run linter
npm run lint

# Preview production build locally
npm run preview
```

---

## 📦 GitHub Packages Integration

The studio is published on the GitHub Packages npm registry as [`@akhil-binu/pdf-browser`](https://github.com/users/Akhil-Binu/packages/npm/package/pdf-browser).

### Option 1: Install via GitHub Packages Registry

1. In your project root, create or edit `.npmrc` to route the `@akhil-binu` scope to GitHub Packages:
```ini
@akhil-binu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
*(Replace `${GITHUB_TOKEN}` with a GitHub Personal Access Token that has `read:packages` scope)*

2. Install the package:
```bash
npm install @akhil-binu/pdf-browser@4.0.1
```
Or with Yarn / pnpm:
```bash
yarn add @akhil-binu/pdf-browser@4.0.1
# or
pnpm add @akhil-binu/pdf-browser@4.0.1
```

### Option 2: Direct Offline Tarball Installation (No Token Needed)

You can download the pre-packaged release tarball directly from GitHub Releases and install it without requiring registry authentication:

```bash
# Download the v4.0.1 tarball asset
curl -LO https://github.com/Akhil-Binu/pdf-browser/releases/download/v4.0.1/akhil-binu-pdf-browser-4.0.1.tgz

# Install locally
npm install ./akhil-binu-pdf-browser-4.0.1.tgz
```

---

## 📱 Progressive Web App (Offline)

PDF, Media & Security Utility Studio is a certified **Progressive Web App (PWA)**:
- **Offline Persistence:** Service workers precache critical application assets, WebAssembly modules, and web workers.
- **Desktop & Mobile Install:** Click the **Install App** icon in Chrome, Safari, Edge, or Brave to install as a standalone native window.
- **Hardware Acceleration:** Uses GPU canvas contexts and SIMD WebAssembly for maximum throughput.

---

## 💻 Technical Stack

- **Frontend Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 (with automatic light/dark mode and responsive layouts)
- **PDF Core:** `pdf-lib`, `pdfjs-dist`
- **OCR Engine:** `tesseract.js` (WebAssembly & Web Workers)
- **Image Compression:** `browser-image-compression`
- **Cryptographic Engine:** Web Crypto API (`crypto.subtle`)
- **Audio & Media:** Web Audio API (`AudioContext`, `OfflineAudioContext`, `MediaRecorder`)
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Icons:** `lucide-react`
- **PWA Tooling:** `vite-plugin-pwa`, `workbox`
- **Linter:** `oxlint`

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
  <sub>Engineered by <a href="https://github.com/Akhil-Binu">Akhil Binu</a>. 100% Client-Side. Zero Server Footprint.</sub>
</div>
