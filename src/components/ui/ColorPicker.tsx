import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  showAlpha?: boolean;
  presetColors?: string[];
  className?: string;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

const DEFAULT_PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082',
];

export function ColorPicker({
  value = '#000000',
  onChange,
  label,
  showAlpha: _showAlpha = false,
  presetColors = DEFAULT_PRESET_COLORS,
  className = '',
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value);
  const [hsl, setHsl] = useState(() => {
    const rgb = hexToRgb(value);
    return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, l: 50 };
  });
  const [rgb, setRgb] = useState(() => {
    const rgbVal = hexToRgb(value);
    return rgbVal || { r: 0, g: 0, b: 0 };
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== hexValue) {
      setHexValue(value);
      const rgbVal = hexToRgb(value);
      if (rgbVal) {
        setRgb(rgbVal);
        setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
      }
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const updateColor = (newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexValue(newHex);
    onChange?.(newHex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(newHex)) {
      setHexValue(newHex);
      if (newHex.length === 7) {
        const rgbVal = hexToRgb(newHex);
        if (rgbVal) {
          setRgb(rgbVal);
          setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
          onChange?.(newHex);
        }
      }
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [component]: Math.max(0, Math.min(255, val)) };
    setRgb(newRgb);
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHsl(newHsl);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexValue(newHex);
    onChange?.(newHex);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newH = parseInt(e.target.value);
    updateColor({ ...hsl, h: newH });
  };

  const handlePresetClick = (color: string) => {
    setHexValue(color);
    const rgbVal = hexToRgb(color);
    if (rgbVal) {
      setRgb(rgbVal);
      setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
      onChange?.(color);
    }
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm cursor-pointer"
          style={{ backgroundColor: hexValue }}
          title={hexValue}
        />
        <input
          type="text"
          value={hexValue}
          onChange={handleHexChange}
          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400 text-sm font-mono w-24"
          placeholder="#000000"
        />
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-50 min-w-[320px]">
            {/* Main color area - Saturation/Lightness */}
            <div className="mb-4">
              <div
                className="w-full h-48 rounded-lg cursor-crosshair relative border border-gray-300"
                style={{
                  background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent), hsl(${hsl.h}, 100%, 50%)`,
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const s = Math.round((x / rect.width) * 100);
                  const l = Math.round(100 - (y / rect.height) * 100);
                  updateColor({ ...hsl, s, l });
                }}
              >
                <div
                  className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                  style={{
                    left: `${hsl.s}%`,
                    top: `${100 - hsl.l}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            </div>

            {/* Hue slider */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Hue</label>
              <div className="relative h-6 rounded-lg overflow-hidden" style={{
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              }}>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsl.h}
                  onChange={handleHueChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-0 w-2 h-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${(hsl.h / 360) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
            </div>

            {/* RGB inputs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">R</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">G</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">B</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Preset colors */}
            {presetColors.length > 0 && (
              <div>
                <label className="block text-xs text-gray-600 mb-2">Presets</label>
                <div className="grid grid-cols-8 gap-1">
                  {presetColors.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetClick(color)}
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
