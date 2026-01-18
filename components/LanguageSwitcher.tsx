"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function LanguageSwitcher() {
  const { changeLanguage, currentLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage("en")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLanguage === "en"
            ? "bg-rose-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage("hi")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLanguage === "hi"
            ? "bg-rose-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
