# PDF & Media Utility Studio (v3.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](package.json)
[![100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#privacy-guarantee)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](#offline-pwa)
[![Open Source](https://img.shields.io/badge/Open%20Source-GitHub-181717.svg?logo=github)](https://github.com/Akhil-Binu/pdf-browser)

A production-ready, completely browser-based utility studio featuring **23 high-speed tools** for PDF manipulation, image editing, developer utilities, audio waveforms, video frames, and document intelligence. All computations execute 100% client-side in the browser using HTML5 Canvas, Web Workers, WebAssembly, Web Audio API, and `pdf-lib`.

**Zero backend servers. Zero uploads. Zero telemetry.**

---

## ✨ Full Suite of 23 Tools

### 📄 PDF Suite (10 Tools)
1. **Merge PDF**: Combine multiple PDFs into a single file with page counts and drag-and-drop ordering.
2. **Split & Extract PDF**: Extract custom page ranges (`1-3, 5`) into a single PDF or separate all pages into a `.zip` archive.
3. **Rotate & Organize Pages**: Interactive visual page grid to rotate individual sheets (90°, 180°, 270°), discard pages, and reorder.
4. **PDF to Images**: High-resolution rasterization of PDF pages to PNG or JPEG with custom DPI (150, 200, 300 DPI) and `.zip` download.
5. **Watermark & Page Numbers**: Stamp customizable text watermarks ("CONFIDENTIAL", "DRAFT") with opacity, rotation, and colors, or add "Page X of Y" pagination headers/footers.
6. **Protect PDF**: Client-side AES encryption with password protection and permissions restrictions.
7. **Sign PDF (Digital Signature)**: Draw signature or type legal cursive signature with pen colors, date stamp, and visual page placement. *(v3.0)*
8. **Redact PDF**: Permanently sanitize confidential information with opaque blackout or clean whiteout rectangles. *(v3.0)*
9. **Resize & 2-Up Booklet**: Standardize document sheets to ISO A4 or US Letter with adjustable margins, or generate 2-Up side-by-side booklet spreads. *(v3.0)*
10. **PDF Visual Diff**: Compare two PDF versions side-by-side, swipe across revisions, or generate high-contrast difference maps. *(v3.0)*

### 🖼️ Images & Design (8 Tools)
11. **Compress Image**: Browser-based lossy/lossless image compression for PNG, JPEG, and WebP with Before/After comparison and ZIP download.
12. **Image to PDF**: Convert photos into multi-page PDF documents with portrait/landscape and fit-to-page options.
13. **Convert Format**: Batch convert images across WebP, PNG, and JPEG with quality controls.
14. **Crop & Resize**: Crop images with preset aspect ratios (`1:1`, `16:9`, `4:3`, `9:16`, `Free`) and pixel offsets.
15. **Document Scanner & EXIF Stripper**: Convert photo receipts into high-contrast black-and-white scans, and strip private EXIF metadata (GPS, camera info).
16. **Favicon Generator**: Upload a master logo and generate `favicon-16x16`, `favicon-32x32`, `apple-touch-icon`, `android-chrome` icons, `favicon.ico`, and `site.webmanifest` in a `.zip`. *(v3.0)*
17. **Color Palette Extractor**: Automatic color quantization from images, interactive eyedropper, and CSS Variables / Tailwind code exports. *(v3.0)*
18. **SVG Optimizer**: Minify SVG code, strip Illustrator/Inkscape namespaces, metadata, and comments with live comparison. *(v3.0)*

### 🛠️ Dev & Smart Utilities (3 Tools)
19. **Client-Side OCR**: In-browser WebAssembly OCR via Tesseract.js with confidence score, copy-to-clipboard, and `.txt` export.
20. **QR Code Suite**: Generate customizable vector/raster QR codes (URL, WiFi, Text, vCard) and decode QR codes from image files. *(v3.0)*
21. **Code Poster**: Transform code snippets into polished social cards with gradient backdrops, macOS window chrome, and PNG/PDF export. *(v3.0)*

### 🎬 Audio & Video (2 Tools)
22. **Video to Frames**: Extract frames from MP4/WebM/MOV at exact timestamps or regular intervals, exporting to a ZIP or Storyboard PDF. *(v3.0)*
23. **Audio Waveform Trimmer**: Visually scrub and trim MP3/WAV/AAC audio files with waveform visualization and export uncompressed 16-bit PCM WAV. *(v3.0)*

---

## 🔒 Privacy Guarantee

- **No Remote Network Calls:** Your files never leave your device.
- **In-Memory Operations:** Documents are held only in browser memory and discarded immediately upon resetting or closing the tab.
- **Auditable Open-Source Codebase:** Pure static frontend with zero tracking or telemetry.

---

## 🚀 Getting Started

### Installation

```bash
git clone https://github.com/Akhil-Binu/pdf-browser.git
cd pdf-browser
npm install
```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

---

## 📜 License

This project is open-source and licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
