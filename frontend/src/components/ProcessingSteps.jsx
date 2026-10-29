import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react'

const PIPELINE_STEPS = [
  { id: 'receiving', label: 'Receiving Call' },
  { id: 'transcribing', label: 'Converting Speech to Text' },
  { id: 'preprocessing', label: 'Text Preprocessing' },
  { id: 'intent', label: 'Detecting Intent' },
  { id: 'severity', label: 'Classifying Severity' },
  { id: 'entities', label: 'Extracting Information' },
  { id: 'protocol', label: 'Retrieving Protocol' },
  { id: 'recommendation', label: 'Generating Recommendation' },
  { id: 'waiting', label: 'Waiting for Operator Decision' },
]

export default function ProcessingSteps({ currentStep, error }) {
  const currentIndex = PIPELINE_STEPS.findIndex(s => s.id === currentStep)

  return (
    <div className="space-y-1">
      {PIPELINE_STEPS.map((step, idx) => {
        const isDone = currentIndex > idx
        const isActive = currentIndex === idx
        const isPending = currentIndex < idx

        return (
          <div key={step.id} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-emergency-blue/10 border border-emergency-blue/20' : ''}`}>
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : isActive ? (
              error ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-emergency-blue shrink-0 animate-spin" />
              )
            ) : (
              <Circle className="w-4 h-4 text-gray-600 shrink-0" />
            )}
            <span className={`text-xs font-medium ${isDone ? 'text-emerald-400' : isActive ? 'text-emergency-blue' : 'text-gray-600'}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
