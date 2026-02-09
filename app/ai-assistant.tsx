import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '@/constants/theme';
import { restaurants } from '@/data/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

const QUICK_PROMPTS = [
  { label: '🍕 Best pizza nearby', prompt: 'What are the best pizza places nearby?' },
  { label: '🥗 Healthy options', prompt: 'Show me healthy food options' },
  { label: '🔥 Popular today', prompt: 'What is popular today?' },
  { label: '💰 Budget friendly', prompt: 'What are some budget-friendly restaurants?' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hi there! 👋 I'm your Foodify AI assistant. I can help you discover restaurants, find dishes you'll love, and make personalized recommendations. What are you in the mood for?",
    suggestions: ['Show me top rated restaurants', 'I want something spicy', 'Surprise me!'],
  },
];

function generateAIResponse(userMessage: string): Message {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('pizza')) {
    const pizzaPlaces = restaurants.filter((r) =>
      r.cuisine.some((c) => c.toLowerCase().includes('pizza') || c.toLowerCase().includes('italian')),
    );
    const names = pizzaPlaces.length > 0
      ? pizzaPlaces.map((r) => `${r.name} (⭐ ${r.rating})`).join(', ')
      : 'Bella Italia (⭐ 4.7), Pizza Paradise (⭐ 4.5)';
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Great choice! 🍕 Here are the best pizza places near you:\n\n${names}\n\nWould you like me to show you their menu?`,
      suggestions: ['Show me their menu', 'Any deals on pizza?'],
    };
  }

  if (lowerMsg.includes('healthy') || lowerMsg.includes('salad')) {
    const healthyPlaces = restaurants.filter((r) =>
      r.cuisine.some((c) => c.toLowerCase().includes('healthy') || c.toLowerCase().includes('salad')),
    );
    const names = healthyPlaces.length > 0
      ? healthyPlaces.map((r) => `${r.name} (⭐ ${r.rating})`).join(', ')
      : 'Green Garden (⭐ 4.6) has amazing salads and bowls.';
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Looking for healthy options! 🥗 Here are some great choices:\n\n${names}\n\nThey offer fresh, nutritious meals with calorie information!`,
      suggestions: ['Lowest calorie options?', 'Vegan restaurants'],
    };
  }

  if (lowerMsg.includes('popular') || lowerMsg.includes('top') || lowerMsg.includes('best')) {
    const topRated = [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 3);
    const list = topRated.map((r) => `• ${r.name} - ⭐ ${r.rating} (${r.cuisine.join(', ')})`).join('\n');
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Here are the top-rated restaurants right now! 🏆\n\n${list}\n\nAll of these have excellent reviews and fast delivery!`,
      suggestions: ['Tell me more about the first one', 'Show menus'],
    };
  }

  if (lowerMsg.includes('spicy') || lowerMsg.includes('hot')) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: "Love the heat! 🌶️ Here are some spicy options:\n\n• Thai Express has amazing spicy curries\n• Taco Fiesta serves fiery Mexican dishes\n• Spice Garden offers authentic Indian cuisine\n\nHow spicy do you like it?",
      suggestions: ['Medium spicy please', 'Bring on the fire! 🔥'],
    };
  }

  if (lowerMsg.includes('surprise') || lowerMsg.includes('random')) {
    const random = restaurants[Math.floor(Math.random() * restaurants.length)];
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Here's a surprise pick for you! 🎲\n\n**${random.name}** - ⭐ ${random.rating}\n${random.cuisine.join(', ')}\n${random.deliveryTime} delivery • ${random.distance}\n\nThey're highly rated and deliver fast!`,
      suggestions: ['Show me the menu', 'Surprise me again!'],
    };
  }

  if (lowerMsg.includes('budget') || lowerMsg.includes('cheap') || lowerMsg.includes('affordable')) {
    const affordable = restaurants.filter((r) => r.deliveryFee <= 2);
    const list = affordable.length > 0
      ? affordable.map((r) => `• ${r.name} - ${r.deliveryFee === 0 ? 'Free delivery!' : `$${r.deliveryFee} delivery`}`).join('\n')
      : '• Several restaurants offer free delivery today!';
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Budget-friendly picks! 💰\n\n${list}\n\nLook for restaurants with free delivery to save even more!`,
      suggestions: ['Free delivery restaurants', "Today's deals?"],
    };
  }

  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: "Great question! Based on your preferences, I'd recommend browsing our featured restaurants - they're hand-picked for quality and fast delivery.\n\nYou can also try searching for specific cuisines or dishes. What sounds good?",
    suggestions: ['Show featured restaurants', 'What cuisines are available?'],
  };
}

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simulate AI thinking time
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const aiResponse = generateAIResponse(text);
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [isTyping],
  );

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={16} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>Foodify AI</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {message.role === 'assistant' && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={12} color={Colors.white} />
                  </View>
                )}
                <View
                  style={[
                    styles.bubbleContent,
                    message.role === 'user' ? styles.userBubbleContent : styles.assistantBubbleContent,
                  ]}
                >
                  <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>
                    {message.content}
                  </Text>
                </View>
              </View>

              {message.suggestions && message.suggestions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsContainer}
                >
                  {message.suggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={`${message.id}-sug-${idx}`}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestionPress(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={12} color={Colors.white} />
              </View>
              <View style={[styles.bubbleContent, styles.assistantBubbleContent]}>
                <View style={styles.typingDots}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: Spacing.lg }} />
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickPromptsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptsList}
            >
              {QUICK_PROMPTS.map((item, index) => (
                <TouchableOpacity
                  key={`quick-${index}`}
                  style={styles.quickPromptCard}
                  onPress={() => handleSend(item.prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickPromptLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me anything about food..."
              placeholderTextColor={Colors.text.light}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={() => handleSend(inputText)}
              multiline={false}
              editable={!isTyping}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? Colors.white : Colors.text.light}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  bubbleContent: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubbleContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantBubbleContent: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    ...Shadows.small,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  suggestionsContainer: {
    paddingLeft: 44,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  quickPromptsContainer: {
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  quickPromptsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  quickPromptCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.small,
  },
  quickPromptLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  inputBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.xl,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[200],
  },
});
