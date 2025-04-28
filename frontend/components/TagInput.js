"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "./ui/badge";

export default function TagInput({ value = [], onChange, placeholder = "Add tags..." }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-1 w-full rounded-md border border-input bg-transparent p-2 text-sm cursor-text"
      onClick={focusInput}
    >
      {value.map((tag, index) => (
        <Badge key={index} className="rounded-sm flex items-center gap-1">
          <span>{tag}</span>
          <X
            className="size-4 ml-auto cursor-pointer hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
          />
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="flex-1 min-w-[120px] bg-transparent h-full py-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        style={{ border: "none", outline: "none", boxShadow: "none" }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
}
