# M2+ AccelMotion

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Full Open Source](https://img.shields.io/badge/Open%20Source-Full-blue.svg)](#)

A real-time telemetry and 3D visualization dashboard for Apple Silicon MacBooks (M2, M3, M4). This project taps into the undocumented built-in accelerometer to drive a "Liquid Glass" UI.

---

## Getting Started

### Prerequisites

- A Mac with Apple Silicon (M2, M3, or M4 chip).
- [Go](https://go.dev/doc/install) installed on your system.

### Running the Program

1. Clone this repository and navigate to the directory.
2. Run the following command in your terminal:

   ```bash
   sudo go run main.go
   ```

> [!IMPORTANT]
> **Why `sudo`?** macOS restricts access to low-level hardware components (IOKit HID) for security reasons. Since the MacBook's accelerometer is an undocumented HID device, the program requires root privileges (`sudo`) to read the sensor data directly. Without this, the system will deny access to the motion data.

1. Open your browser and go to: `http://localhost:8080`

---

## Technical Architecture

### Core Acceleration Logic

The heart of the project lies in **[`main.go`](/M2+AccelMotion/main.go)**.

This file handles the heavy lifting:

- **IOKit HID Access**: Interfacing with the Apple Silicon accelerometer via specialized Go bindings.
- **Signal Smoothing**: Implements Exponential Moving Average (EMA) and low-pass filtering to eliminate raw sensor jitter.
- **Tap Detection**: A high-frequency polling loop (50Hz) monitors G-force spikes to detect physical "knocks" on the MacBook chassis.
- **SSE Stream**: Broadcasts processed telemetry to the web frontend using Server-Sent Events (SSE).

### Modular Frontend

The UI is built with a modular approach for better maintainability:

- **`js/config.js`**: Centralized configuration for 3D tilt, hit thresholds, and inversion.
- **`js/audio.js`**: Real-time impact detection and local audio playback.
- **`js/visuals.js`**: 3D MacBook rotation and liquid parallax background.
- **`js/chart.js`**: High-performance canvas-based telemetry streaming.

---

## Features

- **3D MacBook Live View**: Real-time orientation tracking with smoothing.
- **Liquid Motion Background**: Dynamic background orbs that respond to device tilt.
- **Sound on Impact**: Upload local audio and trigger it by physically tapping your Mac.
- **Spirit Level**: Precision bubble level for balancing tasks.
- **Telemetry**: Real-time G-force charts with adjustable gain and window.

---

## License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it as you see fit!
