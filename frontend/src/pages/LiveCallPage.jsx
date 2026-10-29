import { useState, useRef } from 'react'
import {
  Mic, MicOff, Upload, Send, RotateCcw, CheckCircle, PenLine,
  XCircle, MapPin, Users, Car, AlertCircle, Zap, FileText,
  ChevronRight, Info, AlertTriangle, Loader2
} from 'lucide-react'
import { analyzeCall, transcribeAudio, submitOperatorDecision } from '../services/api'
import { SeverityBadge, ConfidenceBadge } from '../components/Badges'
import { pct, formatDateTime, INTENT_EMOJIS } from '../utils/helpers'
import ProcessingSteps from '../components/ProcessingSteps'
import Header from '../components/Header'

const DEMO_INPUT =
  "There has been a major road accident near Vadapalani. Two cars have collided and three people are injured. Please send an ambulance immediately."

const ALL_SERVICES = [
  'Ambulance', 'Police', 'Fire & Rescue', 'Paramedic Team',
  'Search & Rescue', 'Disaster Management', 'Coastal Guard'
]

export default function LiveCallPage() {
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [callId, setCallId] = useState(null)

  // Human-in-the-loop state
  const [showDecision, setShowDecision] = useState(false)
  const [decisionMode, setDecisionMode] = useState(null) // 'accept' | 'modify' | 'reject'
  const [operatorNotes, setOperatorNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [modifiedServices, setModifiedServices] = useState([])
  const [modifiedSeverity, setModifiedSeverity] = useState('')
  const [decisionResult, setDecisionResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Recording
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const stepDelay = (step, ms = 400) =>
    new Promise(r => { setCurrentStep(step); setTimeout(r, ms) })

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript or record audio first.')
      return
    }
    setError('')
    setAnalysis(null)
    setDecisionResult(null)
    setShowDecision(false)
    setDecisionMode(null)
    setProcessing(true)
    setCallId(null)

    try {
      await stepDelay('receiving', 400)
      await stepDelay('transcribing', 300)
      await stepDelay('preprocessing', 300)
      await stepDelay('intent', 500)
      await stepDelay('severity', 500)
      await stepDelay('entities', 500)
      await stepDelay('protocol', 500)
      await stepDelay('recommendation', 500)

      const { data } = await analyzeCall(transcript, true)
      setAnalysis(data)
      setCallId(data.call_id)
      setModifiedServices(data.recommended_services || [])
      setModifiedSeverity(data.severity || 'HIGH')

      setCurrentStep('waiting')
      setShowDecision(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
      setCurrentStep(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleTranscribeAudio = async (file) => {
    setError('')
    setProcessing(true)
    setCurrentStep('transcribing')
    try {
      const { data } = await transcribeAudio(file)
      setTranscript(data.transcript)
      setCurrentStep(null)
      if (data.source === 'demo') {
        setError('ℹ️ Whisper not available — demo transcript loaded. You can edit it before analyzing.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Audio transcription failed.')
      setCurrentStep(null)
    } finally {
      setProcessing(false)
    }
  }

  const startRecording = async () => {
    setError('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Your browser does not support built-in speech recognition. Please use Chrome.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setRecording(true)
        setTranscript('')
      }

      recognition.onresult = (event) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        setTranscript(currentTranscript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error)
        setError(`Microphone error: ${event.error}`)
        setRecording(false)
      }

      recognition.onend = () => {
        setRecording(false)
      }

      mediaRecorderRef.current = recognition
      recognition.start()
    } catch (err) {
      setError('Failed to start microphone. Please ensure permissions are granted.')
      setRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) handleTranscribeAudio(file)
  }

  const submitDecision = async () => {
    if (!callId) return
    setSubmitting(true)
    try {
      const payload = {
        call_id: callId,
        operator_action: decisionMode.toUpperCase(),
        operator_notes: operatorNotes,
      }
      if (decisionMode === 'modify') {
        payload.final_services = modifiedServices
        payload.final_severity = modifiedSeverity
      }
      if (decisionMode === 'reject') {
        payload.rejection_reason = rejectionReason
      }
      const { data } = await submitOperatorDecision(payload)
      setDecisionResult(data)
      setShowDecision(false)
      setCurrentStep(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit decision.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setTranscript('')
    setAnalysis(null)
    setDecisionResult(null)
    setShowDecision(false)
    setDecisionMode(null)
    setCurrentStep(null)
    setError('')
    setCallId(null)
    setOperatorNotes('')
    setRejectionReason('')
  }

  const toggleService = (svc) => {
    setModifiedServices(prev =>
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Live Call Analysis" subtitle="AI-powered emergency call processing" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

          {/* ── LEFT: Input Panel ── */}
          <div className="space-y-4">

            {/* Transcript input */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emergency-blue" />
                  Emergency Call Input
                </h3>
                <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Audio controls */}
              <div className="flex gap-2 mb-4">
                <button
                  id="start-recording-btn"
                  onClick={startRecording}
                  disabled={recording || processing}
                  className={`btn-primary flex-1 justify-center ${recording ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Mic className="w-4 h-4" />
                  {recording ? 'Recording...' : 'Start Recording'}
                </button>
                <button
                  id="stop-recording-btn"
                  onClick={stopRecording}
                  disabled={!recording}
                  className="btn-danger flex-1 justify-center"
                >
                  <MicOff className="w-4 h-4" />
                  Stop
                </button>
                <label className="btn-ghost cursor-pointer flex-1 justify-center">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Text area */}
              <textarea
                id="transcript-input"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder={`Type emergency transcript here...\n\nExample:\n"${DEMO_INPUT}"`}
                className="input-field resize-none h-36 text-sm leading-relaxed"
              />

              {/* Demo fill button */}
              <button
                onClick={() => setTranscript(DEMO_INPUT)}
                className="mt-2 text-xs text-gray-500 hover:text-emergency-blue transition-colors"
              >
                → Load sample emergency call
              </button>

              {error && (
                <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${error.startsWith('ℹ️') ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                disabled={processing || !transcript.trim()}
                className="btn-primary w-full justify-center mt-4 py-3"
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Call...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Analyze Call</>
                )}
              </button>
            </div>

            {/* Processing Steps */}
            {(processing || currentStep) && (
              <div className="card animate-fade-in">
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emergency-blue animate-spin" />
                  Processing Pipeline
                </h3>
                <ProcessingSteps currentStep={currentStep} error={!!error} />
              </div>
            )}

            {/* Decision Result */}
            {decisionResult && (
              <div className="card border border-green-500/30 bg-green-500/5 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-green-400">Decision Recorded</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Call ID:</span>
                    <span className="font-mono text-emergency-blue">{decisionResult.call_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Action:</span>
                    <span className={`font-bold ${decisionResult.operator_action === 'ACCEPT' ? 'text-green-400' : decisionResult.operator_action === 'MODIFY' ? 'text-blue-400' : 'text-red-400'}`}>
                      {decisionResult.operator_action}
                    </span>
                  </div>
                  {decisionResult.final_decision?.services?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Services:</span>
                      <span className="text-gray-300">{decisionResult.final_decision.services.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: AI Analysis ── */}
          <div className="space-y-4">
            {analysis ? (
              <>
                {/* Transcript display */}
                <div className="card">
                  <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Call Transcript
                  </h3>
                  <div className="bg-emergency-navy rounded-lg p-4 text-sm text-gray-300 leading-relaxed italic border border-emergency-border">
                    "{transcript}"
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Source: {analysis.ai_mode === 'nlp_pipeline' ? 'NLP Pipeline' : 'AI Model'}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                </div>

                {/* Intent & Severity */}
                <div className="card">
                  <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    AI Analysis Results
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-emergency-navy rounded-lg p-3 border border-emergency-border">
                      <p className="text-xs text-gray-500 mb-1">Intent</p>
                      <p className="font-bold text-white text-sm">
                        {INTENT_EMOJIS[analysis.intent] || '⚠️'} {analysis.intent}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: <ConfidenceBadge value={analysis.confidence} />
                      </p>
                    </div>
                    <div className="bg-emergency-navy rounded-lg p-3 border border-emergency-border">
                      <p className="text-xs text-gray-500 mb-1">Severity</p>
                      <SeverityBadge severity={analysis.severity} />
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: <ConfidenceBadge value={analysis.severity_confidence} />
                      </p>
                    </div>
                  </div>

                  {/* Entities */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {analysis.entities?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white font-medium truncate">{analysis.entities.location}</span>
                      </div>
                    )}
                    {analysis.entities?.people && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-400">People:</span>
                        <span className="text-white font-medium">{analysis.entities.people}</span>
                      </div>
                    )}
                    {analysis.entities?.vehicles && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-400">Vehicles:</span>
                        <span className="text-white font-medium">{analysis.entities.vehicles}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-400">Injuries:</span>
                      <span className={`font-medium ${analysis.entities?.injuries ? 'text-red-400' : 'text-green-400'}`}>
                        {analysis.entities?.injuries ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {analysis.entities?.accident_type && (
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white font-medium">{analysis.entities.accident_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Recommended services */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Recommended Services</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommended_services?.map(svc => (
                        <span key={svc} className="bg-emergency-blue/20 text-emergency-blue border border-emergency-blue/30 px-3 py-1 rounded-full text-xs font-semibold">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-emergency-navy rounded-lg p-3 border border-emergency-border">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> AI Explanation
                    </p>
                    <p className="text-xs text-gray-300 leading-relaxed">{analysis.explanation}</p>
                  </div>
                </div>

                {/* Protocol */}
                <div className="card">
                  <h3 className="font-semibold text-white text-sm mb-3">Emergency Protocol</h3>
                  <ol className="space-y-2">
                    {analysis.protocol?.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-emergency-blue/20 border border-emergency-blue/30 text-emergency-blue text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {i + 1}
                        </span>
                        <span className="text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              <div className="card h-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emergency-blue/10 border border-emergency-blue/20 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-emergency-blue/50" />
                </div>
                <p className="text-gray-500 text-sm">AI analysis results will appear here</p>
                <p className="text-gray-600 text-xs mt-2">Enter a transcript and click "Analyze Call"</p>
              </div>
            )}
          </div>
        </div>

        {/* ── HUMAN-IN-THE-LOOP Decision Panel ── */}
        {showDecision && analysis && !decisionResult && (
          <div className="card border-2 border-emergency-blue/40 bg-emergency-blue/5 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emergency-blue/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-emergency-blue" />
              </div>
              <div>
                <h3 className="font-bold text-white">Operator Decision Required</h3>
                <p className="text-xs text-gray-400">The AI has made a recommendation. You must review and make the final decision.</p>
              </div>
              <div className="ml-auto text-xs text-gray-500 font-mono">Call ID: {callId}</div>
            </div>

            {/* Decision mode selector */}
            {!decisionMode && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  id="accept-btn"
                  onClick={() => setDecisionMode('accept')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-green-500/10 border border-green-500/30 hover:border-green-400/60 hover:bg-green-500/15 transition-all group"
                >
                  <CheckCircle className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-green-400">Accept</span>
                  <span className="text-xs text-gray-500 text-center">Approve AI recommendation</span>
                </button>
                <button
                  id="modify-btn"
                  onClick={() => setDecisionMode('modify')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/15 transition-all group"
                >
                  <PenLine className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-blue-400">Modify</span>
                  <span className="text-xs text-gray-500 text-center">Edit and save changes</span>
                </button>
                <button
                  id="reject-btn"
                  onClick={() => setDecisionMode('reject')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-400/60 hover:bg-red-500/15 transition-all group"
                >
                  <XCircle className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-red-400">Reject</span>
                  <span className="text-xs text-gray-500 text-center">Reject AI recommendation</span>
                </button>
              </div>
            )}

            {/* ACCEPT confirmation */}
            {decisionMode === 'accept' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Accepting AI Recommendation</span>
                </div>
                <div className="bg-emergency-navy rounded-lg p-3 text-sm border border-emergency-border">
                  <p className="text-gray-400 mb-1">Services to dispatch:</p>
                  <p className="text-white font-semibold">{analysis.recommended_services?.join(' + ')}</p>
                </div>
                <textarea
                  value={operatorNotes}
                  onChange={e => setOperatorNotes(e.target.value)}
                  placeholder="Operator notes (optional)..."
                  className="input-field resize-none h-16 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => setDecisionMode(null)} className="btn-ghost">Back</button>
                  <button id="confirm-accept-btn" onClick={submitDecision} disabled={submitting} className="btn-success flex-1 justify-center">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Confirm Accept</>}
                  </button>
                </div>
              </div>
            )}

            {/* MODIFY form */}
            {decisionMode === 'modify' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <PenLine className="w-5 h-5" />
                  <span className="font-semibold">Modifying AI Recommendation</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Services to Dispatch</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SERVICES.map(svc => (
                      <button
                        key={svc}
                        onClick={() => toggleService(svc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${modifiedServices.includes(svc)
                          ? 'bg-emergency-blue/30 text-white border-emergency-blue/60'
                          : 'bg-transparent text-gray-500 border-emergency-border hover:border-gray-400'
                          }`}
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Severity Override</p>
                  <div className="flex gap-2">
                    {['HIGH', 'MEDIUM', 'LOW'].map(sev => (
                      <button
                        key={sev}
                        onClick={() => setModifiedSeverity(sev)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${modifiedSeverity === sev
                          ? sev === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/50' : sev === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-green-500/20 text-green-400 border-green-500/50'
                          : 'bg-transparent text-gray-500 border-emergency-border'
                          }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={operatorNotes}
                  onChange={e => setOperatorNotes(e.target.value)}
                  placeholder="Reason for modification..."
                  className="input-field resize-none h-16 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => setDecisionMode(null)} className="btn-ghost">Back</button>
                  <button id="confirm-modify-btn" onClick={submitDecision} disabled={submitting || modifiedServices.length === 0} className="btn-primary flex-1 justify-center">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Send className="w-4 h-4" /> Save Modified Decision</>}
                  </button>
                </div>
              </div>
            )}

            {/* REJECT form */}
            {decisionMode === 'reject' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Rejecting AI Recommendation</span>
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (required)..."
                  className="input-field resize-none h-20 text-sm border-red-500/30"
                />
                <textarea
                  value={operatorNotes}
                  onChange={e => setOperatorNotes(e.target.value)}
                  placeholder="Additional operator notes (optional)..."
                  className="input-field resize-none h-16 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => setDecisionMode(null)} className="btn-ghost">Back</button>
                  <button
                    id="confirm-reject-btn"
                    onClick={submitDecision}
                    disabled={submitting || !rejectionReason.trim()}
                    className="btn-danger flex-1 justify-center"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><XCircle className="w-4 h-4" /> Confirm Reject</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
