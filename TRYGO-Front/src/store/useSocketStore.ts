import { create } from "zustand";
import io from "socket.io-client";
import Cookies from "js-cookie";
import { devtools } from "zustand/middleware";
import { MessageType } from "@/types/MessageType";
import { useHypothesisStore } from "./useHypothesisStore";
import { useHypothesesCoreStore } from "./useHypothesesCoreStore";
import { useHypothesesPersonProfileStore } from "./useHypothesesPersonProfileStore";
import { useProjectStore } from "./useProjectStore";

export enum ProjectStartType {
  StartFromScratch = "START_FROM_SCRATCH",
  UrlImport = "URL_IMPORT",
}

export interface GenerateProjectInput {
  startType: ProjectStartType;
  info: string;
  url?: string;
}

export interface GenerateProjectHypothesisInput {
  title: string;
  description: string;
  projectId: string;
}

export interface ProjectHypothesisGeneratedEvent {
  projectHypothesisId: string;
}

export interface CreateMessageInput {
  message: string;
  projectHypothesisId: string;
  projectId: string;
  messageType: MessageType;
  id?: string;
  wantToChangeInfo?: boolean;
  customerSegmentId?: string;
  hypothesesGtmChannelId?: string;
}

export interface AnswerCreatedEvent {
  message: string;
  id?: string;
}

interface SocketState {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;
  projectGenerationError: null | string;
  isGeneratingHypothesis: boolean;
  generatedHypothesisId: string | null;
  isLoading: boolean;
  projectId: string | null;
  error: string | null;
  chatLoading: boolean;
  chatError: string | null;
  shouldRefreshCore: boolean;
  projectGenerationTimeout: NodeJS.Timeout | null;
  isInitializing: boolean; // Flag to prevent concurrent initializations
  sendChatMessage: (input: CreateMessageInput) => void;
  initSocket: (token?: string) => void;
  generateProject: (input: GenerateProjectInput) => void;
  generateProjectHypothesis: (input: GenerateProjectHypothesisInput) => void;
  disconnect: () => void;
}

// let shouldRefreshCore = false;

