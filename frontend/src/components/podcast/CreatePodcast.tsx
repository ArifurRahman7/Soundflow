import React, { useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import {CreateScriptModal} from "./CreatePodcastScriptModal.tsx";
import {API_BASE_URL} from "@public/BaseURL.ts";
import useGeneratedScript from "./useGeneratedPodCastScript.tsx"; 
import { usePodcastStore } from "@/stores/usePodcastStore.ts";

const GROQ_VOICE = [
  // Groq TTS voices
  { label: "Arista", value: "Arista-PlayAI" },
  { label: "Atlas", value: "Atlas-PlayAI" },
  { label: "Basil", value: "Basil-PlayAI" },
  { label: "Briggs", value: "Briggs-PlayAI" },
  { label: "Calum", value: "Calum-PlayAI" },
  { label: "Celeste", value: "Celeste-PlayAI" },
  { label: "Cheyenne", value: "Cheyenne-PlayAI" },
  { label: "Chip", value: "Chip-PlayAI" },
  { label: "Cillian", value: "Cillian-PlayAI" },
  { label: "Deedee", value: "Deedee-PlayAI" },
  { label: "Fritz", value: "Fritz-PlayAI" },
  { label: "Gail", value: "Gail-PlayAI" },
  { label: "Indigo", value: "Indigo-PlayAI" },
  { label: "Mamaw", value: "Mamaw-PlayAI" },
  { label: "Mason", value: "Mason-PlayAI" },
  { label: "Mikail", value: "Mikail-PlayAI" },
  { label: "Mitch", value: "Mitch-PlayAI" },
  { label: "Quinn", value: "Quinn-PlayAI" },
  { label: "Thunder", value: "Thunder-PlayAI" }
];

const CATEGORIES = [
  "Education",
  "Technology",
  "Entertainment",
  "Business",
  "Health",
  "Science",
  "History",
  "Music",
  "Sports",
  "News",
  "Comedy",
  "Society",
  "Culture",
  "Arts",
  "Other",
];

// helper function to upload files to cloudinary 
// const uploadToCloudinary = async (file) => {
//     try {
//         const result = await cloudinary.uploader.upload(file.tempFilePath, {
//             resource_type:"auto"
//         })
//         return result.secure_url;
//     } catch (error) {
//         console.log("Error in uploading to cloudinary",error);
//         throw new Error("Error in uploading to cloudinary");
//     }
// }

const CreatePodcast = () => {
  //context from the modal
  
  const {
    givenAiPrompt,
    setGivenAiPrompt,
    generatedScript,
    loadingScript,
    setGeneratedScript,
    handleGenerate,
  } = useGeneratedScript()

  const [scriptText, setScriptText] = useState<string>("")
  const handleUseScript = () => {
    setScriptText(generatedScript);
    //setShowScriptModal(false);
  };


  const [podcastTitle, setPodcastTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailPrompt, setThumbnailPrompt] = useState("");
  const [aiVoice, setaiVoice] = useState(GROQ_VOICE[0].value);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  let [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [aiThumbnailUrl, setAiThumbnailUrl] = useState<string | null>(null);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sampleAudioRef = useRef<HTMLAudioElement>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  const [aiGuestVoice, setaiGuestVoice] = useState(GROQ_VOICE[2].value);

  const addPodcast = usePodcastStore((s) => s.addPodcast);
  const podcastList = usePodcastStore((s) => s.podcastList);
  const { user } = useUser();

  // Remove audio upload input/button and handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("imageFile", file);
      setIsUploadingImage(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/api/podcast/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Image uploaded successfully!");
        setAiThumbnailUrl(res.data.imageUrl);
        // No toast on success
      } catch (err: any) {
        // No toast on error
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Call your backend to generate Podcast audio
  const handleGeneratePodcast = async () => {
    if (!scriptText) {
      toast.error("Please enter the AI prompt to generate Podcast audio");
      return;
    }
    if (!podcastTitle || !category || !description) {
      toast.error("Please fill in the Podcast title, category, and description before generating audio");
      return;
    }
    setGeneratingAudio(true);
    setAiAudioUrl(null);
    setAudioFile(null); // Reset audio file before generating
    try {
      const res = await axios.post(`${API_BASE_URL}/api/podcast/generate`, {
        script: scriptText,
        model: 'playai-tts',
        aiVoice,
        aiGuestVoice,
        description,
      });
      // Use only the Cloudinary URL returned by backend
      const audioUrl = res.data.audioUrl;
      setAiAudioUrl(audioUrl); // Cloudinary URL only
      // Fetch the audio file as a Blob and store as File for upload (if needed elsewhere)
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();
      const fileName = audioUrl.split('/').pop() || 'ai-audio.wav';
      const file = new File([audioBlob], fileName, { type: audioBlob.type });
      setAudioFile(file);
      toast.success("Podcast Audio generated!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to generate Podcast audio");
    } finally {
      setGeneratingAudio(false);
    }
  };

  // Call your backend to generate a thumbnail using OpenAI
  const handleGenerateThumbnail = async () => {
    if (!thumbnailPrompt) return;
    setGeneratingThumbnail(true);
    setAiThumbnailUrl(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/podcast/thumbnail`, {
          prompt: thumbnailPrompt
      });
      setAiThumbnailUrl(res.data.imageUrl); // Your backend should return a URL or base64 image
    } catch (err) {
      //alert("Failed to generate thumbnail");
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    // Validate required fields
    if (podcastTitle === "" || category === "" || description === "" || !audioFile || !aiThumbnailUrl) {
      toast.error("Please enter all details");
      return;
    }
    // Prevent duplicate Podcast (same title, description, audio, and thumbnail)
    const isDuplicate = podcastList.some(
      (p) =>
        p.title === podcastTitle &&
        p.description === description &&
        p.audioUrl === aiAudioUrl &&
        p.thumbnailUrl === aiThumbnailUrl
    );
    if (isDuplicate) {
      toast.error("You cannot create the same Podcast twice");
      return;
    }
    if (!user) {
      toast.error("You must be signed in to create a Podcast");
      return;
    }
    //push in dbms
    const formData = new FormData();
    formData.append("userName", user.fullName!);
    formData.append("title", podcastTitle);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("aiVoice", aiVoice);//host voice
    formData.append("aiGuestVoice", aiGuestVoice);
    formData.append("aiPodcastPrompt", generatedScript);
    formData.append("aiThumbnailPrompt", thumbnailPrompt);

    // It is both aithumbnailUrl and customImage, but we only use aiThumbnailUrl now
    formData.append("aiThumbnailURL", aiThumbnailUrl!); // Always a Cloudinary URL now, aiThumbnailUrl is set after image upload
    // Don't send customImage, only send aiThumbnailUrl (Cloudinary URL)
    formData.append("audiourl", aiAudioUrl!); // Always a Cloudinary URL
    // Don't send audioFile, only send aiAudioUrl (Cloudinary URL)
    // ...existing code...
    console.log("Audio file to upload:", aiAudioUrl);
    console.log("Thumbnail:", aiThumbnailUrl);
    // console.log("Form data prepared for submission:", formData);
    // console.log("audio", formData.get("audioFile"));
    // console.log("image", formData.get("imageFile"));

    setIsCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/api/podcast/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Podcast created successfully!");

      const newPodcast = {
        title: podcastTitle,
        category,
        description,
        audioUrl: aiAudioUrl!,
        thumbnailUrl: aiThumbnailUrl || "", // Ensure string type
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      

      addPodcast(newPodcast);
      // console.log("Toast should show now");
      // Optionally reset form fields here
    } finally {
      setIsCreating(false);
    }
  };

  // Only allow Podcast creation if all required fields are present (no fallback to customImage)
  // const isFormComplete = PodcastTitle && category && description && aiAudioUrl && aiThumbnailUrl;

  // Play audio automatically when aiAudioUrl is set
  React.useEffect(() => {
    if (aiAudioUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [aiAudioUrl]);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (!hasMounted) return; // Don't run on initial mount
    if (!aiVoice) return;
    // Generate sample audio for preview when voice changes (background, no autoplay)
    const fetchSample = async () => {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/podcast/generate-sample`, {
          text: "Hello, I was built by ahanaf. Select me if you like my voice",
          model: 'playai-tts',
          voice: aiVoice,
          description: "Sample audio preview",
        });
        setSampleAudioUrl(res.data.audioUrl);
      } catch (err) {
        setSampleAudioUrl(null);
      }
    };
    fetchSample();
  }, [aiVoice, hasMounted]);
  const [loading, setLoading] = useState(false);

  //const [showScriptModal, setShowScriptModal] = useState(false);


  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[#181A20] rounded-lg border border-[#2A2D36] p-6 w-full max-w-xl mx-auto mt-8 mb-4"
      >
        <h2 className="text-white text-xl font-semibold mb-6">Create a Podcast</h2>
        <div className="mb-4">
          <label className="block text-zinc-300 mb-1">Podcast title</label>
          <input
            type="text"
            className="w-full bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-white focus:outline-none focus:border-orange-400"
            placeholder="Enter Podcast title"
            value={podcastTitle}
            onChange={e => setPodcastTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-zinc-300 mb-1">Category</label>
          <div className="relative">
            <select
              className="w-full bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-zinc-400 focus:outline-none max-h-40 overflow-y-auto"
              value={category}
              onChange={
                
                      async (e) => {
                      const selectedCategory = e.target.value;
                      setCategory(selectedCategory);

                      if (!selectedCategory || !podcastTitle){
                        toast.error("Please select Both Title and a Category.");
                        return;
                      }

                      try {
                        setLoading(true);
                        

                        // Request Gemini to generate description based on category
                        const res = await axios.post(`${API_BASE_URL}/api/podcast/description`, {
                          podcastTitle: podcastTitle,
                          category: selectedCategory
                        });
                        // console.log("Sending category:", res.data.description);
                        //console.log("Sending category:", res.data.description);
                        setDescription(res.data.description || "No description generated.");
                        
                      } catch (err) {
                        setDescription("Failed to generate description.");
                      } finally {
                        setLoading(false);
                      }
                    }
              }
              size={1}
              style={{ maxHeight: 160, overflowY: 'auto' }}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {loading ? (
        <p className="mt-2 text-zinc-400">Generating Description
        <span className="dot-animation ml-1"></span>
        </p>
      ) : null}
      <style>{`
    .dot-animation::after {
      content: '';
      display: inline-block;
      animation: dots 1.4s steps(3, end) infinite;
    }

    @keyframes dots {
      0% {
        content: '';
      }
      33% {
        content: '.';
      }
      66% {
        content: '..';
      }
      100% {
        content: '...';
      }
    }
  `}</style>


        </div>
        
        <div className="mb-4">
          <label className="block text-zinc-300 mb-1">Description</label>
          <textarea
            className="w-full bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-white focus:outline-none"
            placeholder="Write a short description about the Podcast(max 10 Words)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        {/* host voice*/}
        <div className="mb-4">
          <label className="block text-zinc-300 mb-1">Select Host Voice</label>
          <select
            className="w-full bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-zinc-400 focus:outline-none"
            value={aiVoice}
            onChange={e => setaiVoice(e.target.value)}
          >
            {GROQ_VOICE.map((voice) => (
              <option key={voice.value} value={voice.value}>{voice.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-2 px-4 rounded transition disabled:opacity-50"
            onClick={async () => {
              // Generate a new sample audio with the text 'Hello I am best' for the selected voice
              try {
                const res = await axios.post(`${API_BASE_URL}/api/podcast/generate-sample`, {
                  model: 'playai-tts',
                  voice: aiVoice,
                  text: "Hello I was added by ahanaf. Select me if you like my voice",
                  response_format: "wav"
                  //description: "Sample audio preview",
                });
                setSampleAudioUrl(res.data.audioUrl);
                // Play the new sample audio after it loads
                setTimeout(() => {
                  if (sampleAudioRef.current) {
                    sampleAudioRef.current.currentTime = 0;
                    sampleAudioRef.current.play();
                  }
                }, 200);
              } catch (err) {
                setSampleAudioUrl(null);
              }
            }}
            //disabled={!aiVoice}
          >
            Hear me
          </button>
        </div>

        {/* guest voice*/}
        <div className="mb-4">
          <label className="block text-zinc-300 mb-1">Select Guest Voice</label>
          <select
            className="w-full bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-zinc-400 focus:outline-none"
            value={aiGuestVoice}
            onChange={e => setaiGuestVoice(e.target.value)}
          >
            {GROQ_VOICE.map((voice) => (
              <option key={voice.value} value={voice.value}>{voice.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-2 px-4 rounded transition disabled:opacity-50"
            onClick={async () => {
              // Generate a new sample audio with the text 'Hello I am best' for the selected voice
              try {
                const res = await axios.post(`${API_BASE_URL}/api/podcast/generate-sample`, {
                  model: 'playai-tts',
                  voice: aiGuestVoice,
                  text: "Hello I was added by ahanaf. Select me if you like my voice",
                  response_format: "wav"
                  //description: "Sample audio preview",
                });
                setSampleAudioUrl(res.data.audioUrl);
                // Play the new sample audio after it loads
                setTimeout(() => {
                  if (sampleAudioRef.current) {
                    sampleAudioRef.current.currentTime = 0;
                    sampleAudioRef.current.play();
                  }
                }, 200);
              } catch (err) {
                setSampleAudioUrl(null);
              }
            }}
            //disabled={!aiVoice}
          >
            Hear me
          </button>
        </div>


        {/* {loading ? (
        <p className="mt-2 text-zinc-400">Generating AI Prompt
        <span className="dot-animation ml-1"></span>
        </p>
      ) : null}
      <style>{`
    .dot-animation::after {
      content: '';
      display: inline-block;
      animation: dots 1.4s steps(3, end) infinite;
    }

    @keyframes dots {
      0% {
        content: '';
      }
      33% {
        content: '.';
      }
      66% {
        content: '..';
      }
      100% {
        content: '...';
      }
    }
  `}</style> */}

        
         <div className="flex justify-between mb-3">
           <label className="text-zinc-300 mt-3">Enter Podcast Script</label>
            <button
              type="button"
              //onClick={() => setShowScriptModal(true)}
            >
              
              <CreateScriptModal 
        givenAiPrompt={givenAiPrompt}
        setGivenAiPrompt={setGivenAiPrompt}
        generatedScript={generatedScript}
        setGeneratedScript={setGeneratedScript}
        loadingScript={loadingScript}
        handleGenerate={handleGenerate}
        onUse={handleUseScript}
        onCancel={() => setGeneratedScript("")}
        />
        
            </button>
{/* {showScriptModal && ( )}  */}
            
            
          </div>


        <div className="mb-4">
         
          
          

          
          <div className="flex gap-2">
            <textarea
              className="flex-1 bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-white focus:outline-none"
              placeholder="Provide text to AI to generate audio"
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              rows={3}
            />
          </div>
         

          <div className="flex justify-self-end mt-3">
            <button
              type="button"
              className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-2 px-4 rounded transition disabled:opacity-50"
              // className="bg-[#23262F] text-white px-4 py-2 rounded border border-[#2A2D36] hover:bg-[#2A2D36] transition min-w-[120px]"
              onClick={handleGeneratePodcast}
              // disabled={generatingAudio || !scriptText}
            >
              {generatingAudio ? "Generating..." : "Generate Podcast"}
            </button>
          </div>



          {aiAudioUrl && (
            <audio ref={audioRef} controls src={aiAudioUrl} className="mt-2 w-full" />
          )}
        </div>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-transparent border border-[#2A2D36] rounded px-3 py-2 text-white focus:outline-none"
            placeholder="AI prompt to generate thumbnail"
            value={thumbnailPrompt}
            onChange={e => setThumbnailPrompt(e.target.value)}
          />
          <button
            type="button"
            className="bg-[#23262F] text-white px-4 py-2 rounded border border-[#2A2D36] hover:bg-[#2A2D36] transition min-w-[120px]"
            onClick={handleGenerateThumbnail}
            disabled={generatingThumbnail || !thumbnailPrompt}
          >
            {generatingThumbnail ? "Generating..." : "AI generate thumbnail"}
          </button>
          <button
            type="button"
            className="bg-[#23262F] text-white px-4 py-2 rounded border border-[#2A2D36] hover:bg-[#2A2D36] transition"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? "Uploading..." : "Upload custom image"}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        <div className="mb-6">
          <label className="block text-zinc-300 mb-2">Thumbnail Preview</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#2A2D36] rounded-lg py-8 bg-[#181A20] min-h-[120px]">
            {aiThumbnailUrl && (
              <img src={aiThumbnailUrl} alt="Thumbnail" className="max-h-auto rounded mb-2 w-95" />
            )}
            {!aiThumbnailUrl && (
              <span className="text-zinc-400 text-sm">No thumbnail selected</span>
            )}
          </div>
        </div>

            <div className="w-full max-w-xl mx-auto mb-10">
            <button
          type="button"
                      // className="w-full mt-2  text-black font-semibold py-2 px-4 rounded transition disabled:opacity-50"

          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded transition mt-4 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isCreating /* || !isFormComplete */}
        >
          {isCreating ? "Creating Podcast..." : "Create Podcast"}
        </button>
             </div>

             {/* Sample audio preview */}
             {sampleAudioUrl && (
              <audio ref={sampleAudioRef} controls src={sampleAudioUrl} className="mt-2 w-full" style={{ display: 'none' }} />
            )}
      </form>

    </div>
  );
};

export default CreatePodcast;