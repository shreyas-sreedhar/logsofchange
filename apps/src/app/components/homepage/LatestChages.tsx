// import { Badge } from "@/components/ui/badge"

export default function LatestChanges() {
  const changes = [
    {
      date: "MARCH 08, 2025",
      tag: "NEW",
      tagColor: "green",
      title: "Markdown support for changelog entries",
      description: "You can now use Markdown formatting in your changelog entries for better readability.",
    },
    {
      date: "FEBRUARY 28, 2025",
      tag: "IMPROVED",
      tagColor: "blue",
      title: "Enhanced filtering options",
      description: "We've added more filtering options to help you find specific changelog entries faster.",
    },
    {
      date: "FEBRUARY 14, 2025",
      tag: "FIXED",
      tagColor: "amber",
      title: "Fixed date sorting issue",
      description: "Resolved an issue where entries weren't properly sorted by date in some views.",
    },
  ]

  return (
    <div className="space-y-6">
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .shimmer-effect {
          position: relative;
        }
        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.6) 50%, 
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 9s infinite ease-in-out;
          pointer-events: none;
        }
      `}</style>
      {changes.map((change, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-md bg-gray-50 relative overflow-hidden shimmer-effect"
        >
          <div className="flex items-center mb-2">
            <div className="text-sm text-gray-500 mr-3">{change.date}</div>
            <span
              className={`
                inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm border
                ${change.tagColor === "green" ? "bg-green-100 text-green-800 border-green-200" : ""}
                ${change.tagColor === "blue" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                ${change.tagColor === "amber" ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
              `}
            >
              {change.tag}
            </span>
          </div>
          <h3 className="text-lg font-medium mb-1">{change.title}</h3>
          <p className="text-gray-600 text-sm">{change.description}</p>
        </div>
      ))}
    </div>
  )
}