export const useSocketStore = create<SocketState>()(
  devtools(
    (set, get) => ({
      socket: null,
      isConnected: false,
      projectGenerationError: null,
      isLoading: false,
      projectId: null,
      error: null,
      chatLoading: false,
      chatError: null,
      shouldRefreshCore: false,
      isGeneratingHypothesis: false,
      generatedHypothesisId: null,
      projectGenerationTimeout: null,
      isInitializing: false,

      initSocket: (tokenParam?: string) => {
        const token = tokenParam || Cookies.get("token");
        if (!token) {
          set({ error: "Authentication token not found" });
          return;
        }

        // Prevent concurrent initializations
        if (get().isInitializing) {
          return;
        }

        // Prevent multiple initializations - check both connected and existing socket
        const existingSocket = get().socket;
        if (existingSocket?.connected) {
          // Socket already connected, skip
          return;
        }
        
        // Set flag to prevent concurrent calls
        set({ isInitializing: true });
        
        // If socket exists (even if not connected), don't create a new one
        if (existingSocket) {
          console.log('Socket already exists, reusing instead of creating new');
          // Just try to connect if not already connected
          if (!existingSocket.connected) {
            existingSocket.connect();
          }
          set({ isInitializing: false });
          return;
        }

        const socket = io(import.meta.env.VITE_WS_SERVER_URL || "wss://ailaunchkit-backend-production.onrender.com", {
          transports: ["websocket"],
          query: { token },
          reconnection: true, // Enable reconnection for stability
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 5000,
          autoConnect: true,
          forceNew: false,
        });

        socket.on("connect", () => {
          set({ isConnected: true, error: null, isInitializing: false });
        });

        socket.on("disconnect", (reason) => {
          set({ isConnected: false });

          if (reason === "io server disconnect") {
            setTimeout(() => socket.connect(), 1000);
          }
        });

        socket.on("error", (error) => {
          set({ error: error.message || "Socket error", isLoading: false });
        });

        socket.on(
          "projectGenerationError",
          (data: { errorMessage: string }) => {
            // Clear timeout on error
            const { projectGenerationTimeout } = get();
            if (projectGenerationTimeout) {
              clearTimeout(projectGenerationTimeout);
              set({ projectGenerationTimeout: null });
            }

            set({
              projectGenerationError: data.errorMessage,
              isLoading: false,
            });
          }
        );

        socket.on("connect_error", (err) => {
          set({ error: `Connection error: ${err.message}`, isLoading: false, isInitializing: false });
          // Don't auto-reconnect - prevent multiple connection attempts
          console.error('Socket connection error:', err.message);
        });

        socket.on("projectGenerated", (data) => {
          // Clear timeout on successful generation
          const { projectGenerationTimeout } = get();
          if (projectGenerationTimeout) {
            clearTimeout(projectGenerationTimeout);
            set({ projectGenerationTimeout: null });
          }

          if (data.projectId) {
            set({ projectId: data.projectId, isLoading: false });
            
            // Перезавантажуємо сторінку після успішної генерації проекту
            window.location.reload();
          } else {
            set({
              error: "Invalid project data received",
              isLoading: false,
            });
          }
        });

        socket.on(
          "projectHypothesisGenerated",
          async (data: ProjectHypothesisGeneratedEvent) => {
            const projectHypothesisId = data.projectHypothesisId; // или data.hypothesis.projectId
            const projectId = useProjectStore.getState().activeProject.id;

            if (!projectId) return;

            try {
              // 1. Обновляем список гипотез
              await useHypothesisStore.getState().getHypotheses(projectId);

              // 2. Делаем активной последнюю гипотезу
              const hypotheses = useHypothesisStore.getState().hypotheses;
              if (hypotheses.length > 0) {
                const newHypothesis = hypotheses[hypotheses.length - 1];
                useHypothesisStore
                  .getState()
                  .setActiveHypothesis(newHypothesis.id);
                  set({
                    generatedHypothesisId: newHypothesis.id,
                    isGeneratingHypothesis: false,
                  });
              }
            } catch (err) {
              // Silent error handling
            }
            set({ isLoading: false });
          }
        );

        socket.on("answerCreated", async (data: AnswerCreatedEvent) => {
          set({ chatLoading: false, chatError: null });
          
          // Refresh message count after successful AI response
          try {
            const { useSubscriptionStore } = await import('./subscriptionStore');
            const { fetchAssistantMessages } = useSubscriptionStore.getState();
            await fetchAssistantMessages();
          } catch (error) {
            // Silent error handling
          }

          const pathname = window.location.pathname;
          const isCore = pathname.includes("dashboard");
          const isPerson = pathname.includes("person");


          if (get().shouldRefreshCore) {
            try {
              set({ isLoading: true });

              const { activeHypothesis } = useHypothesisStore.getState();


              if (!activeHypothesis?.id) {
                return;
              }

              if (isCore) {
                const coreStore = useHypothesesCoreStore.getState();
                await coreStore.getHypothesesCore(activeHypothesis.id);
                useHypothesesCoreStore.setState({ wasAutoRefreshed: true });
              }

              if (isPerson) {
                const personStore = useHypothesesPersonProfileStore.getState();
                await personStore.fetchProfile(activeHypothesis.id);
                useHypothesesPersonProfileStore.setState({
                  wasAutoRefreshed: true,
                });
              }

            } catch (error) {
              // Silent error handling
            } finally {
              set({ shouldRefreshCore: false, isLoading: false });
            }
          }
        });

        set({ socket, isConnected: false, error: null, isInitializing: true });
        
        // Reset isInitializing flag after timeout in case connection fails silently
        setTimeout(() => {
          if (!get().isConnected) {
            set({ isInitializing: false });
          }
        }, 6000);
      },

      generateProject: (input) => {
        const { socket, projectGenerationTimeout } = get();
        
        // Clear any existing timeout
        if (projectGenerationTimeout) {
          clearTimeout(projectGenerationTimeout);
        }
        
        set({ isLoading: true, error: null, projectId: null, projectGenerationError: null });

        // Set 2-minute timeout
        const timeout = setTimeout(() => {
          set({
            projectGenerationError: "Unfortunately, the servers are overloaded and we were unable to generate the project within 2 minutes",
            isLoading: false,
            projectGenerationTimeout: null,
          });
        }, 2 * 60 * 1000); // 2 minutes

        set({ projectGenerationTimeout: timeout });

        const data = {
          startType: input.startType,
          info: input.info,
          ...(input.url && { url: input.url }),
        };

        // Initialize socket if not exists (lazy initialization)
        let currentSocket = socket;
        if (!currentSocket || !currentSocket.connected) {
          const token = Cookies.get("token");
          if (token) {
            // Initialize socket on demand
            get().initSocket(token);
            currentSocket = get().socket;
          }
        }

        if (!currentSocket) {
          clearTimeout(timeout);
          set({ error: "Socket not initialized", isLoading: false, projectGenerationTimeout: null });
          return;
        }

        if (currentSocket.connected) {
          currentSocket.emit("generateProject", data);
          return;
        }

        const onConnect = () => {
          if (currentSocket) {
            currentSocket.emit("generateProject", data);
            currentSocket.off("connect", onConnect);
          }
        };

        currentSocket.on("connect", onConnect);
      },

      generateProjectHypothesis: (input) => {
        const { socket } = get();
        set({ isLoading: true, error: null, isGeneratingHypothesis: true, generatedHypothesisId: null });

        // Initialize socket if not exists (lazy initialization)
        let currentSocket = socket;
        if (!currentSocket || !currentSocket.connected) {
          const token = Cookies.get("token");
          if (token) {
            // Initialize socket on demand
            get().initSocket(token);
            currentSocket = get().socket;
          }
        }

        if (!currentSocket) {
          set({ error: "Socket not initialized" });
          return;
        }

        if (currentSocket.connected) {
          currentSocket.emit("generateProjectHypothesis", input);
          return;
        }

        const onConnect = () => {
          if (currentSocket) {
            currentSocket.emit("generateProjectHypothesis", input);
            currentSocket.off("connect", onConnect);
          }
        };

        currentSocket.on("connect", onConnect);
      },

      sendChatMessage: (input) => {
        const { socket } = get();
        set({
          chatLoading: true,
          chatError: null,
          shouldRefreshCore: !!input.wantToChangeInfo,
        });

        // Ensure socket exists and is connected
        let currentSocket = socket;
        
        // If no socket or not connected, initialize/reconnect
        if (!currentSocket || !currentSocket.connected) {
          const token = Cookies.get("token");
          if (!token) {
            set({ chatError: "Authentication token not found", chatLoading: false });
            return;
          }
          
          // Initialize socket if doesn't exist
          if (!currentSocket) {
            get().initSocket(token);
            currentSocket = get().socket;
          }
          
          // If socket exists but not connected, try to connect
          if (currentSocket && !currentSocket.connected) {
            currentSocket.connect();
          }
        }

        if (!currentSocket) {
          set({ chatError: "Socket not initialized", chatLoading: false });
          return;
        }

        // If already connected, send immediately
        if (currentSocket.connected) {
          console.log('[sendChatMessage] Socket подключен, отправляю сообщение');
          currentSocket.emit("createMessage", input);
          return;
        }

        // Wait for connection with timeout
        console.log('[sendChatMessage] Ожидание подключения socket...');
        let timeoutId: NodeJS.Timeout;
        
        const onConnect = () => {
          console.log('[sendChatMessage] Socket подключен, отправляю сообщение');
          if (timeoutId) clearTimeout(timeoutId);
          if (currentSocket) {
            currentSocket.emit("createMessage", input);
            currentSocket.off("connect", onConnect);
          }
        };

        const onConnectError = () => {
          console.error('[sendChatMessage] Ошибка подключения');
          if (timeoutId) clearTimeout(timeoutId);
          set({ chatError: "Socket connection failed", chatLoading: false });
          if (currentSocket) {
            currentSocket.off("connect", onConnect);
            currentSocket.off("connect_error", onConnectError);
          }
        };

        currentSocket.on("connect", onConnect);
        currentSocket.on("connect_error", onConnectError);

        // Timeout after 10 seconds
        timeoutId = setTimeout(() => {
          if (!currentSocket?.connected) {
            console.error('[sendChatMessage] Таймаут ожидания подключения');
            set({ chatError: "Socket connection timeout", chatLoading: false });
            if (currentSocket) {
              currentSocket.off("connect", onConnect);
              currentSocket.off("connect_error", onConnectError);
            }
          }
        }, 10000);
      },

      disconnect: () => {
        const { socket, projectGenerationTimeout } = get();
        
        // Clear timeout on disconnect
        if (projectGenerationTimeout) {
          clearTimeout(projectGenerationTimeout);
        }
        
        socket?.disconnect();
        set({
          socket: null,
          isConnected: false,
          isLoading: false,
          projectGenerationTimeout: null,
        });
      },
    }),
    { name: "useSocketStore" }
  )
);
