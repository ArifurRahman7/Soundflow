import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home/HomePage.tsx";
import AuthCallBackPage from "./pages/auth-callback/AuthCallBackPage.tsx";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout.tsx";
import ChatPage from './pages/chat/ChatPage.tsx';
import AlbumPage from "./pages/album/AlbumPage.tsx";
import AdminPage from "./pages/Admin/AdminPage.tsx";
import CreatePodcast from "./components/podcast/CreatePodcast.tsx";
import AllPodCast from "./components/podcast/AllPodCast.tsx";

import { Toaster } from "react-hot-toast";
import NotFoundPage from "./pages/404/NotFoundPage.tsx";
import AllTTS from "./components/textToSpeech/AllTTS.tsx";
import CreateTTS from "./components/textToSpeech/CreateTTS.tsx";
import Lyricify from "./components/LyricsChat.tsx"
import VoiceRecorder from "./components/VoiceRecorder.tsx";

function App() {
	return (
		<>
			<Routes>
				<Route
					path='/sso-callback'
					element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
				/>
				<Route path='/auth-callback' element={<AuthCallBackPage />} />
				<Route path='/admin' element={<AdminPage />} />

				<Route element={<MainLayout />}>
					<Route path='/' element={<HomePage />} />
					<Route path='/chat' element={<ChatPage />} />
					<Route path='/create-podcast' element={<CreatePodcast />} />
					<Route path='/all-podcasts' element={<AllPodCast />} />
					<Route path='/create-tts' element={<CreateTTS />} />
					<Route path='/all-tts' element={<AllTTS />} />
					<Route path='/albums/:albumId' element={<AlbumPage />} />

					<Route path='/lyricify' element={<Lyricify />} />
					<Route path='/voice-recorder' element={<VoiceRecorder />} />

					<Route path='*' element={<NotFoundPage />} />
				</Route>
			</Routes>
			<Toaster />
		</>
	);
}

export default App;