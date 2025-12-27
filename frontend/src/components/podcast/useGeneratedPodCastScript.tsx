import { useState } from "react";
import axios from "axios";
import {API_BASE_URL} from "@public/BaseURL.ts";

const useGeneratedScript = () => {
    const [givenAiPrompt, setGivenAiPrompt] = useState<string>("The Universe");
  const [loadingScript, setLoadingScript] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<string>("");

  const handleGenerate = async () => {
    try {
        setLoadingScript(true);
        const res = await axios.post(`${API_BASE_URL}/api/podcast/create-script`, {
          givenAiPrompt,
        });
        setGeneratedScript(res.data.scriptDescription || 'No Prompt');
        //toast.success("TTS text generated successfully!");
      } catch (err) {
        console.error(err);
        //toast.error("Failed to generate TTS text");
      } finally {
        setLoadingScript(false);
      }
  }
  return {
    givenAiPrompt,
    setGivenAiPrompt,
    loadingScript,
    setLoadingScript,
    generatedScript,
    setGeneratedScript,
    handleGenerate,
  }
}

export default useGeneratedScript