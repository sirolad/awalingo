interface WordOfTheDayProps {
  word: string;
  definition: string;
  partOfSpeech?: string;
  innerBgClassName?: string;
  showWordOfTheDay?: boolean;
}

export function WordOfTheDay({
  word,
  definition,
  partOfSpeech,
  innerBgClassName,
  showWordOfTheDay = true,
}: WordOfTheDayProps) {
  return (
    <div
      className={`mb-4 p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-soft overflow-hidden hover:shadow-lg transition-shadow`}
    >
      {showWordOfTheDay && (
        <h2 className="heading-5 mb-2 dark:text-neutral-50">Word of the Day</h2>
      )}
      <div
        className={`p-4 w-full border rounded-xl ${innerBgClassName || 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'}`}
      >
        <div>
          <h3 className="heading-5 text-neutral-950 dark:text-neutral-50">
            {word}
          </h3>
          <div className="text-caption italic text-neutral-600 dark:text-neutral-400 mb-2">
            {partOfSpeech ?? 'noun'}
          </div>
          <p className="body-base dark:text-neutral-300">{definition}</p>
        </div>
      </div>
    </div>
  );
}
