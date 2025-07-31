import { EMOTIONS } from "@/lib/constants";

interface EmotionSelectorProps {
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
}

export default function EmotionSelector({ selectedEmotion, onEmotionChange }: EmotionSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {EMOTIONS.map((emotion) => (
        <button
          key={emotion.id}
          type="button"
          onClick={() => onEmotionChange(emotion.id)}
          className={`flex flex-col items-center p-4 border-2 rounded-lg hover:border-blue-400 transition-colors ${
            selectedEmotion === emotion.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <div 
            className="w-8 h-8 rounded-full mb-2 flex items-center justify-center"
            style={{ backgroundColor: emotion.color }}
          >
            <emotion.icon className="text-white" size={16} />
          </div>
          <span className="text-sm font-medium text-gray-700">{emotion.label}</span>
        </button>
      ))}
    </div>
  );
}
