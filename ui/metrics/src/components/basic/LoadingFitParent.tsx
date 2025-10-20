interface LoadingFitParentProps {
  children?: React.ReactNode;
}

export default function LoadingFitParent({ children }: LoadingFitParentProps) {
  return (
    <div className="animate-loading-gradient absolute top-0 left-0 z-10 flex h-full w-full flex-col justify-center bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 bg-[length:200%_100%] text-center dark:from-gray-700 dark:via-gray-800 dark:to-gray-700">
      {children}
    </div>
  );
}
