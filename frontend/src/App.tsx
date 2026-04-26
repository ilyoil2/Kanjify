import { useState, useEffect } from "react"
import KanjiDashboard from "./components/kanji-dashboard"
import { LoginPage } from "./components/login-page"
import { SignupPage } from "./components/signup-page"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("isAuthenticated") === "true"
  })
  const [user, setUser] = useState<{username: string, email: string} | null>(() => {
    const savedUser = localStorage.getItem("user")
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname)

  // Listen to popstate for back/forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener("popstate", handleLocationChange)
    return () => window.removeEventListener("popstate", handleLocationChange)
  }, [])

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path)
    setCurrentPath(path)
  }

  const handleGuestLogin = () => {
    const guestUser = { username: "Guest", email: "guest@kanjify.app" }
    setIsAuthenticated(true)
    setUser(guestUser)
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("user", JSON.stringify(guestUser))
    navigateTo("/")
  }

  const handleLoginSuccess = (userData: {username: string, email: string}) => {
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("user", JSON.stringify(userData))
    navigateTo("/")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    navigateTo("/login")
  }

  // Initial redirect if not logged in and not on auth pages
  useEffect(() => {
    const authPaths = ["/login", "/signup"]
    if (!isAuthenticated && !authPaths.includes(currentPath)) {
      navigateTo("/login")
    } else if (isAuthenticated && authPaths.includes(currentPath)) {
      navigateTo("/")
    }
  }, [isAuthenticated, currentPath])

  // Simple routing logic
  const renderContent = () => {
    if (currentPath === "/login") {
      return (
        <LoginPage 
          onGuestLogin={handleGuestLogin} 
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignup={() => navigateTo("/signup")} 
        />
      )
    }
    
    if (currentPath === "/signup") {
      return (
        <SignupPage 
          onGuestLogin={handleGuestLogin} 
          onNavigateToLogin={() => navigateTo("/login")} 
        />
      )
    }
    
    // Default to Dashboard if authenticated
    return <KanjiDashboard user={user} onLogout={handleLogout} currentPath={currentPath} navigateTo={navigateTo} />
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="kanjify-theme">
      <div className="min-h-screen bg-background text-foreground antialiased font-sans">
        {renderContent()}
      </div>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  )
}

export default App
