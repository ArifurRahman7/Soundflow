import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"
import { useState } from "react"

interface CreateScriptModalProps {
  givenAiPrompt: string
  setGivenAiPrompt: (s: string) => void
  generatedScript: string
  setGeneratedScript: (s: string) => void
  loadingScript: boolean
  handleGenerate: () => Promise<void>
  onUse: () => void;
  onCancel: () => void;
}

export function CreateScriptModal(
  {
  givenAiPrompt,
  setGivenAiPrompt,
  generatedScript,
  setGeneratedScript,
  loadingScript,
  handleGenerate,
  onUse,
  onCancel
}: CreateScriptModalProps
) {
  // keep track of which prompt we last generated
  const [lastPrompt, setLastPrompt] = useState<string>("")

  // wrap the passed‐in handleGenerate so we can record the prompt when it completes
  // const onGenerateClick = async () => {
  //   await handleGenerate()
  //   setLastPrompt(givenAiPrompt)
  // }

  // decide what the trigger should say
  const baseLabel =
  lastPrompt === givenAiPrompt && lastPrompt.length > 0
    ? "Regenerate"
    : "Generate"

  // now pick from three states
  const generateButtonLabel = loadingScript
    ? "Generating..."
    : baseLabel

  
  return (
    <Dialog>
        <DialogTrigger asChild>
          <span
          className="cursor-pointer bg-emerald-500 text-black font-semibold hover:bg-emerald-600 px-4 py-2 rounded border border-[#2A2D36] transition min-w-[120px]"
        >
          Generate Script Using AI
        </span>

        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Script Generator</DialogTitle>
            <DialogDescription>
              Give a Prompt, Generated Script, and use it in your TTS(Text To Speech).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mb-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Prompt</Label>
              <Input id="name-1" name="name" value={givenAiPrompt} onChange={(e) => {
                // console.log("Prompt changed", e.target.value);
                setGivenAiPrompt(e.target.value);
              }}/>
              <Button type="button" onClick={
                ()=>{ 
                  handleGenerate();
                  setLastPrompt(givenAiPrompt);
                }
              } >
                {generateButtonLabel}
                {/* {loadingScript ? "Generating..." : "Generate"} */}
              </Button>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="scriptarea">Generated Script</Label>
              <Textarea
                id="scriptarea"
                name="scriptarea"
                value={generatedScript}
                rows={3}
                onChange={(e) => setGeneratedScript(e.target.value)}
                placeholder="Generated script will appear here..."
              />
            </div>
          </div>
          {/* {loading && (
            <div className="text-sm text-gray-500">
              Generating script, please wait...
            </div>
          )}
           */}
          <DialogFooter>
  
            <DialogClose asChild>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              
            </DialogClose>
            
             <DialogClose asChild>
            {/* prompt na thakle error deya */}
            <Button type="submit" onClick={()=>{
              console.log("Using script with prompt:", generatedScript.trim().length);
              if (generatedScript.trim().length === 0) {
                toast.error("Please generate a script first.");
                // alert("Please Generate a script.");
                // return;
              }
              onUse();
            }} >
              Use
              </Button>
            </DialogClose>


          </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}