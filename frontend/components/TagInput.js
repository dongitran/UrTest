"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

export default function TagInput({
  value = [],
  onChange,
  placeholder = "Enter tags",
  className = "",
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

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
      className={`relative flex items-center w-full h-7 ${className}`}
      onClick={focusInput}
    >
      <div className="absolute inset-0 flex flex-wrap items-center gap-1 pl-3 pr-2 pt-1 pointer-events-none">
        {value.map((tag, index) => (
          <Badge
            key={index}
            className="rounded-sm flex items-center gap-1 text-xs py-0 h-5 pointer-events-auto"
          >
            <span>{tag}</span>
            <X
              className="size-3 ml-auto cursor-pointer hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            />
          </Badge>
        ))}
      </div>
      <Input
        ref={inputRef}
        type="text"
        className="h-7 pl-3"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        style={{
          paddingLeft:
            value.length > 0 ? `${value.length * 70 + 12}px` : "12px",
        }}
      />
    </div>
  );
}
