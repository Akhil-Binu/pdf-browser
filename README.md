# PDF & Image Utility Kit (v2.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](package.json)
[![100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#privacy-guarantee)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](#offline-pwa)

A production-ready, completely browser-based utility suite with **12 powerful PDF, image, and document tools**. All processing executes 100% client-side in the user's browser using HTML5 Canvas, Web Workers, WebAssembly, and `pdf-lib`.

**Zero backend servers. Zero uploads. Zero tracking.**

---

## ✨ Features (12 Tools)

### 📄 PDF Tools
1. **Merge PDF**: Combine multiple PDFs into a single file with page counts and drag-and-drop ordering.
2. **Split & Extract PDF**: Extract custom page ranges (`1-3, 5`) into a single PDF or separate all pages into a `.zip` archive.
3. **Rotate & Organize Pages**: Interactive visual page grid to rotate individual sheets (90°, 180°, 270°), discard pages, and reorder.
4. **PDF to Images**: High-resolution rasterization of PDF pages to PNG or JPEG with custom DPI (150, 200, 300 DPI) and `.zip` download.
5. **Watermark & Page Numbers**: Stamp customizable text watermarks ("CONFIDENTIAL", "DRAFT") with opacity, rotation, and colors, or add "Page X of Y" pagination headers/footers.
6. **Protect PDF**: Client-side AES encryption with password protection and permissions restrictions.

### 🖼️ Image Tools
7. **Compress Image**: Browser-based lossy/lossless image compression for PNG, JPEG, and WebP with Before/After comparison and ZIP download.
8. **Image to PDF**: Convert photos into multi-page PDF documents with portrait/landscape and fit-to-page options.
9. **Convert Format**: Batch convert images across WebP, PNG, and JPEG with quality controls.
10. **Crop & Resize**: Crop images with preset aspect ratios (`1:1`, `16:9`, `4:3`, `9:16`, `Free`) and pixel offsets.
11. **Document Scanner & EXIF Stripper**: Convert photo receipts and text snapshots into high-contrast black-and-white scans, and strip private EXIF metadata (GPS, camera info).

### 🔍 Smart Document Tools
12. **Client-Side OCR (Text Extractor)**: In-browser WebAssembly OCR via Tesseract.js in multiple languages (English, Spanish, French, German) with confidence rating, copy-to-clipboard, and `.txt` export.

---

## 🔒 Privacy Guarantee

- **No Remote Network Calls:** Your files never leave your device.
- **In-Memory Operations:** Documents are held only in browser memory and discarded immediately upon resetting or closing the tab.
- **Auditable Codebase:** Pure static frontend with zero tracking or telemetry.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
