import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMMON_DESCRIPTIONS } from "@/constants/transactionConstants";

export interface DescriptionInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectPreset?: (value: string) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * DescriptionInput component for transaction descriptions
 * Features:
 * - Text input with validation
 * - Common description presets
 * - Error display
 */
export function DescriptionInput({
  value,
  onChange,
  onSelectPreset,
  error,
  className = "",
  disabled = false
}: DescriptionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Filter suggestions based on current input
  const filteredSuggestions = value
    ? COMMON_DESCRIPTIONS.filter(desc => 
        desc.toLowerCase().includes(value.toLowerCase()))
    : COMMON_DESCRIPTIONS;
  
  // Handle preset selection
  const handlePresetClick = (description: string) => {
    if (onSelectPreset) {
      onSelectPreset(description);
      setShowSuggestions(false);
    }
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Input
          id="description"
          placeholder="Mô tả giao dịch"
          value={value}
          onChange={(e) => {
            onChange(e);
            // Show suggestions when user starts typing
            if (e.target.value && !showSuggestions) {
              setShowSuggestions(true);
            }
            // Hide suggestions when input is cleared
            if (!e.target.value) {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => value && setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding to allow for clicks on suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          required
          disabled={disabled}
          className={`h-12 ${error ? "border-destructive" : ""}`}
        />
        
        {/* Error message */}
        {error && (
          <div className="text-destructive text-sm mt-1">{error}</div>
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && onSelectPreset && (
          <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredSuggestions.map((desc, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                onClick={() => handlePresetClick(desc)}
              >
                {desc}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Common description buttons */}
      {onSelectPreset && (
        <div className="flex flex-wrap gap-2 mt-2">
          {COMMON_DESCRIPTIONS.slice(0, 4).map((desc, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectPreset(desc)}
              disabled={disabled}
              className="text-xs h-8 flex-grow"
            >
              {desc}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
