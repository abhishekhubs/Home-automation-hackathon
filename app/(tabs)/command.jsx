import { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from '../../context/HomeContext';
import { callClaude, buildSmartHomeSystemPrompt } from '../../utils/claudeApi';

const EXAMPLE_COMMANDS = [
  "Set bedroom for sleep mode",
  "Turn everything off, I'm leaving",
  "It's getting cold, I have guests",
  "Set living room for movie night",
  "Optimize energy across all rooms",
];

function ResponseCard({ response }) {
  const [showReasoning, setShowReasoning] = useState(false);
  return (
    <View style={styles.responseCard}>
      <View style={styles.responseHeader}>
        <Text style={styles.responseIcon}>✅</Text>
        <Text style={styles.responseText}>{response.confirmation}</Text>
      </View>
      {response.actions?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {response.actions.map((a, i) => (
            <View key={i} style={styles.actionChip}>
              <Text style={styles.actionChipText}>{a.room} → {a.device} {a.state ? 'ON' : 'OFF'}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      {response.reasoning && (
        <TouchableOpacity style={styles.whyRow} onPress={() => setShowReasoning(!showReasoning)}>
          <Text style={styles.whyText}>{showReasoning ? '▲' : '▼'} Why did NEXUS do this?</Text>
        </TouchableOpacity>
      )}
      {showReasoning && <Text style={styles.reasoningText}>{response.reasoning}</Text>}
      {response.unknowns?.length > 0 && (
        <View style={styles.unknownsRow}>
          <Text style={styles.unknownsLabel}>⚠️ Couldn't find: </Text>
          {response.unknowns.map((u, i) => (
            <View key={i} style={styles.unknownChip}><Text style={styles.unknownText}>{u}</Text></View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CommandScreen() {
  const { state, dispatch } = useHome();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const lastCallRef = useRef(0);

  const handleSubmit = useCallback(async (text) => {
    const cmd = (text || input).trim();
    if (!cmd || isLoading) return;
    if (!state.apiKey) { setShowApiInput(true); return; }
    const now = Date.now();
    if (now - lastCallRef.current < 3000) { setError('Please wait 3 seconds between commands.'); return; }
    lastCallRef.current = now;
    setIsLoading(true); setError(null); setResponse(null);
    try {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const result = await callClaude(state.apiKey, buildSmartHomeSystemPrompt(state.rooms, time), cmd);
      if (result.actions?.length) dispatch({ type: 'APPLY_AI_ACTIONS', payload: { actions: result.actions } });
      setResponse(result);
      dispatch({ type: 'ADD_COMMAND', payload: cmd });
      setInput('');
    } catch (err) {
      setError(err.message === 'MALFORMED_JSON' ? "Couldn't parse response — try rephrasing." : err.message || 'Failed. Check your API key.');
    } finally { setIsLoading(false); }
  }, [input, isLoading, state.apiKey, state.rooms, dispatch]);

  const handleSaveApiKey = () => {
    dispatch({ type: 'SET_API_KEY', payload: apiKeyInput.trim() });
    setShowApiInput(false); setApiKeyInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>AI Command</Text>
              <Text style={styles.subtitle}>Natural language home control</Text>
            </View>
            <TouchableOpacity style={[styles.apiKeyBtn, state.apiKey && styles.apiKeyBtnSet]} onPress={() => setShowApiInput(true)}>
              <Text style={[styles.apiKeyText, state.apiKey && { color: '#059669' }]}>
                {state.apiKey ? '🔑 Key Set ✓' : '🔑 Set Key'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* API key form */}
          {showApiInput && (
            <View style={styles.apiKeyCard}>
              <Text style={styles.apiKeyTitle}>Claude API Key</Text>
              <Text style={styles.apiKeyHint}>Stored in memory only for this session</Text>
              <TextInput value={apiKeyInput} onChangeText={setApiKeyInput} placeholder="sk-ant-..." placeholderTextColor="#94a3b8" secureTextEntry style={styles.apiKeyInput} autoFocus onSubmitEditing={handleSaveApiKey} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey}>
                <Text style={styles.saveBtnText}>Save & Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput value={input} onChangeText={setInput} placeholder="Tell NEXUS what to do..." placeholderTextColor="#94a3b8" style={styles.textInput} multiline returnKeyType="send" onSubmitEditing={() => handleSubmit()} />
            <TouchableOpacity style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]} onPress={() => handleSubmit()} disabled={!input.trim() || isLoading}>
              <Text style={styles.sendBtnText}>{isLoading ? '···' : '➤'}</Text>
            </TouchableOpacity>
          </View>

          {/* History chips */}
          {state.commandHistory.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {state.commandHistory.slice(0, 5).map((cmd, i) => (
                <TouchableOpacity key={i} style={styles.historyChip} onPress={() => { setInput(cmd); handleSubmit(cmd); }}>
                  <Text style={styles.historyText} numberOfLines={1}>{cmd}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {isLoading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#6366f1" />
              <Text style={styles.loadingText}>NEXUS is thinking…</Text>
            </View>
          )}
          {error && <View style={styles.errorCard}><Text style={styles.errorText}>⚠️ {error}</Text></View>}
          {response && <ResponseCard response={response} />}

          {!response && !isLoading && (
            <View>
              <Text style={styles.examplesTitle}>TRY THESE COMMANDS</Text>
              {EXAMPLE_COMMANDS.map((cmd, i) => (
                <TouchableOpacity key={i} style={styles.exampleBtn} onPress={() => setInput(cmd)}>
                  <Text style={styles.exampleText}>"{cmd}"</Text>
                  <Text style={styles.exampleArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  apiKeyBtn: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#fcd34d' },
  apiKeyBtnSet: { backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
  apiKeyText: { fontSize: 12, fontWeight: '700', color: '#d97706' },
  apiKeyCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  apiKeyTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  apiKeyHint: { fontSize: 11, color: '#94a3b8', marginBottom: 10 },
  apiKeyInput: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b', padding: 12, fontFamily: 'monospace', marginBottom: 10 },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  inputBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'flex-end', marginBottom: 12, padding: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  textInput: { flex: 1, color: '#1e293b', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { backgroundColor: '#6366f1', borderRadius: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', margin: 4 },
  sendBtnDisabled: { backgroundColor: '#e2e8f0' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  historyChip: { backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, maxWidth: 180, borderWidth: 1, borderColor: '#e2e8f0' },
  historyText: { color: '#64748b', fontSize: 12 },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  loadingText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  errorCard: { backgroundColor: '#fee2e2', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#fca5a5' },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  responseCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#c7d2fe', shadowColor: '#6366f1', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  responseHeader: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  responseIcon: { fontSize: 20 },
  responseText: { flex: 1, color: '#1e293b', fontSize: 14, lineHeight: 20 },
  actionChip: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, borderWidth: 1, borderColor: '#c4b5fd' },
  actionChipText: { color: '#6366f1', fontSize: 11, fontWeight: '700' },
  whyRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  whyText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  reasoningText: { color: '#64748b', fontSize: 12, lineHeight: 18, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginTop: 4 },
  unknownsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  unknownsLabel: { color: '#d97706', fontSize: 12, fontWeight: '600' },
  unknownChip: { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  unknownText: { color: '#d97706', fontSize: 11, fontWeight: '600' },
  examplesTitle: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  exampleBtn: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exampleText: { color: '#64748b', fontSize: 13, flex: 1 },
  exampleArrow: { color: '#6366f1', fontSize: 20, fontWeight: '700' },
});
