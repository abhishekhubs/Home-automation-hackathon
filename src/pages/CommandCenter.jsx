import { useState, useRef, useCallback, useEffect } from 'react';
import { useHome } from '../context/HomeContext';
import { callGroq, buildSmartHomeSystemPrompt } from '../utils/groqApi';
import { Send, Mic, MicOff, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Key, X } from 'lucide-react';

const EXAMPLE_COMMANDS = [
  "Set bedroom for sleep mode",
  "Turn everything off, I'm leaving",
  "It's getting cold, I have guests in 20 minutes",
  "Set living room for movie night",
  "Optimize energy usage across all rooms",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="text-sm text-gray-400">decode is thinking</span>
      <div className="flex gap-1 ml-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ResponseCard({ response }) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className="glass-card p-4 animate-slide-up border border-indigo-500/20">
      {/* Confirmation */}
      <div className="flex items-start gap-3 mb-3">
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-200 leading-relaxed">{response.confirmation}</p>
      </div>

      {/* Actions applied */}
      {response.actions?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {response.actions.map((a, i) => (
            <span key={i} className="text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full px-3 py-1">
              {a.room} → {a.device} {a.state ? 'ON' : 'OFF'}{a.value ? ` (${a.value})` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning collapsible */}
      {response.reasoning && (
        <div className="border-t border-gray-800/60 pt-3">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Why did decode do this?
          </button>
          {showReasoning && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed bg-gray-900/50 rounded-lg p-3">
              {response.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Unknowns */}
      {response.unknowns?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800/60">
          <div className="flex items-center gap-1 text-xs text-amber-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Couldn't find:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {response.unknowns.map((u, i) => (
              <span key={i} className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded px-2 py-0.5">
                {u}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommandCenter({ initialContext }) {
  const { state, dispatch } = useHome();
  const [input, setInput] = useState(initialContext || '');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const lastCallRef = useRef(0);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Pre-fill from dashboard "Ask AI" button
  useEffect(() => {
    if (initialContext) {
      setInput(initialContext);
      inputRef.current?.focus();
    }
  }, [initialContext]);

  const handleSubmit = useCallback(async (text) => {
    const cmd = (text || input).trim();
    if (!cmd || isLoading) return;

    // Rate limit: 1 per 3s
    const now = Date.now();
    if (now - lastCallRef.current < 3000) {
      setError('Please wait a moment before sending another command.');
      return;
    }
    lastCallRef.current = now;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const systemPrompt = buildSmartHomeSystemPrompt(state.rooms, time);
      const result = await callGroq(state.apiKey, systemPrompt, cmd);

      // Apply actions to global state
      if (result.actions?.length > 0) {
        dispatch({ type: 'APPLY_AI_ACTIONS', payload: { actions: result.actions } });
      }

      setResponse(result);
      dispatch({ type: 'ADD_COMMAND', payload: cmd });
      setInput('');
    } catch (err) {
      if (err.message === 'MALFORMED_JSON') {
        setError("I understood your request but couldn't process it — try rephrasing.");
      } else {
        setError(err.message || 'Failed to connect to AI. Check your API key.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, state.apiKey, state.rooms, dispatch]);

  const handleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => handleSubmit(transcript), 300);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [isListening, handleSubmit]);

  const handleSaveApiKey = () => {
    dispatch({ type: 'SET_API_KEY', payload: apiKeyInput.trim() });
    setShowApiInput(false);
    setApiKeyInput('');
  };

  return (
    <div className="p-4 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">AI Command Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Natural language smart home control</p>
        </div>
      </div>



      {/* Input bar */}
      <div className="glass-card p-1 mb-4 flex items-center gap-2">
        <input
          ref={inputRef}
          id="command-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Tell decode what to do... 'Turn on bedroom lights' or 'Set sleep mode'"
          className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-200 focus:outline-none placeholder-gray-600"
          disabled={isLoading}
        />
        <button
          id="voice-btn"
          onClick={handleVoice}
          className={`p-2.5 rounded-xl transition-all duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          id="send-btn"
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isLoading}
          className="btn-primary px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Command history chips */}
      {state.commandHistory.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {state.commandHistory.slice(0, 5).map((cmd, i) => (
            <button
              key={i}
              onClick={() => { setInput(cmd); handleSubmit(cmd); }}
              className="text-xs bg-gray-800/70 hover:bg-gray-700 border border-gray-700/50 text-gray-400 hover:text-gray-200 rounded-full px-3 py-1.5 transition-all max-w-[200px] truncate"
              title={cmd}
            >
              {cmd}
            </button>
          ))}
        </div>
      )}

      {/* Response area */}
      {isLoading && (
        <div className="glass-card mb-4">
          <TypingIndicator />
        </div>
      )}

      {error && (
        <div className="glass-card p-4 mb-4 border border-red-500/30 bg-red-500/5 animate-slide-up">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {response && <ResponseCard response={response} />}

      {/* Example commands */}
      {!response && !isLoading && (
        <div className="mt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Try these commands</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                onClick={() => { setInput(cmd); }}
                className="text-left text-sm bg-gray-900/50 hover:bg-gray-800/60 border border-gray-800 hover:border-indigo-500/30 text-gray-400 hover:text-gray-200 rounded-xl px-4 py-3 transition-all duration-200"
              >
                "{cmd}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
