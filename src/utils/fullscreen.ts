// Fullscreen utility with cross-browser support
export interface FullscreenAPI {
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  isFullscreen: () => boolean;
  onFullscreenChange: (callback: () => void) => () => void;
  isSupported: () => boolean;
}

// Extend Document interface for fullscreen properties
declare global {
  interface Document {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }

  interface Element {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }
}

// Helper function to check if we're in a browser environment
const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

export const createFullscreenAPI = (element?: Element): FullscreenAPI => {
  const targetElement = element || (isBrowser() ? document.documentElement : null);

  const requestFullscreen = async (): Promise<void> => {
    if (!isBrowser() || !targetElement) {
      throw new Error("Fullscreen API not available on server");
    }

    try {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen();
      } else if (targetElement.webkitRequestFullscreen) {
        await targetElement.webkitRequestFullscreen();
      } else if (targetElement.mozRequestFullScreen) {
        await targetElement.mozRequestFullScreen();
      } else if (targetElement.msRequestFullscreen) {
        await targetElement.msRequestFullscreen();
      } else {
        throw new Error("Fullscreen API not supported");
      }
    } catch (error) {
      console.warn("Failed to enter fullscreen:", error);
      throw error;
    }
  };

  const exitFullscreen = async (): Promise<void> => {
    if (!isBrowser()) {
      throw new Error("Fullscreen API not available on server");
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      } else {
        throw new Error("Exit fullscreen API not supported");
      }
    } catch (error) {
      console.warn("Failed to exit fullscreen:", error);
      throw error;
    }
  };

  const isFullscreen = (): boolean => {
    if (!isBrowser()) {
      return false;
    }

    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  const onFullscreenChange = (callback: () => void): (() => void) => {
    if (!isBrowser()) {
      // Return no-op cleanup function for server
      return () => {};
    }

    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "msfullscreenchange",
    ];

    events.forEach((event) => {
      document.addEventListener(event, callback);
    });

    // Return cleanup function
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, callback);
      });
    };
  };

  const isSupported = (): boolean => {
    if (!isBrowser()) {
      return false;
    }

    return !!(
      document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen ||
      document.documentElement.mozRequestFullScreen ||
      document.documentElement.msRequestFullscreen
    );
  };

  return {
    requestFullscreen,
    exitFullscreen,
    isFullscreen,
    onFullscreenChange,
    isSupported,
  };
};

// Export default instance for document
export const fullscreenAPI = createFullscreenAPI();
