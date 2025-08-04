import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActionSheetOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

interface IOSActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

export const IOSActionSheet: React.FC<IOSActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  options,
  cancelLabel = 'Cancel',
}) => {
  if (!isOpen) return null;

  const handleOptionClick = (option: ActionSheetOption) => {
    if (!option.disabled) {
      option.onClick();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out">
        <div className="bg-white mx-2 mb-2 rounded-xl overflow-hidden">
          {/* Title */}
          {title && (
            <div className="px-4 py-3 text-center border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            </div>
          )}

          {/* Options */}
          <div className="divide-y divide-gray-200">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className={`w-full px-4 py-4 text-left flex items-center justify-center gap-3 transition-colors ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : option.destructive
                    ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                    : 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                }`}
              >
                {option.icon && (
                  <div className={`${
                    option.disabled
                      ? 'text-gray-400'
                      : option.destructive
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    {option.icon}
                  </div>
                )}
                <span className="text-lg font-normal">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <div className="bg-white mx-2 mb-4 rounded-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-4 text-lg font-semibold text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </>
  );
};

// Hook for managing action sheet state
export const useIOSActionSheet = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title?: string;
    options: ActionSheetOption[];
    cancelLabel?: string;
  }>({
    options: [],
  });

  const showActionSheet = React.useCallback((newConfig: typeof config) => {
    setConfig(newConfig);
    setIsOpen(true);
  }, []);

  const hideActionSheet = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    showActionSheet,
    hideActionSheet,
  };
};