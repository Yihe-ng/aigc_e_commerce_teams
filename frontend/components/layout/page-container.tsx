import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
}

export default function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 h-full min-h-screen">
      {title && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
