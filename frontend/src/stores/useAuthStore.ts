import { axiosInstance } from "@/lib/axios.ts";
import { create } from "zustand";
import { AxiosError } from "axios";

interface AuthStore {
	isAdmin: boolean;
	isLoading: boolean;        
	error: string | null;  

	checkAdminStatus: () => Promise<void>;
	reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
	isAdmin: false,
	isLoading: false,
	error: null,

	checkAdminStatus: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/admin/check");
			set({ isAdmin: response.data.admin });
		} catch (error: AxiosError) {
			set({ isAdmin: false, error: error.response?.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	reset: () => {
		set({ isAdmin: false, isLoading: false, error: null });
	},
}));