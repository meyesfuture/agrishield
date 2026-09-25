import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export interface BranchedMenuItem {
  value?: string;
  label: string;
  icon?: any;
  children?: BranchedMenuItem[];
}

interface BranchedMenuProps {
  items: BranchedMenuItem[];
  defaultOpen?: number[];
  defaultActive?: string;
  onSelect?: (value: string, item: BranchedMenuItem) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
}

export default function BranchedMenu({
  items,
  defaultOpen = [],
  defaultActive,
  onSelect,
  color = '#A1A1AA',
  accentColor = '#FFFFFF',
  lineColor = '#27272A'
}: BranchedMenuProps) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    defaultOpen.forEach(idx => {
      initial[`root-${idx}`] = true;
    });
    return initial;
  });
  
  const [active, setActive] = useState<string | undefined>(defaultActive);

  const toggle = (id: string) => {
    setOpenStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (val: string | undefined, item: BranchedMenuItem) => {
    if (val) {
      setActive(val);
      onSelect?.(val, item);
    }
  };

  const renderItem = (item: BranchedMenuItem, depth: number, id: string, isLastChild: boolean) => {
    const isOpen = !!openStates[id];
    const hasChildren = item.children && item.children.length > 0;
    const isActive = active === item.value && !hasChildren;

    return (
      <div key={id} className="relative">
        {/* Branch structural line */}
        {depth > 0 && (
          <div 
            className="absolute left-[-16px] border-l border-b rounded-bl-lg"
            style={{ 
              borderColor: lineColor,
              width: '12px',
              height: '20px',
              top: '-4px'
            }}
          />
        )}
        
        {depth > 0 && !isLastChild && (
          <div 
            className="absolute left-[-16px] border-l"
            style={{ 
              borderColor: lineColor,
              bottom: '-10px',
              top: '16px'
            }}
          />
        )}

        <div 
          className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors ${
            isActive ? 'bg-[#1A1A1A] text-white' : 'hover:text-white'
          }`}
          style={{ color: isActive ? accentColor : color }}
          onClick={() => {
            if (hasChildren) toggle(id);
            else handleSelect(item.value, item);
          }}
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          <span className="text-sm font-medium">{item.label}</span>
          {hasChildren && (
            <motion.svg 
              animate={{ rotate: isOpen ? 90 : 0 }} 
              className="w-3 h-3 ml-auto opacity-50"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </motion.svg>
          )}
        </div>

        <AnimatePresence initial={false}>
          {hasChildren && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden ml-6 pl-2"
            >
              <div className="pt-1 pb-1">
                {item.children!.map((child, i) => 
                  renderItem(child, depth + 1, `${id}-${i}`, i === item.children!.length - 1)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 w-full max-w-[240px] font-sans">
      {items.map((item, i) => renderItem(item, 0, `root-${i}`, i === items.length - 1))}
    </div>
  );
}
