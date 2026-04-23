import KanjiDashboard from "./components/kanji-dashboard"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="kanjify-theme">
      <div className="min-h-screen bg-background text-foreground antialiased font-sans">
        <KanjiDashboard />
      </div>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  )
}

export default App
