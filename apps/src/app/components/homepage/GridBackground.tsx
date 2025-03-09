interface GridBackgroundProps {
    columns?: number
    rows?: number
    maskDirection?: "left" | "right" | "none"
  }
  
  export default function GridBackground({ columns = 8, rows = 8, maskDirection = "left" }: GridBackgroundProps) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        {maskDirection !== "none" && (
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              maskDirection === "left"
                ? "from-white via-white to-transparent"
                : "from-transparent via-white to-white"
            } z-10`}
          />
        )}
        <div
          className="h-full w-full grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columns * rows }).map((_, i) => (
            <div key={i} className="border border-gray-100" />
          ))}
        </div>
      </div>
    )
  }
  
  