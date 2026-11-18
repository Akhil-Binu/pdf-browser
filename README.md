# PDF & Image Utility Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)
[![100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#privacy-guarantee)

A fast, modern, and completely client-side browser utility for working with PDFs and images. All processing is executed 100% locally in your web browser using HTML5 Canvas, Web Workers, and WebAssembly.

**Zero backend servers. Zero uploads. Zero tracking.**

---

## ✨ Features

### 1. Merge PDF
- Drag-and-drop or file picker to add multiple `.pdf` documents.
- Displays file names, file sizes, and page counts.
- Reorder pages via drag-and-drop or quick Move Up / Move Down buttons.
- Client-side merging into a single `merged.pdf` with automatic browser download.

### 2. Compress Image
- Supports PNG, JPEG/JPG, and WebP formats (single or batch).
- Adjustable quality slider (10% to 100%) and optional max width/height dimensions.
- Side-by-side Before vs. After comparison cards showing original size, compressed size, and percentage saved.
- Download individual optimized images or grab all in a single `.zip` archive.

### 3. Image to PDF
- Convert JPG, PNG, and WebP images into a single multi-page PDF document.
- Drag-and-drop reordering with visual thumbnails.
- Configurable layout: **Portrait** vs. **Landscape** orientation.
- Page fitting options: **Fit to Page** (scaled with uniform margins) vs. **Original Size**.

---

## 🔒 Privacy Guarantee

- **No Remote Network Calls:** Your files never leave your device.
- **In-Memory Operations:** Documents are held only in browser memory and discarded immediately upon resetting or closing the tab.
- **Auditable Codebase:** Pure static frontend with zero tracking or telemetry.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (Light & Dark mode support)
- **PDF Manipulation:** `pdf-lib`
- **Image Compression:** `browser-image-compression` + HTML5 Canvas API fallback
- **Icons:** `lucide-react`
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Archive Generation:** `jszip` + `file-saver`

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

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

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code style, test requirements, and pull request workflow.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
