import { EMOTIONS } from "../lib/constants";

interface EmotionSelectorProps {
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
}

export default function EmotionSelector({ selectedEmotion, onEmotionChange }: EmotionSelectorProps) {
  const getEmotionBackgroundColor = (emotionId: string) => {
    switch (emotionId) {
      case 'positive':
        return '#E5FBF3';
      case 'negative':
        return '#FDE7ED';
      case 'neutral':
        return '#E4E3E8';
      default:
        return '#E4E3E8';
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {EMOTIONS.map((emotion) => (
        <button
          key={emotion.id}
          type="button"
          onClick={() => onEmotionChange(emotion.id)}
          className={`flex flex-col items-center p-4 border-2 rounded-lg hover:opacity-80 transition-all ${
            selectedEmotion === emotion.id
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-200"
          }`}
          style={{ 
            backgroundColor: selectedEmotion === emotion.id 
              ? getEmotionBackgroundColor(emotion.id)
              : getEmotionBackgroundColor(emotion.id)
          }}
        >
          <div 
            className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-lg bg-white shadow-sm"
          >
            {emotion.emoji}
          </div>
          <span className="text-sm font-medium text-gray-700">{emotion.label}</span>
        </button>
      ))}
    </div>
  );
}
