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
      {changes.map((change, index) => (
        <div
          key={index}
          className={index < changes.length - 1 ? "pb-6 border-b border-gray-200 dark:border-gray-800" : ""}
        >
          <div className="flex items-center mb-2">
            <div className="text-sm text-gray-500 mr-3">{change.date}</div>
            <span
              className={`
                inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm border
                ${change.tagColor === "green" ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : ""}
                ${change.tagColor === "blue" ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : ""}
                ${change.tagColor === "amber" ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : ""}
              `}
            >
              {change.tag}
            </span>
          </div>
          <h3 className="text-lg font-medium mb-1">{change.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{change.description}</p>
        </div>
      ))}
    </div>
  )
}

