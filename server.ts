// Update conversation history if it exists (it should always exist at this point)
if (history) {
  // Add user message to history
  history.push({ role: "user", content: message });
  
  // Add response to history
  history.push({ role: "assistant", content: responseText });
  
  // Keep conversation history manageable (max 10 messages excluding system prompt)
  if (history.length > 11) {
    const systemPrompt = history[0];
    history.splice(1, history.length - 11); // Remove oldest messages
    history[0] = systemPrompt; // Keep system prompt at the beginning
  }
}
