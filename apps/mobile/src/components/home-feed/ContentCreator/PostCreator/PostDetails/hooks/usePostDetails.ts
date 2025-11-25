/**
 * usePostDetails Hook
 * PostDetails state ve logic yönetimi
 */

import { useState } from "react";
import * as Haptics from "expo-haptics";
import type { PostSettings } from "../../types";
import type { PollData } from "../../types";

export function usePostDetails() {
  const [caption, setCaption] = useState("");

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState<PollData["duration"]>("24h");

  // Settings state
  const [settings, setSettings] = useState<PostSettings>({
    hideComments: false,
    hideLikes: false,
    hideShareCount: false,
    audience: "followers"
  });

  // Poll actions
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      Haptics.selectionAsync();
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      Haptics.selectionAsync();
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const togglePoll = () => {
    Haptics.selectionAsync();
    setShowPoll(!showPoll);
  };

  // Build poll data
  const getPollData = (): PollData | undefined => {
    if (!showPoll || !pollQuestion.trim()) return undefined;
    return {
      question: pollQuestion.trim(),
      options: pollOptions.filter((o) => o.trim()),
      duration: pollDuration
    };
  };

  return {
    // Caption
    caption,
    setCaption,
    // Poll
    showPoll,
    togglePoll,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    pollDuration,
    setPollDuration,
    addPollOption,
    removePollOption,
    updatePollOption,
    getPollData,
    // Settings
    settings,
    setSettings,
    setAudience: (audience: PostSettings["audience"]) => {
      setSettings((prev) => ({ ...prev, audience }));
    }
  };
}
