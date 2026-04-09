import React from "react";
import { CalEvent } from "./types";

export default function EventChip({
  ev, large, onClick,
}: { ev: CalEvent; large?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`
        ${ev.color} text-white rounded-md cursor-pointer
        hover:brightness-110 truncate select-none shadow-sm
        ${large ? "px-3 py-2 text-xs mb-1.5" : "px-2 py-1 text-[10px] mb-0.5"}
      `}
    >
      <span className="font-medium">{ev.start}</span>
      <span className="ml-1">{ev.title}</span>
    </div>
  );
}
