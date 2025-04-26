"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";

export default function TagInput({ value = [], onChange, placeholder = "Add tags..." }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm cursor-text"
      onClick={focusInput}
    >
      {value.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs my-1 h-6"
        >
          <span>{tag}</span>
          <X
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="h-3 w-3 cursor-pointer hover:text-destructive"
          />
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="flex-1 min-w-[120px] bg-transparent h-full py-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
}